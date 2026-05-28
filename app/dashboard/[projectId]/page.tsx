import CarouselEditor from "@/components/CarouselEditor";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectEditorPage({ params }: PageProps) {
  const { projectId } = await params;
  return <CarouselEditor projectId={projectId} />;
}
