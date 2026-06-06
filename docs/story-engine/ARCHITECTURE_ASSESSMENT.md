# Table Tales Studio — Story Engine Architecture Assessment

## 1. Architecture Assessment

**Product thesis:** CarouselProject JSON is the single source of truth. UI, scoring, export, and platform renders are *projections* — never parallel caption state.

**Pipeline:**

```
Creative Brief → Story Architecture (framework) → Slide Plan → Visual Plan (+ photos) → renderCarousel(project)
```

**Completed in this migration:**

| Phase | Status | Notes |
|-------|--------|-------|
| A — Eliminate dual state | Partial+ | `CarouselEditor` uses `useCarouselCaptions()`; captions derive from store. Legacy Supabase `Project.captions` still synced for cloud rows. |
| B — Persistence | Done | `ProjectRepository`, `LocalStorageRepository`, `SupabaseRepository` stub, `persistCarouselProject` bridge |
| C — Framework engine | Done | `FrameworkDefinition`, dynamic slide counts (e.g. Case Study = 6 distinct roles) |
| D — Revisions | Done | `appendRevision`, `undo`/`redo`/`restoreRevision`/`compareRevisions`, store actions |
| E — Photo intelligence | Done | `PhotoAsset`, mock `analyzePhotos`, `preferredPhotoId` on visual plans |
| F — Multi-render | Done | Instagram, LinkedIn, Pinterest, blog, thread |
| G — Export | Done | `ExportEngine` + PDF/PNG/JPG/Canva/Figma/HTML exporters |
| H — Advanced scoring | Done | 10 dimensions + reasoning, strengths/weaknesses/priority fixes |
| I — Component audit | Documented | See §13 |
| J — Production hardening | Partial | Zod on APIs + project schema, autosave, migrate v2, telemetry hooks, error boundary |

---

## 2. State Migration Report (Phase A)

| Source | Before | After |
|--------|--------|-------|
| `CarouselEditor` `useState(captions)` | Owned captions | `useCarouselCaptions()` → `selectCaptions(store.project)` |
| `useCarouselProjectStore.captions` | Duplicated field | **Removed** — derived only |
| `patchCaptions` | Wrote captions blob | `captionsToProjectPatch` → updates `project.slides` |
| `BuilderPreview` / pipelines | Read local captions | Still receive captions prop (derived from project) |
| `projectPersistence` | `EditorState.captions` only | Also `persistCarouselProject(full JSON)` |
| `generateStory()` legacy | Direct caption API | Studio path uses `runGenerateStorytelling` |
| `render-carousel` | Role-key lookup | Index-based mapping for dynamic frameworks |
| Preview slide state | `useCreativeRenderPipeline` | Unchanged (render output, not story ownership) |

---

## 3. Folder Structure

```
lib/story-engine/
  types.ts
  schema.ts                 # Zod
  constants.ts
  framework-engine.ts       # Phase C
  story-engine.ts
  visual-planner.ts
  creative-director.ts
  scoring-engine.ts
  adapters.ts
  render-carousel.ts
  store.ts
  telemetry.ts
  revisions/revision-engine.ts
  photo/photo-intelligence.ts
  persistence/
    repository.ts
    migrate.ts
  renderers/multi-render.ts
  export/export-engine.ts
  index.ts

hooks/
  useCarouselCaptions.ts

components/story-engine/
  CarouselScorePanel.tsx
  FrameworkPicker.tsx
  StoryEngineErrorBoundary.tsx

app/api/story-engine/
  generate/route.ts
  enhance-slide/route.ts
  score/route.ts
```

---

## 4–12. Subsystem Summaries

See implementation files for:

- **Types:** `lib/story-engine/types.ts` — `CarouselProject`, `ProjectRevision`, `PhotoAsset`, `ScoreDimension`, platform/export types
- **Store:** `lib/story-engine/store.ts` — SSOT, autosave, framework/photo/revision actions
- **Repository:** `lib/story-engine/persistence/repository.ts`
- **Revisions:** `lib/story-engine/revisions/revision-engine.ts`
- **Frameworks:** `lib/story-engine/framework-engine.ts`
- **Photos:** `lib/story-engine/photo/photo-intelligence.ts`
- **Multi-render:** `lib/story-engine/renderers/multi-render.ts`
- **Export:** `lib/story-engine/export/export-engine.ts`
- **Scoring:** `lib/story-engine/scoring-engine.ts`

---

## 13. Component Architecture Audit (Phase I)

| Component | Ownership | Coupling risk | Recommendation |
|-----------|-----------|---------------|----------------|
| Studio Builder (`CarouselEditor`) | Mixed — images/template local; story in Zustand | High — large file | Split `useStudioSession` hook |
| Storyboard | Captions prop | Medium | Pass `renderModel` |
| Preview / `useCreativeRenderPipeline` | Derived captions + images | Medium | Memoize on `project.updatedAt` |
| Creative Director | Legacy + store enhance | Medium | Route all enhance via store |
| Inspector | Caption edits | Low | Already uses `patchCaptions` |
| Score Panel | `project.score` | Low | Done |
| Export Flow | Captions + canvas | Medium | Accept `CarouselProject` in export API |
| Project Loading | Dual persist | Medium | Load `CarouselProject` first when key exists |

**Performance:** Debounce autosave (1.2s). Selectors: `selectCaptions`, `selectCanUndo`. Avoid subscribing entire store in `CarouselEditor`.

---

## 14. Production Hardening Checklist (Phase J)

- [x] Zod project + API input validation
- [x] Schema version + `migrateCarouselProject`
- [x] Autosave debounce in store
- [x] Telemetry events (`trackStoryEngine`)
- [x] Error boundary component
- [ ] Supabase `carousel_projects` table + real `SupabaseRepository`
- [ ] Optimistic enhance UI
- [ ] Full type audit on `CarouselEditor`
- [ ] Collaboration WebSocket hooks (stubs in `telemetry.ts`)

---

## 15–17. Implementation Order (remaining)

1. Supabase migration for `carousel_projects` JSON column
2. Dashboard `generateStory` → story engine
3. Export pipeline input = `CarouselProject`
4. Revision timeline UI
5. Vision API replace `analyzePhotos` mock
6. Split `CarouselEditor` into session hooks
