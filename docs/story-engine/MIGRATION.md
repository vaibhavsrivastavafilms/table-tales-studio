# Story Engine — Architecture & Migration

## Core principle

**Never generate slides directly.** Pipeline:

```
Creative Brief → Story Architecture → Slide Plan → Visual Plan → renderCarousel(project)
```

Single source of truth: `CarouselProject` JSON (`lib/story-engine/types.ts`).

## Folder structure

```
lib/story-engine/
  types.ts              # CarouselProject, Slide, CarouselScore
  constants.ts          # Roles, frameworks, structure beats
  story-engine.ts       # Brief → story → slide plan
  visual-planner.ts     # Role → visualType, layout, overlay
  creative-director.ts  # enhanceSlide(slideId, instruction)
  scoring-engine.ts     # Hook, curiosity, readability, retention, shareability
  adapters.ts           # Captions ↔ CarouselProject (legacy bridge)
  render-carousel.ts    # renderCarousel(project) — UI derivation only
  store.ts              # Zustand store
  index.ts

app/api/story-engine/
  generate/route.ts     # Full pipeline + optional OpenAI copy
  enhance-slide/route.ts
  score/route.ts
```

## Zustand store

`useCarouselProjectStore`:

- `runGenerateStorytelling(input)` — runs API, sets `project` + `renderModel` + `captions`
- `enhanceSlide(slideId, instruction)` — single-slide rewrite (not full carousel regen)
- `patchCaptions(captions)` — writes back into project JSON

## Legacy mapping

| SlideKey | Story role     |
|----------|----------------|
| hook     | hook           |
| slide1   | problem        |
| slide2   | context        |
| slide3   | insight        |
| slide4   | transformation |
| cta      | cta            |

Caption text = `headline` + newline + `body` via `projectToCaptions()`.

## Migration phases

### Done in this pass

- Domain model + services + APIs + Zustand store
- `renderCarousel()` renderer
- Studio generate path wired to story engine (see `CarouselEditor`)

### Next (incremental)

1. **Remove duplicate caption state** — derive `captions` only from `useCarouselProjectStore` in studio builder.
2. **Storyboard / preview** — read `renderModel.slides[].visualPlan` instead of ad-hoc prefs.
3. **Creative Director** — route `onEnhance` to `store.enhanceSlide` first; keep art-direction pipeline as render layer.
4. **Persist** — save `CarouselProject` JSON in `projectPersistence` alongside images.
5. **Score UI** — panel bound to `project.score` from store.

### Deprecated (do not extend)

- `generateStory()` returning raw `Captions` without project (keep as fallback only).
- Full-carousel `regeneratePersonalizedStory()` as primary path when story engine project exists.

## Usage

```ts
import { useCarouselProjectStore } from "@/lib/story-engine";

await runGenerateStorytelling({
  topic: "Neapolitan pizza",
  platform: "Instagram",
  brand: "Table Tales",
  templateName: "Food Story",
});

await enhanceSlide(slideId, "Make this more cinematic");
```

```ts
import { renderCarousel } from "@/lib/story-engine";

const model = renderCarousel(project);
// model.slides[].displayText → bind preview
// model.slides[].slide.visualPlan → bind layout engine
```
