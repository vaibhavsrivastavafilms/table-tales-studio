import { NextResponse } from "next/server";
import { scoreCarouselProject } from "@/lib/story-engine/scoring-engine";
import type { CarouselProject } from "@/lib/story-engine/types";
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

  const project = parsed.data.project as CarouselProject | undefined;
  if (!project?.slides?.length) {
    return NextResponse.json({ error: "project required" }, { status: 400 });
  }

  const score = scoreCarouselProject(project);
  return NextResponse.json({
    score,
    project: { ...project, score },
  });
}
