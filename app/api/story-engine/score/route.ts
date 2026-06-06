import { NextResponse } from "next/server";
import { scoreCarouselProject } from "@/lib/story-engine/scoring-engine";
import { carouselProjectSchema } from "@/lib/story-engine/schema";
import { parseJsonBody, requireMethod } from "@/lib/apiSecurity";

export const runtime = "nodejs";

const METHODS = new Set(["POST"]);

export async function POST(req: Request) {
  const methodDenied = requireMethod(req, METHODS);
  if (methodDenied) return methodDenied;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const validated = carouselProjectSchema.safeParse(
    (parsed.data as { project?: unknown }).project
  );
  if (!validated.success) {
    return NextResponse.json({ error: "Invalid project" }, { status: 400 });
  }
  const project = validated.data as import("@/lib/story-engine/types").CarouselProject;

  const score = scoreCarouselProject(project);
  return NextResponse.json({
    score,
    project: { ...project, score },
  });
}
