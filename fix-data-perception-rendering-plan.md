# Plan: Fix Data Perception Rendering Logic

This plan addresses the issue where the data perception UI elements (overlay, echoes) are not appearing when toggled during certain intro phases.

## Problem Diagnosis

- Previous debugging confirmed the `dataPerceptionActive` state is toggling correctly in the Zustand store (`useGameState.js`).
- Components like `DataPerceptionOverlay` and `DialogueDisplay` use their respective props (`active`, `isHidden`) correctly for conditional visibility.
- Z-index adjustments were made, but the issue persists.
- Analysis of `src/scenes/LunarArrival/index.jsx` revealed that the rendering of `<DataPerceptionOverlay />` and the container for `<TemporalEcho />` components (`.environment > .dataElements`) is currently nested *inside* a condition that only allows rendering when `gameState.introPhase === 'mainGame'`.
- This prevents the data perception UI from appearing during earlier phases like `flashbackNarrative`, even when `dataPerceptionActive` is true.

## Solution

Modify the rendering structure in `src/scenes/LunarArrival/index.jsx` to decouple the data perception elements from the `mainGame` intro phase check. These elements should be rendered based solely on the `dataPerceptionMode` prop.

## Plan Steps

1.  **Restructure Rendering in `LunarArrival.jsx`:**
    *   **File:** `src/scenes/LunarArrival/index.jsx`
    *   **Action:** Move the `<DataPerceptionOverlay />` component and the `div.environment > div.dataElements` block (containing the `TemporalEcho` map) outside the ` {gameState.introPhase === 'mainGame' && ... }` conditional block. Place them directly within the main `div.sceneContainer` alongside other top-level elements like `<Scene3D />`.
    *   **Tool:** `apply_diff` (will require careful diff creation to move blocks of code).
2.  **Verify:** Test the application after the change. The data perception overlay and temporal echoes should now toggle correctly with the button/Tab key, regardless of the current `introPhase` (as long as it's not an intro phase that completely obscures the main view, like `transitioning`).

## Conceptual Code Structure Change

```diff
// src/scenes/LunarArrival/index.jsx

return (
  <div className={styles.sceneContainer}>
    {/* Always render the 3D background */}
    <Scene3D dataPerceptionMode={dataPerceptionMode} />

    {/* --- Overlays based on Intro Phase --- */}
    {/* ... (initial, redAlert, transitioning, flashbackNarrative, flashbackChoice phases render here) ... */}

+   {/* --- Data Perception Elements (Rendered based on dataPerceptionMode) --- */}
+   <DataPerceptionOverlay active={dataPerceptionMode} />
+   <div className={styles.environment}>
+     {dataPerceptionMode && (
+       <div className={styles.dataElements}>
+         {destinations.map((dest) => (
+           <TemporalEcho key={dest.id} id={dest.id} destinationConfig={dest} />
+         ))}
+       </div>
+     )}
+   </div>

    {/* --- Main Game Specific UI (Still rendered only when intro is complete) --- */}
    {gameState.introPhase === 'mainGame' && (
      <>
-       {/* Data Perception Overlay was here */}
-       <DataPerceptionOverlay active={dataPerceptionMode} />
-
-       {/* Temporal Echoes container was here */}
-       <div className={styles.environment}>
-         {dataPerceptionMode && (
-           <div className={styles.dataElements}>
-             {destinations.map((dest) => (
-               <TemporalEcho
-                 key={dest.id}
-                 id={dest.id}
-                 destinationConfig={dest}
-               />
-             ))}
-           </div>
-         )}
-       </div>

        {/* Other elements specific to the main game view can go here */}
      </>
    )}
  </div>
);
```

## Next Steps

- Implement the changes using `apply_diff` in Code mode.
- Verify the fix by testing the toggle during the `flashbackNarrative` phase.