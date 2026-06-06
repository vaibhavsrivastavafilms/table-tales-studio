# Subject Engine Migration

## What changed

- **Before:** `CompositionPlan.focalPoint` (single rectangle)
- **After:** `SubjectAnalysis` with `SubjectAnchors`, ranked `negativeSpace`, and layout-specific `typographyZones` / `doodleZones`

## Pipeline

```
PhotoAsset → analyzeSubjectsFromAsset()
          → findNegativeSpace()
          → SEMANTIC_LAYOUT_BUILDERS[layoutId]()
          → buildNarrativeDoodles() (semantic anchors)
          → CarouselRendererSlide
```

## Backward compatibility

- `focalPoint` and `foodSafe` still exist on `CompositionPlan` / `SlideLayoutSpec` (alias of `subjects.protectedRegion`)
- `captionZone` maps to `typographyZones.textZone`

## Debug overlays

- `NEXT_PUBLIC_SHOW_COMPOSITION_ANCHORS=true` or `localStorage.setItem('tts:showAnchors', 'true')`
- Or pass `showAnchors: true` to `composeSlide()`

## Gemini Vision (future)

1. Implement `detectSubjectsWithGemini()` in `gemini-vision-subject.ts`
2. Merge boxes with heuristic anchors when `confidence < 0.7`
3. Call from `analyzeSubjectsFromAsset()` when `isGeminiSubjectDetectionEnabled()`

## Design quality checklist

1. Text never obscures `heroDish`, `drink`, or `people`
2. Doodles use semantic anchors only
3. Hero subject remains dominant per slide role
4. Each layout uses distinct negative-space preference
5. Hierarchy: primary / secondary / tertiary type zones
