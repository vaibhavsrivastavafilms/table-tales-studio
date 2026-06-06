import BillReviewView from "@/components/os/procurement/BillReviewView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BillReviewPage({ params }: PageProps) {
  const { id } = await params;
  return <BillReviewView billId={id} />;
}
