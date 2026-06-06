# State Migration — Phase A

| Location | Before | After |
|----------|--------|-------|
| `CarouselEditor` | `useState<Captions>` owned copy | `useCarouselCaptions()` → `project.slides` via `patchCaptions` |
| `useCarouselProjectStore` | `captions` field duplicated | Removed; `selectCaptions` selector |
| `persistEditorState` | captions + template + images | + `persistCarouselProject(CarouselProject)` |
| `render-carousel` | Role name lookup | Index → `SLIDE_KEYS` (supports case-study roles) |
| Load flow | `setCaptions` only | `hydrateFromLegacyCaptions` + `setCaptions` |
| Images | Local only | `syncPhotos(urls)` → photo analysis + visual plans |

**Still local (session chrome, not story content):** `images[]`, `templateId`, brand kit, creative pipeline prefs.
