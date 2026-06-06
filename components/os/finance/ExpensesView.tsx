"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import BranchFilterBar from "@/components/os/BranchFilterBar";
import {
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  expenseAmountRupees,
  expensesByCategory,
  exportExpensesCsv,
  listExpenses,
  listRecurringExpenses,
} from "@/lib/os/finance/expenses";
import { formatPaise } from "@/lib/os/money";
import { currentMonthKey } from "@/lib/os/reports/monthly-mis";
import type { ExpenseCategory, ExpenseStatus } from "@/lib/os/procurement/types";

export default function ExpensesView() {
  const { branchDb, activeBranchId, db, addExpense } = useProcurement();
  const [month, setMonth] = useState(currentMonthKey());
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const expenses = useMemo(
    () =>
      listExpenses(branchDb, activeBranchId, {
        month,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    [branchDb, activeBranchId, month, fromDate, toDate, categoryFilter, statusFilter]
  );

  const recurring = useMemo(
    () => listRecurringExpenses(branchDb, activeBranchId),
    [branchDb, activeBranchId]
  );

  const byCategory = useMemo(
    () => expensesByCategory(branchDb, month, activeBranchId),
    [branchDb, month, activeBranchId]
  );

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "Miscellaneous" as ExpenseCategory,
    vendorName: "",
    description: "",
    amountRupees: "",
    isRecurring: false,
    recurrence: "monthly" as "monthly" | "weekly",
  });

  const approvedTotal = expenses
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + e.amountPaise, 0);
  const pending = expenses.filter((e) => e.status === "pending").length;

  function handleSubmit() {
    if (!form.description || !form.amountRupees) return;
    addExpense({
      date: form.date,
      category: form.category,
      vendorName: form.vendorName || null,
      description: form.description,
      amountRupees: Number(form.amountRupees),
      isRecurring: form.isRecurring,
      recurrence: form.isRecurring ? form.recurrence : null,
    });
    setForm({ ...form, description: "", amountRupees: "", vendorName: "" });
  }

  function handleAttachment(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      if (!form.description || !form.amountRupees) return;
      addExpense({
        date: form.date,
        category: form.category,
        vendorName: form.vendorName || null,
        description: form.description,
        amountRupees: Number(form.amountRupees),
        attachmentUrl: String(reader.result),
        isRecurring: form.isRecurring,
        recurrence: form.isRecurring ? form.recurrence : null,
      });
      setForm({ ...form, description: "", amountRupees: "", vendorName: "" });
    };
    reader.readAsDataURL(file);
  }

  function exportCsv() {
    const csv = exportExpensesCsv(expenses);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Expense Management"
        description="Operating expenses with approval workflow, recurring setup, and monthly category tracking."
      />
      <BranchFilterBar />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Month approved" value={formatPaise(approvedTotal)} />
        <StatCard label="Pending approval" value={pending} />
        <StatCard label="Recurring active" value={recurring.length} />
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
          placeholder="From"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
          placeholder="To"
        />
        <select
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value as ExpenseCategory | "all")
          }
        >
          <option value="all">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EXPENSE_CATEGORY_LABELS[c as ExpenseCategory]}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ExpenseStatus | "all")}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <section className="os-card grid gap-3 p-5 md:grid-cols-2">
        <h3 className="md:col-span-2 text-sm font-semibold">Add expense</h3>
        <Input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="bg-white/90"
        />
        <select
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value as ExpenseCategory })
          }
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EXPENSE_CATEGORY_LABELS[c as ExpenseCategory]}
            </option>
          ))}
        </select>
        <Input
          placeholder="Vendor name"
          value={form.vendorName}
          onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
          className="bg-white/90"
        />
        <Input
          placeholder="Amount (₹)"
          value={form.amountRupees}
          onChange={(e) => setForm({ ...form, amountRupees: e.target.value })}
          className="bg-white/90"
        />
        <Input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="bg-white/90 md:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={form.isRecurring}
            onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
          />
          Recurring expense
          {form.isRecurring ? (
            <select
              className="rounded-md border border-[var(--os-border)] bg-white/90 px-2 py-1 text-xs"
              value={form.recurrence}
              onChange={(e) =>
                setForm({
                  ...form,
                  recurrence: e.target.value as "monthly" | "weekly",
                })
              }
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          ) : null}
        </label>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button onClick={handleSubmit}>Submit expense</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            Upload attachment
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAttachment(file);
            }}
          />
        </div>
        <p className="text-xs text-[var(--os-fg-muted-on-card)] md:col-span-2">
          Expenses above ₹5,000 require manager approval · above ₹20,000 require owner
          approval
        </p>
      </section>

      <section className="os-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Monthly total by category</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--os-border)] text-left text-[var(--os-fg-muted-on-card)]">
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.map((row) => (
                <tr key={row.category} className="border-b border-[var(--os-border)]/50">
                  <td className="py-2 pr-4">{row.label}</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatPaise(row.totalPaise)}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2 pr-4">Total</td>
                <td className="py-2 text-right tabular-nums">{formatPaise(approvedTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="os-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Expense list</h3>
        <ul className="space-y-2 text-sm">
          {expenses.slice(0, 40).map((e) => (
            <li key={e.id} className="flex flex-wrap justify-between gap-2 border-b border-[var(--os-border)]/40 py-2">
              <span>
                {e.date} · {e.description} · {EXPENSE_CATEGORY_LABELS[e.category]}
                {e.isRecurring ? ` · ${e.recurrence}` : ""}
              </span>
              <span className="flex items-center gap-2">
                <StatusBadge status={e.status} />
                {formatPaise(e.amountPaise)}
              </span>
            </li>
          ))}
          {!expenses.length ? (
            <li className="py-4 text-[var(--os-fg-muted-on-card)]">No expenses match filters.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
