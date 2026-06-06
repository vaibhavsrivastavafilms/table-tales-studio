import type { Recipe, RecipeIngredient } from "@/lib/os/procurement/types";
import { appId, getOsSupabase, replaceChildRows, upsertRows, type OsSupabase } from "@/lib/os/repositories/base";

function recipeToRow(recipe: Recipe) {
  return {
    legacy_id: recipe.id,
    name: recipe.name,
    selling_price: recipe.sellingPrice,
    yield: recipe.yield,
    yield_unit: recipe.yieldUnit,
    status: recipe.status,
    outlet: recipe.outlet,
    created_at: recipe.createdAt,
  };
}

function recipeFromRow(row: Record<string, unknown>): Recipe {
  return {
    id: appId(row as { legacy_id?: string | null; id: string }),
    branchId: (row.branch_id as string | null) ?? null,
    name: String(row.name),
    sellingPrice: Number(row.selling_price ?? 0),
    yield: Number(row.yield ?? 1),
    yieldUnit: String(row.yield_unit ?? "portion"),
    status: (row.status as Recipe["status"]) ?? "active",
    outlet: String(row.outlet ?? "Table Tales"),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export class RecipeRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<RecipeRepository> {
    return new RecipeRepository(await getOsSupabase());
  }

  async listRecipes(): Promise<Recipe[]> {
    const { data, error } = await this.supabase.from("recipes").select("*").order("name");
    if (error) throw new Error(`recipes list failed: ${error.message}`);
    return (data ?? []).map((row) => recipeFromRow(row as Record<string, unknown>));
  }

  async listIngredients(): Promise<RecipeIngredient[]> {
    const { data, error } = await this.supabase.from("recipe_ingredients").select("*");
    if (error) throw new Error(`recipe_ingredients list failed: ${error.message}`);
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        recipeId: String(r.recipe_id),
        itemId: String(r.item_id),
        itemName: String(r.item_name),
        quantity: Number(r.quantity),
        unit: String(r.unit),
      };
    });
  }

  async saveAll(recipes: Recipe[], ingredients: RecipeIngredient[]): Promise<void> {
    await upsertRows(this.supabase, "recipes", recipes.map(recipeToRow), "legacy_id");

    const { data: recipeRows } = await this.supabase.from("recipes").select("id, legacy_id");
    const recipeUuidByLegacy = new Map<string, string>();
    for (const row of recipeRows ?? []) {
      const legacy = (row as { legacy_id?: string | null }).legacy_id;
      if (legacy) recipeUuidByLegacy.set(legacy, String((row as { id: string }).id));
    }

    const parentIds = [...recipeUuidByLegacy.values()];
    const ingRows = ingredients.map((line) => ({
      id: line.id.length === 36 ? line.id : undefined,
      recipe_id: recipeUuidByLegacy.get(line.recipeId) ?? line.recipeId,
      item_id: line.itemId,
      item_name: line.itemName,
      quantity: line.quantity,
      unit: line.unit,
    }));

    await replaceChildRows(this.supabase, "recipe_ingredients", "recipe_id", parentIds, ingRows);
  }
}
