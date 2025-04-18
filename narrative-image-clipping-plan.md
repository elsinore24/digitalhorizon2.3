# Plan: Clip Narrative Image to Viewport Rounded Corners (Revised)

**Goal:** Make the image displayed within the `NarrativeReader` component appear clipped by the main rounded viewport frame, preventing sharp corners from overlapping the frame effect.

**Analysis:**

1.  The main viewport effect (rounded corners, glow) is defined in `src/scenes/LunarArrival/LunarArrival.module.scss` on the `.sceneContainer` using pseudo-elements with `border-radius: 30px`.
2.  The `NarrativeReader` component (`.narrativeContainer`) uses `position: fixed` and a high `z-index`, placing it visually above the viewport frame effect.
3.  Previous attempts to apply clipping within the `NarrativeReader` (`.narrativeBox` or `.lunarImageContainer`) failed, likely because the fixed positioning prevents it from being clipped by ancestor elements' `overflow` properties.

**Revised Solution (Attempt 3):**

Apply the clipping directly to the outermost container of the `NarrativeReader` component itself.

1.  **File:** `src/components/NarrativeReader/NarrativeReader.module.scss`
2.  **Revert:** Ensure `overflow: hidden` and `border-radius: 30px` are *removed* from `.lunarImageContainer` (if added previously).
3.  **Apply:** Add `overflow: hidden` and `border-radius: 30px` to the `.narrativeContainer` class.

**Mechanism:**

By applying `overflow: hidden` and the matching `border-radius` to the fixed-position `.narrativeContainer`, all its children (including the `.narrativeBox` and the image) should be clipped to the desired rounded shape.

**Conceptual Diagram:**

```mermaid
graph TD
    A[Viewport Effect (.sceneContainer pseudo-elements)] -- Defines Shape --> Shape(Rounded Rect, radius: 30px);
    D[Narrative Container (.narrativeContainer)] -- Contains --> B[Narrative Box (.narrativeBox)];
    B -- Contains --> C(Image);

    subgraph "Proposed Change"
        D -- Apply Clipping & Radius --> Clip3(Rounded Rect, radius: 30px);
        B -- Will Be Clipped By --> Clip3;
        C -- Will Be Clipped By --> Clip3;
    end

    Shape -- Goal: Match --> Clip3;
```

**Next Step:** Switch to `code` mode to apply the CSS changes (revert `.lunarImageContainer`, modify `.narrativeContainer`).