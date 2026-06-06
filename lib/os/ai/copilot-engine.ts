import { buildBranchComparisonMatrix, orgRevenueForRange, resolveTimeRange } from "@/lib/os/analytics/time-intelligence";
import { generateMissingDataReport } from "@/lib/os/platform/missing-data-report";
import { calculateBusinessReadiness } from "@/lib/os/platform/business-readiness";
import { buildExecutiveDashboard } from "@/lib/os/owner/executive-dashboard";
import { generateOrgInsights } from "@/lib/os/reports/ai-insights";
import { computeMonthlyMis, currentMonthKey } from "@/lib/os/reports/monthly-mis";
import { generateSmartPurchaseRecommendations } from "@/lib/os/procurement/purchase-intelligence";
import { computeRecoveryDashboardStats } from "@/lib/os/procurement/recovery";
import { buildFoodCostReport } from "@/lib/os/reports/food-cost";
import { computeAttendanceStats } from "@/lib/os/hr/attendance";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export type CopilotMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
};

export type CopilotResponse = {
  answer: string;
  citations: string[];
  followUps: string[];
};

function branchShort(name: string): string {
  if (name.includes("Prahladnagar")) return "Prahladnagar";
  if (name.includes("SBR")) return "SBR";
  if (name.includes("Nikol")) return "Nikol";
  if (name.includes("Central") || name.includes("Pure Foods")) return "Pure Foods";
  return name;
}

export function answerOwnerQuestion(db: ProcurementDb, question: string): CopilotResponse {
  const q = question.toLowerCase().trim();
  const month = currentMonthKey();
  const exec = buildExecutiveDashboard(db);
  const readiness = calculateBusinessReadiness(db);
  const branches = buildBranchComparisonMatrix(db, resolveTimeRange("this_month"));
  const lifetime = buildBranchComparisonMatrix(db, resolveTimeRange("lifetime"));
  const mis = computeMonthlyMis(db, month);
  const recovery = computeRecoveryDashboardStats(db);
  const foodReport = buildFoodCostReport(db);
  const attendance = computeAttendanceStats(db, month);
  const purchaseRecs = generateSmartPurchaseRecommendations(db, 3);
  const gaps = generateMissingDataReport(db);
  const insights = generateOrgInsights(db, month);

  const citations: string[] = [];
  const followUps = [
    "Which branch has the highest food cost?",
    "What is our projected profit this month?",
    "Which items should we reorder?",
    "What data is still missing?",
  ];

  if (q.includes("most profitable") || q.includes("best branch") || q.includes("makes the most")) {
    const best = [...lifetime].sort((a, b) => b.profit - a.profit)[0];
    const worst = [...lifetime].sort((a, b) => a.profit - b.profit)[0];
    citations.push("Lifetime branch comparison", "Monthly MIS");
    return {
      answer: best
        ? `${branchShort(best.name)} is the most profitable branch lifetime with ₹${Math.round(best.profit).toLocaleString("en-IN")} estimated profit and ${best.lifetimeContributionPercent.toFixed(0)}% of org revenue.${worst && worst.branchId !== best.branchId ? ` ${branchShort(worst.name)} needs attention with ₹${Math.round(worst.profit).toLocaleString("en-IN")} profit.` : ""}`
        : "Insufficient sales data to rank branch profitability. Connect Flip Office or import sales.",
      citations,
      followUps,
    };
  }

  if (q.includes("food cost") && (q.includes("increas") || q.includes("why") || q.includes("high"))) {
    const high = [...branches].sort((a, b) => b.foodCostPercent - a.foodCostPercent)[0];
    const target = mis.foodCostPercent;
    citations.push("Food cost report", "Branch comparison");
    const topRecipe = [...foodReport].sort((a, b) => b.foodCostPercent - a.foodCostPercent)[0];
    return {
      answer: `Org food cost is ${mis.foodCostPercent.toFixed(1)}% this month.${high ? ` ${branchShort(high.name)} runs highest at ${high.foodCostPercent.toFixed(1)}%.` : ""}${topRecipe ? ` Menu item "${topRecipe.recipeName}" is at ${topRecipe.foodCostPercent.toFixed(1)}% food cost — review portioning or ingredient rates.` : ""} Readiness for costing data is ${readiness.scores.foodCost}%.`,
      citations,
      followUps,
    };
  }

  if (q.includes("vendor") && (q.includes("loss") || q.includes("disput") || q.includes("recovery"))) {
    const top = recovery.topVendorCredits[0];
    citations.push("Vendor recovery dashboard");
    return {
      answer: top
        ? `${top.vendorName} has the highest recovery exposure at ₹${top.amount.toLocaleString("en-IN")}. Total pending recovery is ₹${recovery.pendingRecovery.toLocaleString("en-IN")}. Review disputes and credit notes to protect margin.`
        : `Pending vendor recovery stands at ₹${recovery.pendingRecovery.toLocaleString("en-IN")}. No single vendor dominates disputes currently.`,
      citations,
      followUps,
    };
  }

  if (q.includes("projected profit") || q.includes("profit this month") || q.includes("net profit")) {
    citations.push("Monthly MIS", "Executive dashboard");
    return {
      answer: `Projected net profit this month is ₹${Math.round(mis.estimatedProfit).toLocaleString("en-IN")} at ${mis.estimatedProfitMargin.toFixed(1)}% margin. Revenue ₹${Math.round(mis.revenue).toLocaleString("en-IN")}, food cost ${mis.foodCostPercent.toFixed(1)}%, labor ${mis.laborCostPercent.toFixed(1)}%, expenses ₹${Math.round(mis.operatingExpenses).toLocaleString("en-IN")}. Business readiness ${readiness.scores.overall}% — ${readiness.overallLabel}.`,
      citations,
      followUps,
    };
  }

  if (q.includes("repric") || q.includes("price") || q.includes("menu item")) {
    const overTarget = foodReport.filter((r) => r.foodCostPercent > 35).slice(0, 3);
    citations.push("Food cost report");
    return {
      answer: overTarget.length
        ? `Consider repricing or reformulating: ${overTarget.map((r) => `${r.recipeName} (${r.foodCostPercent.toFixed(0)}% FC)`).join(", ")}. Target food cost is 32–34% for most outlets.`
        : "No critical repricing flags — top items are within target food cost bands.",
      citations,
      followUps,
    };
  }

  if (q.includes("attendance") || q.includes("absent") || q.includes("employee")) {
    const low = db.employees
      .map((e) => {
        const records = db.attendanceRecords.filter(
          (a) => a.employeeId === e.id && a.date.startsWith(month)
        );
        const absent = records.filter((r) => r.status === "absent").length;
        return { e, absent, total: records.length };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.absent - a.absent)[0];
    citations.push("HR attendance", "Monthly MIS");
    return {
      answer: `Org attendance rate is ${attendance.attendanceRate.toFixed(1)}% this month.${low && low.absent > 0 ? ` ${low.e.name} has ${low.absent} absent days — review scheduling.` : ""} Labor cost is ${mis.laborCostPercent.toFixed(1)}% of revenue.`,
      citations,
      followUps,
    };
  }

  if (q.includes("missing") || q.includes("readiness") || q.includes("setup")) {
    citations.push("Missing data report", "Business readiness");
    const top = gaps.gaps.slice(0, 3);
    return {
      answer: `${gaps.summary}${top.length ? ` Top gaps: ${top.map((g) => g.title).join("; ")}.` : ""}`,
      citations,
      followUps,
    };
  }

  if (q.includes("reorder") || q.includes("purchase") || q.includes("stock")) {
    citations.push("Procurement intelligence");
    return {
      answer: purchaseRecs.length
        ? `Smart purchase recommendations: ${purchaseRecs.map((r) => `${r.itemName} (${r.suggestedQty}${r.unit})`).join("; ")}.`
        : "Stock levels are healthy — no urgent reorders from purchase history analysis.",
      citations,
      followUps,
    };
  }

  if (q.includes("revenue") || q.includes("sales")) {
    const monthRev = orgRevenueForRange(db, resolveTimeRange("this_month"));
    citations.push("Sales engine", "Branch comparison");
    const leader = [...branches].sort((a, b) => b.revenue - a.revenue)[0];
    return {
      answer: `Month-to-date revenue is ₹${Math.round(monthRev).toLocaleString("en-IN")}.${leader ? ` ${branchShort(leader.name)} contributes ${leader.lifetimeContributionPercent.toFixed(0)}% of branch revenue this period.` : ""} Today sales per executive snapshot: ${exec.snapshot.find((s) => s.id === "today_sales")?.display ?? "—"}.`,
      citations,
      followUps,
    };
  }

  const topInsight = insights[0];
  citations.push("AI insights engine");
  return {
    answer: topInsight
      ? `${topInsight.detail} Ask about profitability, food cost, vendors, attendance, missing data, or purchase recommendations for deeper answers.`
      : `Business readiness is ${readiness.scores.overall}%. Connect sales, complete recipe costing, and sync Flip Office for full intelligence. What would you like to analyze?`,
    citations,
    followUps,
  };
}

export const COPILOT_STARTER_QUESTIONS = [
  "Which branch is most profitable?",
  "Why is food cost increasing?",
  "Which vendor is causing losses?",
  "What is our projected profit this month?",
  "Which items should be repriced?",
  "Which employees have low attendance?",
  "What data is still missing?",
];
