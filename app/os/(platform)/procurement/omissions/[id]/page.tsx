import OmissionDetailView from "@/components/os/procurement/OmissionDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OmissionDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <OmissionDetailView caseId={id} />;
}
