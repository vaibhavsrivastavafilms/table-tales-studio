import { NextResponse } from "next/server";
import OpenAI from "openai";
import { generateProcurementInsights } from "@/lib/os/procurement/analytics";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { db?: ProcurementDb };
    const db = body.db;
    if (!db) {
      return NextResponse.json({ error: "db required" }, { status: 400 });
    }

    const baseline = generateProcurementInsights(db);
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
            "You are a hospitality procurement analyst. Given metrics JSON, return { insights: [{ id, severity: info|warning|critical, title, detail }] } with 3-5 actionable insights.",
        },
        {
          role: "user",
          content: JSON.stringify({
            vendors: db.vendors.length,
            postedBills: db.purchaseBills.filter((b) => b.status === "posted").length,
            omissions: db.omissionCases.filter((c) => c.status === "pending").length,
            lowStock: db.inventoryItems.filter((i) => i.currentStock < i.parLevel).length,
            baseline,
          }),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ insights: baseline, source: "rules" });
    }

    const parsed = JSON.parse(raw) as { insights: typeof baseline };
    return NextResponse.json({
      insights: parsed.insights?.length ? parsed.insights : baseline,
      source: "openai",
    });
  } catch {
    return NextResponse.json({ insights: [], source: "error" });
  }
}
