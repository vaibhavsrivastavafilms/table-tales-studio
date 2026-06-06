# Story Engine Refactor Plan

## Product shift

| Before | After |
|--------|--------|
| `generateStory()` → `Captions` | `runStoryEnginePipeline()` → `CarouselProject` JSON |
| Slide generator | Creative Brief → Story → Slide Plan → Visual Plan → Render |
| `regenerateCarousel()` mindset | `enhanceSlide(slideId, instruction)` per slide |
| Caption state in React | Zustand `project` + `renderCarousel()` for UI |

## Phase status

| Phase | Status | Location |
|-------|--------|----------|
| 1 Story Engine | Done | `lib/story-engine/story-engine.ts`, `POST /api/story-engine/generate` |
| 2 Visual Planner | Done | `lib/story-engine/visual-planner.ts` |
| 3 Creative Director rewrite | Done | `lib/story-engine/creative-director.ts`, `POST /api/story-engine/enhance-slide` |
| 4 Scoring | Done | `lib/story-engine/scoring-engine.ts`, `CarouselScorePanel` |
| 5 Render layer | Done | `lib/story-engine/render-carousel.ts`, Zustand store |
| UI full JSON-only | Partial | Studio generate + enhance wired; dashboard still legacy |

## Rendering contract

```ts
const model = renderCarousel(project);
// Bind preview: model.slides[i].displayText
// Bind layout: model.slides[i].slide.visualPlan
// Bind score: model.score
```

No component should own headline/body outside `project.slides[]`.

## Next engineering tasks

1. Persist `CarouselProject` in `lib/projectPersistence.ts`.
2. Storyboard panel: show `visualPlan.visualType` + `photoPreference` per slide.
3. Remove studio duplicate `captions` state — subscribe only to store.
4. Framework picker in `BuilderInputPanel` (6 frameworks).
5. Deprecate `regeneratePersonalizedStory` when `project` is set.

## Frameworks

- transformation
- educational
- founder
- before-after
- case-study
- listicle

Default slide roles: Hook → Problem → Context → Insight → Transformation → CTA.
