import type {
  FlipOfficeCustomerRow,
  FlipOfficeIntegrationSettings,
  FlipOfficeMenuRow,
  FlipOfficeOrderRow,
} from "@/lib/os/integrations/flip-office/types";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export type FlipOfficeApiResponse = {
  orders?: FlipOfficeOrderRow[];
  menu?: FlipOfficeMenuRow[];
  customers?: FlipOfficeCustomerRow[];
};

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };
}

export async function fetchFlipOfficeResource<T>(
  settings: FlipOfficeIntegrationSettings,
  resource: "orders" | "menu" | "customers",
  params?: Record<string, string>
): Promise<T> {
  if (!settings.apiUrl || !settings.apiKey) {
    throw new Error("Flip Office API URL and API Key are required.");
  }

  const url = new URL(settings.apiUrl.replace(/\/$/, ""));
  if (!url.pathname.endsWith(resource)) {
    url.pathname = `${url.pathname}/${resource}`.replace(/\/+/g, "/");
  }
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    headers: authHeaders(settings.apiKey),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Flip Office API error (${resource}): ${res.status}`);
  }

  return (await res.json()) as T;
}

export function buildDemoFlipOrders(db: ProcurementDb, date: string): FlipOfficeOrderRow[] {
  const recipes = db.recipes.filter((r) => r.status === "active").slice(0, 6);
  const outlets = [
    "Table Tales Prahladnagar",
    "Table Tales SBR",
    "Table Tales Nikol",
  ];
  const channels = ["dine_in", "takeaway", "swiggy", "zomato"];

  return outlets.flatMap((outlet, outletIdx) => {
    const pick = recipes.slice(outletIdx, outletIdx + 2);
    if (!pick.length) return [];

    const orderId = `demo_${outletIdx}_${date.replace(/-/g, "")}`;
    const items = pick.map((recipe, idx) => ({
      id: `${orderId}_line_${idx}`,
      menuItemId: recipe.id,
      name: recipe.name,
      code: recipe.id,
      quantity: idx === 0 ? 2 : 1,
      unitPrice: recipe.sellingPrice,
      total: recipe.sellingPrice * (idx === 0 ? 2 : 1),
    }));

    const total = items.reduce((s, i) => s + i.total, 0);
    return [
      {
        id: orderId,
        orderNumber: `FO-${date.replace(/-/g, "")}-${outletIdx + 1}`,
        outlet,
        date,
        time: "13:30",
        channel: channels[outletIdx % channels.length],
        customerName: "Walk-in Customer",
        paymentMethod: outletIdx % 2 === 0 ? "UPI" : "Card",
        subtotal: total,
        tax: Math.round(total * 0.05),
        discount: 0,
        total: Math.round(total * 1.05),
        items,
      },
    ];
  });
}

export function buildDemoFlipMenu(db: ProcurementDb): FlipOfficeMenuRow[] {
  return db.recipes
    .filter((r) => r.status === "active")
    .slice(0, 40)
    .map((r) => ({
      id: r.id,
      name: r.name,
      code: r.id,
      category: r.menuCategory ?? "Menu",
      price: r.sellingPrice,
      outlet: r.outlet,
      active: true,
    }));
}

export function buildDemoFlipCustomers(): FlipOfficeCustomerRow[] {
  return [
    {
      id: "fc_demo_1",
      name: "Amit Shah",
      phone: "+91 98765 10001",
      email: "amit@example.com",
      outlet: "Table Tales Prahladnagar",
      totalOrders: 24,
      totalSpend: 18500,
      lastOrderAt: new Date().toISOString(),
    },
    {
      id: "fc_demo_2",
      name: "Priya Desai",
      phone: "+91 98765 10002",
      outlet: "Table Tales SBR",
      totalOrders: 11,
      totalSpend: 9200,
      lastOrderAt: new Date().toISOString(),
    },
  ];
}

export async function loadFlipOfficeOrders(
  db: ProcurementDb,
  settings: FlipOfficeIntegrationSettings,
  date: string
): Promise<FlipOfficeOrderRow[]> {
  if (settings.apiUrl && settings.apiKey) {
    const payload = await fetchFlipOfficeResource<FlipOfficeApiResponse | FlipOfficeOrderRow[]>(
      settings,
      "orders",
      { date, from: date, to: date }
    );
    if (Array.isArray(payload)) return payload;
    return payload.orders ?? [];
  }
  return buildDemoFlipOrders(db, date);
}

export async function loadFlipOfficeMenu(
  db: ProcurementDb,
  settings: FlipOfficeIntegrationSettings
): Promise<FlipOfficeMenuRow[]> {
  if (settings.apiUrl && settings.apiKey) {
    const payload = await fetchFlipOfficeResource<FlipOfficeApiResponse | FlipOfficeMenuRow[]>(
      settings,
      "menu"
    );
    if (Array.isArray(payload)) return payload;
    return payload.menu ?? [];
  }
  return buildDemoFlipMenu(db);
}

export async function loadFlipOfficeCustomers(
  db: ProcurementDb,
  settings: FlipOfficeIntegrationSettings
): Promise<FlipOfficeCustomerRow[]> {
  if (settings.apiUrl && settings.apiKey) {
    const payload = await fetchFlipOfficeResource<
      FlipOfficeApiResponse | FlipOfficeCustomerRow[]
    >(settings, "customers");
    if (Array.isArray(payload)) return payload;
    return payload.customers ?? [];
  }
  return buildDemoFlipCustomers();
}
