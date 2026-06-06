import VendorDetailView from "@/components/os/procurement/VendorDetailView";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VendorDetailView vendorId={id} />;
}
