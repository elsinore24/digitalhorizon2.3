# Plan: Finalize Toggle Fix and Enhance Visuals

This plan addresses the final steps for the data perception toggle functionality and improves the visual feedback for the background elements in this mode.

## Problem Diagnosis

- Disabling pointer events on `.dataElements` and `.echo` fixed the inability to toggle *off* data perception mode. This confirms event blocking was the issue.
- The placeholder opacity effect on the entire `Scene3D` component is not ideal, as it dims the background elements (nebula, galaxy) that should potentially be *more* visible in data perception mode.

## Solution

1.  **Finalize Pointer Events:** Keep `pointer-events: none;` on the `.dataElements` container (as this likely solved the blocking) but restore `pointer-events: all;` on the individual `.echo` components to allow for potential future interactivity.
2.  **Enhance Background Visibility:** Remove the placeholder opacity effect on the entire `Scene3D` container. Instead, modify the `useEffect` hook within `Scene3D.jsx` that reacts to `dataPerceptionMode` to specifically target the background elements (nebula, galaxy stored in `backgroundElementsRef`) and animate their opacity using GSAP. Increase opacity when the mode is active, and return to default opacity when inactive.
3.  **Remove Debug Logs:** Clean up the code by removing the `console.log` statements added previously for debugging the toggle.

## Plan Steps

1.  **Restore Echo Pointer Events:**
    *   **File:** `src/components/TemporalEcho.module.scss`
    *   **Action:** Change `pointer-events: none;` back to `pointer-events: all;` for the `.echo` CSS rule.
    *   **Tool:** `apply_diff`.
2.  **Remove Placeholder Scene3D Style:**
    *   **File:** `src/components/Scene3D.module.scss`
    *   **Action:** Remove the `.dataPerceptionActive { ... }` CSS rule.
    *   **Tool:** `apply_diff`.
3.  **Update Scene3D Effect Logic:**
    *   **File:** `src/components/Scene3D.jsx`
    *   **Action:** Modify the `useEffect` hook (lines ~229-248) to iterate over `backgroundElementsRef.current`, get default opacities, and use `gsap.to` to animate `material.opacity` based on `dataPerceptionMode` (increase opacity when true, return to default when false). Remove the `object.visible` logic.
    *   **Tool:** `apply_diff` (will require a larger diff block).
4.  **Remove GameContainer Logs:**
    *   **File:** `src/components/GameContainer.jsx`
    *   **Action:** Remove the `console.log` statements from `handleKeyPress` and the `onClick` handler.
    *   **Tool:** `apply_diff`.
5.  **Remove useGameState Logs:**
    *   **File:** `src/hooks/useGameState.js`
    *   **Action:** Remove the `console.log` statements from the `toggleDataPerception` function.
    *   **Tool:** `apply_diff`.

## Next Steps

- Implement the changes using `apply_diff` in Code mode.
- Verify the fix: Toggle should work correctly, echoes should be potentially interactive again, background elements should become more visible in data perception mode, and console should be clean of the debug logs.