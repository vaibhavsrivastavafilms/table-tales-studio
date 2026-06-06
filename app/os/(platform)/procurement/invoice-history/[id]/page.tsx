import InvoiceHistoryView from "@/components/os/procurement/InvoiceHistoryView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceHistoryPage({ params }: PageProps) {
  const { id } = await params;
  return <InvoiceHistoryView billId={id} />;
}
