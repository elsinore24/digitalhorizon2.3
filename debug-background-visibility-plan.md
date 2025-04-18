# Plan: Debug Background Element Visibility

This plan aims to diagnose why the background elements (stars, nebula, galaxy) in the 3D scene are not visible.

## Problem Diagnosis

- After previous fixes, the data perception toggle works, but the space background elements are no longer visible at all.
- This could be due to issues in their creation, referencing, initial state, or the opacity animation logic added in the previous step.

## Debugging Strategy

Add `console.log` statements within `src/components/Scene3D.jsx` to trace the lifecycle and state of the background elements.

## Plan Steps

1.  **Log Element Creation:**
    *   **File:** `src/components/Scene3D.jsx`
    *   **Location:** Inside `createSceneElements` function.
    *   **Action:** Add logs after creating stars, nebula, and galaxy to confirm:
        *   Object creation (`new THREE.Points`, `new THREE.Mesh`).
        *   Addition to scene (`sceneRef.current.add(...)`).
        *   Assignment to refs (`starsRef.current = ...`, `backgroundElementsRef.current.nebula1 = ...`, etc.).
        *   Initial material opacity and object visibility (`object.material.opacity`, `object.visible`).
    *   **Tool:** `apply_diff`.
2.  **Log Opacity Animation Trigger:**
    *   **File:** `src/components/Scene3D.jsx`
    *   **Location:** Inside the `useEffect` hook dependent on `dataPerceptionMode`.
    *   **Action:** Add logs to show:
        *   The value of `dataPerceptionMode` when the effect runs.
        *   The contents of `backgroundElementsRef.current` before the loop.
        *   Inside the loop, log the element `key`, the calculated `targetOpacity`, and confirm `gsap.to` is called.
    *   **Tool:** `apply_diff`.
3.  **Log Star Status During Animation Loop:**
    *   **File:** `src/components/Scene3D.jsx`
    *   **Location:** Inside `updateSceneEffects` function.
    *   **Action:** Add a log (perhaps throttled using a simple counter or timer check to avoid flooding) to output `starsRef.current?.visible` and `starsRef.current?.material.opacity`.
    *   **Tool:** `apply_diff`.
4.  **Test and Analyze:**
    *   Run the application.
    *   Observe the console logs during initial load and when toggling data perception mode.
    *   *Are the elements created and added correctly?*
    *   *Are they assigned to the refs?*
    *   *What are their initial states?*
    *   *Does the opacity animation effect run? Does it target the correct elements and opacities?*
    *   *What is the status of the stars during the animation loop?*
5.  **Formulate Fix:** Based on the logs, identify the point of failure (e.g., element not added, ref incorrect, animation setting opacity to 0) and create a plan to fix it.

## Next Steps

- Implement the logging changes using `apply_diff` in Code mode.
- Request user testing and log feedback.