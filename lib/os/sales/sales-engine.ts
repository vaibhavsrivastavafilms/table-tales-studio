import { getRecipeIngredients } from "@/lib/os/kitchen/recipes";
import type {
  ProcurementDb,
  Sale,
  SalesChannel,
} from "@/lib/os/procurement/types";

const CHANNEL_LABELS: Record<SalesChannel, string> = {
  dine_in: "Dine In",
  takeaway: "Takeaway",
  swiggy: "Swiggy",
  zomato: "Zomato",
};

export function channelLabel(channel: SalesChannel): string {
  return CHANNEL_LABELS[channel];
}

export function computeSalesSummary(db: ProcurementDb, date?: string) {
  const sales = date
    ? db.sales.filter((s) => s.consumedAt.slice(0, 10) === date)
    : db.sales;

  const byChannel = new Map<SalesChannel, { count: number; revenue: number }>();
  for (const sale of sales) {
    const current = byChannel.get(sale.channel) ?? { count: 0, revenue: 0 };
    byChannel.set(sale.channel, {
      count: current.count + sale.quantity,
      revenue: current.revenue + sale.totalRevenue,
    });
  }

  return {
    totalOrders: sales.length,
    totalRevenue: sales.reduce((s, r) => s + r.totalRevenue, 0),
    byChannel: [...byChannel.entries()].map(([channel, stats]) => ({
      channel,
      label: channelLabel(channel),
      ...stats,
    })),
  };
}

export function buildConsumptionMovements(
  db: ProcurementDb,
  sale: Sale,
  saleId: string
) {
  const recipe = db.recipes.find((r) => r.id === sale.recipeId);
  if (!recipe) return [];

  const ingredients = getRecipeIngredients(db, sale.recipeId);
  const now = sale.consumedAt;

  return ingredients.map((ing) => ({
    itemId: ing.itemId,
    quantity: -(ing.quantity * sale.quantity),
    note: `Sale ${saleId} · ${recipe.name} × ${sale.quantity}`,
    createdAt: now,
  }));
}
