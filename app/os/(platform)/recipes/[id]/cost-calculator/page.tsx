import RecipeCostCalculatorView from "@/components/os/kitchen/RecipeCostCalculatorView";

type PageProps = { params: Promise<{ id: string }> };

export default async function RecipeCostCalculatorPage({ params }: PageProps) {
  const { id } = await params;
  return <RecipeCostCalculatorView recipeId={id} />;
}
