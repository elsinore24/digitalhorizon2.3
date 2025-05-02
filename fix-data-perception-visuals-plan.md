# Plan: Fix Data Perception Visuals

This plan addresses the issue where the Data Perception Overlay obscures all content, including elements that should be visible within the mode (like echoes), and ensures other UI elements (like NarrativeReader) are correctly hidden.

## Problem Diagnosis

- Adding a background color to `DataPerceptionOverlay` fixed the issue of seeing underlying UI *through* the overlay, but incorrectly hid *everything*, including the echoes and 3D scene.
- The overlay should only contain the visual effects (grid, scanlines) and be transparent otherwise.
- Underlying UI elements like `NarrativeReader` need to be explicitly hidden when data perception mode is active.
- The `Scene3D` component should ideally change appearance rather than being hidden.

## Solution

1.  **Revert Overlay Background:** Remove the `background-color` from the `.overlay` class in `DataPerceptionOverlay.module.scss`.
2.  **Hide NarrativeReader:** Modify `LunarArrival.jsx` to conditionally render `<NarrativeReader />` only when `dataPerceptionMode` is `false`.
3.  **Add Visual Cue to Scene3D:** Modify `Scene3D.jsx` to add a conditional CSS class based on `dataPerceptionMode`. Add a corresponding style rule in `Scene3D.module.scss` to apply a placeholder visual effect (e.g., reduced opacity) when the mode is active. This confirms the prop works and allows for future refinement of the 3D effect.

## Plan Steps

1.  **Remove Overlay Background:**
    *   **File:** `src/components/DataPerceptionOverlay.module.scss`
    *   **Action:** Remove the `background-color` property from the `.overlay` rule.
    *   **Tool:** `apply_diff`.
2.  **Conditionally Render NarrativeReader:**
    *   **File:** `src/scenes/LunarArrival/index.jsx`
    *   **Action:** Wrap the `<NarrativeReader />` component rendering block (lines ~113-121) with `{ !dataPerceptionMode && ( ... ) }`.
    *   **Tool:** `apply_diff`.
3.  **Add Conditional Class to Scene3D:**
    *   **File:** `src/components/Scene3D.jsx`
    *   **Action:** Modify the root `div` element to include `className={\`\${styles.scene3d} \${dataPerceptionMode ? styles.dataPerceptionActive : ''}\`}`.
    *   **Tool:** `apply_diff`.
4.  **Add Placeholder Style for Scene3D:**
    *   **File:** `src/components/Scene3D.module.scss` (Requires reading first)
    *   **Action:** Add a new rule `.dataPerceptionActive { opacity: 0.7; /* Placeholder effect */ }`.
    *   **Tool:** `read_file` then `apply_diff`.

## Next Steps

- Implement the changes using `apply_diff` in Code mode.
- Verify the fix: Overlay should show effects without a solid background, NarrativeReader should hide when toggled, and Scene3D should become slightly transparent (placeholder effect).