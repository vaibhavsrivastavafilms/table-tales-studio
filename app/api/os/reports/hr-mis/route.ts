import { NextResponse } from "next/server";
import OpenAI from "openai";
import { generateHrInsights } from "@/lib/os/reports/hr-mis";
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
    const baseline = generateHrInsights(db, month);
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
            "You are an HR analyst for restaurants. Return { insights: [{ id, severity, title, detail, module }] } with workforce-focused insights. module should be hr, payroll, labor_cost, or workforce.",
        },
        {
          role: "user",
          content: JSON.stringify({
            month,
            employees: db.employees.length,
            attendanceRecords: db.attendanceRecords.filter((a) =>
              a.date.startsWith(month)
            ).length,
            baseline,
          }),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    const parsed = raw ? (JSON.parse(raw) as { insights: OrgInsight[] }) : null;
    return NextResponse.json({
      insights: parsed?.insights?.length ? parsed.insights : baseline,
      source: "openai",
    });
  } catch {
    return NextResponse.json({ insights: [], source: "error" });
  }
}
