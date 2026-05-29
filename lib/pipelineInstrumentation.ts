import type { GenerationStage } from "@/lib/generationStages";
import type { PipelineProgressEvent } from "@/lib/aiCreativeDirector";

export type PipelinePhaseId =
  | "pipeline"
  | "analysis"
  | "segmentation"
  | "editorial"
  | "redesign"
  | "doodles"
  | "finalize";

type PhaseStatus = "pending" | "running" | "done" | "skipped" | "timeout" | "error";

const PHASE_LABELS: Record<PipelinePhaseId, string> = {
  pipeline: "Pipeline",
  analysis: "Analysis",
  segmentation: "Segmentation",
  editorial: "Editorial",
  redesign: "Redesign",
  doodles: "Doodles",
  finalize: "Finalize",
};

const LOG_LABELS: Record<PipelinePhaseId, [string, string]> = {
  pipeline: ["[Pipeline Start]", "[Pipeline Complete]"],
  analysis: ["[Analysis Start]", "[Analysis Complete]"],
  segmentation: ["[Segmentation Start]", "[Segmentation Complete]"],
  editorial: ["[Editorial Transform Start]", "[Editorial Transform Complete]"],
  redesign: ["[AI Redesign Start]", "[AI Redesign Complete]"],
  doodles: ["[Doodle Start]", "[Doodle Complete]"],
  finalize: ["[Finalize Start]", "[Finalize Complete]"],
};

export type PipelineProgressHandler = (event: PipelineProgressEvent) => void;

export function createPipelineTracker(onProgress?: PipelineProgressHandler) {
  const startedAt = performance.now();
  const phaseStatus = new Map<PipelinePhaseId, PhaseStatus>();
  const phaseMs = new Map<PipelinePhaseId, number>();

  for (const id of Object.keys(PHASE_LABELS) as PipelinePhaseId[]) {
    phaseStatus.set(id, "pending");
  }

  function stamp(label: string, extra?: Record<string, unknown>) {
    const elapsed = Math.round(performance.now() - startedAt);
    console.info(`[TableTales:pipeline] ${label}`, { elapsedMs: elapsed, ...extra });
  }

  function emitStage(stage: GenerationStage) {
    onProgress?.({ type: "stage", stage });
  }

  function startPhase(id: PipelinePhaseId, stage?: GenerationStage) {
    phaseStatus.set(id, "running");
    phaseMs.set(id, performance.now());
    stamp(LOG_LABELS[id][0]);
    if (stage) emitStage(stage);
  }

  function completePhase(id: PipelinePhaseId, stage?: GenerationStage) {
    const began = phaseMs.get(id);
    phaseStatus.set(id, "done");
    stamp(LOG_LABELS[id][1], {
      durationMs: began ? Math.round(performance.now() - began) : undefined,
    });
    if (stage) emitStage(stage);
  }

  function skipPhase(id: PipelinePhaseId, reason: string) {
    phaseStatus.set(id, "skipped");
    stamp(`${LOG_LABELS[id][0]} (skipped)`, { reason });
  }

  function failPhase(id: PipelinePhaseId, reason: string) {
    phaseStatus.set(id, phaseStatus.get(id) === "running" ? "timeout" : "error");
    console.warn(`[TableTales:pipeline] ${PHASE_LABELS[id]} failed`, { reason });
  }

  function printSummary() {
    const icon = (s: PhaseStatus | undefined) => {
      switch (s) {
        case "done":
          return "✓";
        case "skipped":
          return "—";
        case "timeout":
          return "⏱";
        case "error":
          return "✗";
        case "running":
          return "…";
        default:
          return "○";
      }
    };

    const lines = (["analysis", "segmentation", "editorial", "redesign", "doodles", "finalize"] as const)
      .map((id) => `  ${PHASE_LABELS[id]} ${icon(phaseStatus.get(id))}`)
      .join("\n");

    console.info(
      `[TableTales:pipeline] Summary (${Math.round(performance.now() - startedAt)}ms)\nPipeline:\n${lines}`
    );
  }

  return {
    stamp,
    emitStage,
    startPhase,
    completePhase,
    skipPhase,
    failPhase,
    printSummary,
  };
}

export async function withPipelineTimeout<T>(
  label: string,
  ms: number,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms`)),
          ms
        );
      }),
    ]);
    return result;
  } catch (err) {
    console.warn("[TableTales:pipeline] timeout/fallback", {
      label,
      message: err instanceof Error ? err.message : String(err),
    });
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function settleAll<T>(
  tasks: (() => Promise<T>)[]
): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(tasks.map((task) => task()));
}
