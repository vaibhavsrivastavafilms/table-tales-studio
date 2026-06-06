import { NextResponse } from "next/server";
import OpenAI from "openai";
import { generateOrgInsights } from "@/lib/os/reports/ai-insights";
import {
  buildMonthlyMisBreakdown,
  computeMonthlyMis,
  currentMonthKey,
} from "@/lib/os/reports/monthly-mis";
import type { OrgInsight, ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      db?: ProcurementDb;
      month?: string;
      enhance?: boolean;
    };
    const db = body.db;
    if (!db) {
      return NextResponse.json({ error: "db required" }, { status: 400 });
    }

    const month = body.month ?? currentMonthKey();
    const mis = computeMonthlyMis(db, month);
    const breakdown = buildMonthlyMisBreakdown(db, month);
    const baseline = generateOrgInsights(db, month);

    if (!body.enhance) {
      return NextResponse.json({ mis, breakdown, insights: baseline, source: "rules" });
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ mis, breakdown, insights: baseline, source: "rules" });
    }

    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are the owner advisor for Table Tales restaurant group. Given monthly MIS JSON, return { insights: [{ id, severity: info|warning|critical, title, detail, module }] } with 6-10 owner-level insights across operations, finance, procurement, inventory, workforce, payroll.",
        },
        {
          role: "user",
          content: JSON.stringify({ month, mis, breakdown, baseline }),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    const parsed = raw ? (JSON.parse(raw) as { insights: OrgInsight[] }) : null;

    return NextResponse.json({
      mis,
      breakdown,
      insights: parsed?.insights?.length ? parsed.insights : baseline,
      source: "openai",
    });
  } catch {
    return NextResponse.json({ insights: [], source: "error" }, { status: 500 });
  }
}
