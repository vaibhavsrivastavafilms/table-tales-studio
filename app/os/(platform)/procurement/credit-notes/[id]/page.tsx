import CreditNoteDetailView from "@/components/os/procurement/CreditNoteDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CreditNoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <CreditNoteDetailView creditNoteId={id} />;
}
