# Detailed Plan for Signal Tuning Visual Feedback

**Goal:** Implement visual feedback on the HTML5 Canvas in `SignalTuningInterface.jsx` to represent the dominant signal interpretation and its stability, blending it with background noise.

**Steps:**

1.  **Refactor Existing Drawing Logic:**
    *   Modify the main `useEffect` hook (lines 90-221) to remove the direct calls to `drawSignal` for the target and tuned signals.
    *   Introduce a new function, potentially named `renderSignalDisplay`, which will orchestrate the drawing of noise and the different interpretations based on the current state.

2.  **Implement `drawNoise` Function:**
    *   Create a new JavaScript function `drawNoise(ctx, width, height, noiseLevel)`.
    *   This function will draw a visual representation of noise on the canvas. The `noiseLevel` parameter (derived from `dominantStability`) will control the intensity or appearance of the noise. As `dominantStability` increases, `noiseLevel` should decrease.

3.  **Implement Interpretation Drawing Functions:**
    *   Create separate functions for each interpretation:
        *   `drawInterpretationA(ctx, width, height, clarity)`
        *   `drawInterpretationB(ctx, width, height, clarity)`
        *   `drawInterpretationC(ctx, width, height, clarity)`
    *   Each function will draw the specific visual pattern associated with its interpretation.
    *   The `clarity` parameter (derived from `dominantStability` when that interpretation is dominant) will control the prominence of the pattern (e.g., opacity, line thickness, amplitude).

4.  **Implement Blending/Clarity Logic in `renderSignalDisplay`:**
    *   Inside `renderSignalDisplay`:
        *   Clear the canvas (`ctx.clearRect`).
        *   Calculate the `noiseLevel` based on `stability` (e.g., `noiseLevel = Math.max(0.1, 1.0 - stability * 0.9)`).
        *   Calculate the `clarity` for each interpretation. Only the `dominantInterpretation` will have a clarity value proportional to `stability` (e.g., `clarityA = (dominantInterpretation === 'A') ? stability / 100 : 0;`).
        *   Call `drawNoise` with the calculated `noiseLevel`.
        *   Call the appropriate `drawInterpretationX` function for the `dominantInterpretation` with its calculated `clarity`. (Optional: Call non-dominant interpretation functions with a low residual clarity if desired).

5.  **Update `useEffect` Dependencies:**
    *   Ensure the `useEffect` hook that contains the drawing logic has `stability` and `dominantInterpretation` in its dependency array so that the canvas redraws when these values change.

6.  **Refine Drawing Implementations:**
    *   Flesh out the drawing logic within each `drawInterpretationX` function to create distinct and visually representative patterns for "Mathematical Precision", "Source Signature", and "Instrumental Artifact".
    *   Experiment with how the `clarity` parameter affects the drawing (e.g., using `ctx.globalAlpha`, adjusting line properties, modifying waveform parameters).

**Mermaid Diagram:**

```mermaid
graph TD
    A[Signal Tuning Interface State Change] --> B{useEffect Hook Triggered};
    B --> C[Calculate Stability and Dominant Interpretation];
    C --> D[Update State: stability, dominantInterpretation];
    D --> E{useEffect Hook Triggered (Drawing)};
    E --> F[renderSignalDisplay Function];
    F --> G[Clear Canvas];
    F --> H[Calculate noiseLevel];
    F --> I[Calculate Interpretation Clarities];
    F --> J[Call drawNoise(noiseLevel)];
    F --> K[Call drawInterpretationX(clarityX) for dominant];
    K --> L[Draw Specific Pattern];
    J --> M[Canvas Updated];
    L --> M;