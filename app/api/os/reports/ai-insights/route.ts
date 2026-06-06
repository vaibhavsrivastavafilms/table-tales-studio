import { NextResponse } from "next/server";
import OpenAI from "openai";
import { generateOrgInsights } from "@/lib/os/reports/ai-insights";
import { currentMonthKey } from "@/lib/os/reports/monthly-mis";
import type { OrgInsight, ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { db?: ProcurementDb; month?: string };
    const db = body.db;
    if (!db) {
      return NextResponse.json({ error: "db required" }, { status: 400 });
    }

    const month = body.month ?? currentMonthKey();
    const baseline = generateOrgInsights(db, month);
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ insights: baseline, source: "rules" });
    }

    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a restaurant operations analyst for Table Tales and Pure Foods Central Kitchen. Given baseline insights JSON, return { insights: [{ id, severity: info|warning|critical, title, detail, module }] } with 6-10 owner-level insights. Modules: procurement, inventory, recovery, food_cost, ledger, sales, hr, payroll, labor_cost, workforce, finance.",
        },
        {
          role: "user",
          content: JSON.stringify({
            month,
            baseline,
            vendors: db.vendors.length,
            recipes: db.recipes.length,
            salesToday: db.sales.filter(
              (s) => s.consumedAt.slice(0, 10) === new Date().toISOString().slice(0, 10)
            ).length,
            lowStock: db.inventoryItems.filter((i) => i.currentStock < i.parLevel).length,
          }),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ insights: baseline, source: "rules" });
    }

    const parsed = JSON.parse(raw) as { insights: OrgInsight[] };
    return NextResponse.json({
      insights: parsed.insights?.length ? parsed.insights : baseline,
      source: "openai",
    });
  } catch {
    return NextResponse.json({ insights: [], source: "error" });
  }
}
