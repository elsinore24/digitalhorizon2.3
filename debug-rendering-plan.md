# Plan: Debug Rendering Issues (Fog & Post-processing)

This plan aims to diagnose why the background elements (stars, nebula, galaxy) are not visible by temporarily disabling potential obscuring factors like fog and post-processing effects.

## Problem Diagnosis

- Previous debugging confirmed the background elements are created, added to the scene, referenced correctly, and targeted by opacity animations.
- Despite having `visible: true` and non-zero opacity, they are not appearing on screen.
- Potential causes include rendering order/depth issues, scene fog obscuring distant elements, or post-processing effects (like bloom) interfering with low-opacity materials.

## Debugging Strategy

Temporarily disable fog and the entire post-processing pipeline (EffectComposer, RenderPass, UnrealBloomPass) to see if the background elements become visible with direct rendering. Also, remove the previous debugging logs to clean up the console.

## Plan Steps

1.  **Comment Out Fog:**
    *   **File:** `src/components/Scene3D.jsx`
    *   **Action:** Comment out the line `sceneRef.current.fog = new THREE.FogExp2(...)`.
    *   **Tool:** `apply_diff`.
2.  **Comment Out Post-processing Setup:**
    *   **File:** `src/components/Scene3D.jsx`
    *   **Action:** Comment out lines related to `RenderPass`, `UnrealBloomPass`, `EffectComposer` creation, and `composer.addPass(...)`.
    *   **Tool:** `apply_diff`.
3.  **Comment Out Composer Rendering & Uncomment Direct Rendering:**
    *   **File:** `src/components/Scene3D.jsx`
    *   **Location:** Inside the `animate` function.
    *   **Action:** Comment out `if (composerRef.current) { composerRef.current.render(); }`.
    *   **Action:** Uncomment `rendererRef.current.render(sceneRef.current, cameraRef.current);`.
    *   **Tool:** `apply_diff`.
4.  **Comment Out Composer Resize/Cleanup:**
    *   **File:** `src/components/Scene3D.jsx`
    *   **Location:** Inside `handleResize` function and the `useEffect` cleanup return function.
    *   **Action:** Comment out lines related to `composerRef.current.setSize(...)` and `composerRef.current = null;`.
    *   **Tool:** `apply_diff`.
5.  **Remove Previous Debug Logs:**
    *   **File:** `src/components/Scene3D.jsx`
    *   **Action:** Remove all `console.log` statements added in the `debug-background-visibility-plan`.
    *   **Tool:** `apply_diff` (multiple blocks).
6.  **Test and Analyze:**
    *   Run the application.
    *   *Are the stars, nebula, and galaxy visible now?*
    *   If yes, the issue is related to fog or post-processing. We can then re-enable them one by one or adjust their parameters (fog density, bloom threshold/strength) to fix the interaction.
    *   If no, the visibility issue lies elsewhere (e.g., material properties, camera clipping planes, rendering order).

## Next Steps

- Implement the changes using `apply_diff` in Code mode.
- Request user testing and feedback.