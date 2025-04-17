# Plan: Fix Overlay Transparency

This plan addresses the issue where underlying UI elements (like the NarrativeReader) are visible through the Data Perception Overlay when it's active.

## Problem Diagnosis

- The Data Perception Overlay (`DataPerceptionOverlay.jsx`) renders correctly when toggled.
- Z-index adjustments ensure the overlay and its elements (`.dataElements`) render above other UI components.
- However, the overlay's main container (`.overlay` class in `DataPerceptionOverlay.module.scss`) lacks a `background-color`, making it transparent between its visual effects (grid, scanlines, etc.).

## Solution

Add a background color to the `.overlay` class in `src/components/DataPerceptionOverlay.module.scss` to make it opaque or semi-opaque, thus obscuring the content behind it when active.

## Plan Steps

1.  **Add Background Color:**
    *   **File:** `src/components/DataPerceptionOverlay.module.scss`
    *   **Action:** Add `background-color: rgba(0, 10, 20, 0.85);` (or a similar dark, semi-opaque color) to the `.overlay` CSS rule.
    *   **Tool:** `apply_diff`.
2.  **Verify:** Test the application. When the Data Perception Overlay is active, the underlying UI should no longer be visible through it.

## Proposed Change

```diff
--- a/src/components/DataPerceptionOverlay.module.scss
+++ b/src/components/DataPerceptionOverlay.module.scss
@@ -5,6 +5,7 @@
   width: 100%;
   height: 100%;
   pointer-events: none;
+  background-color: rgba(0, 10, 20, 0.85); // Added dark semi-opaque background
   z-index: 2000; // Increased significantly to ensure visibility
 }

```

## Next Steps

- Implement the change using `apply_diff` in Code mode.
- Verify the fix by testing the toggle.