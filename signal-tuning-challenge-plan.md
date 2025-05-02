# Signal Tuning Challenge 1 Plan

This document outlines the plan to implement the first Signal Tuning challenge in the game, focusing on allowing players to tune into one of three potential interpretations (Mathematical Precision, Source Signature, or Instrumental Artifact).

## Goal

Implement the first Signal Tuning challenge in `SignalTuningInterface.jsx` to allow players to tune into one of three potential interpretations (A, B, or C), each with distinct parameters, feedback, and game state impacts.

## Plan Steps

1.  **Define Interpretation Parameters:**
    *   Create a data structure (e.g., an object or array within the component or a separate config file) to hold the specific parameters for each interpretation (A, B, C):
        *   `targetFrequencyRange`: [min, max]
        *   `targetAmplitude` (or other relevant amplitude/gain setting)
        *   `targetFilterSettings` (e.g., notch filter frequencies, bandpass ranges - this will require adding new controls)
        *   `waveformAppearanceLogic` (how to draw the signal when close)
        *   `audioCueLogic` (how to modify audio based on proximity)
        *   `stabilityCalculationLogic` (how stability is calculated for this interpretation)
        *   `stabilityThreshold` (85% for all, but defined per interpretation for flexibility)
        *   `hiddenPointImpacts`: { Enlightenment, Trust, Witness, RealityAnchor }
        *   `visibleIndicatorImpacts`: { NeuralStability }
        *   `witnessCueTrigger`: boolean (true for B)
        *   `name`: string (e.g., "Mathematical Precision")

2.  **Enhance Tuning Controls:**
    *   Modify or add new input controls (sliders, knobs, toggles) in the UI to represent the tuning parameters needed for all interpretations. This will likely include:
        *   Frequency (potentially a range or center frequency + bandwidth)
        *   Amplitude/Gain
        *   Filter controls (e.g., a slider for a notch filter frequency, or toggles for different filter types)
        *   Phase control (as mentioned in Interpretation A's difficulty)
    *   Update the component's state to track the values of these new tuning controls.

3.  **Implement Proximity and Stability Calculation:**
    *   In the `draw` loop (or a separate effect/function triggered by tuning changes), calculate a "proximity" score for *each* interpretation based on how close the current tuning parameters are to that interpretation's target parameters. This will be more complex than the current simple frequency/amplitude match.
    *   Based on the proximity, calculate the `currentStability` for *each* interpretation using its specific `stabilityCalculationLogic`. This might involve weighting different parameters (frequency, amplitude, filters, phase) differently for each interpretation.
    *   Determine which interpretation currently has the highest stability or proximity. This will be the "dominant" interpretation influencing the visual and audio feedback.

4.  **Update Visual and Audio Feedback:**
    *   Modify the canvas drawing logic (`drawSignal`) to dynamically change the appearance of the tuned signal based on the "dominant" interpretation and the current proximity/stability to it. Implement the `waveformAppearanceLogic` for each interpretation.
    *   Modify the audio generation logic (`useSignalAudio` hook or within the component) to incorporate the `audioCueLogic`. This might involve layering different tones, adjusting their gain based on proximity, or applying filters to the noise based on tuning.
    *   If implementing a Spectrum Analyzer, update its display based on the current tuning and the characteristics of the potential signals.
    *   Update the main Stability Display to reflect the stability of the *dominant* interpretation, potentially showing increased fluctuation as described.

5.  **Implement Lock Logic:**
    *   Modify the `useEffect` that checks stability. Instead of checking a single `stability > 90`, it should check if the stability for *any* of the three interpretations exceeds its `stabilityThreshold` (85%).
    *   Ensure that once a lock is achieved for one interpretation, the tuning controls are disabled or the interface state changes to prevent further tuning until the narrative progresses.

6.  **Handle Successful Lock Outcome:**
    *   When a lock is achieved for a specific interpretation:
        *   Identify which interpretation (A, B, or C) was successfully locked.
        *   Apply the corresponding `hiddenPointImpacts` and `visibleIndicatorImpacts` to the game state using `updateGameState`. Be careful with how Reality Anchor is handled (starts at 100, decreases).
        *   Trigger the Witness cue visual effect if Interpretation B was locked. This effect should be brief and subtle as described.
        *   Call a function (likely passed as a prop or via the Zustand store) to signal that the Signal Tuning challenge is complete and pass the locked interpretation's identifier (A, B, or C) and potentially the final tuning parameters. This will allow the narrative manager to trigger the next dialogue or event.
        *   Save the game state using `saveGameStateToServer`.

7.  **Refine Game State (if needed):**
    *   Consider if the `gameState` object in `useGameStore.js` needs any additions to track the state of the Signal Tuning challenge (e.g., `signalTuningComplete: false`, `lockedInterpretation: null`). This might be useful for saving/loading and ensuring the challenge doesn't repeat.

## Implementation Flow

```mermaid
graph TD
    A[Start Signal Tuning] --> B{Player Adjusts Controls};
    B --> C[Calculate Proximity & Stability for A, B, C];
    C --> D[Determine Dominant Interpretation];
    D --> E[Update Visual & Audio Feedback];
    E --> F{Is Dominant Stability >= Threshold?};
    F -- No --> B;
    F -- Yes --> G[Identify Locked Interpretation (A, B, or C)];
    G --> H[Apply Game State Impacts];
    H --> I{Is Locked Interpretation B?};
    I -- Yes --> J[Trigger Witness Cue];
    J --> K[Signal Tuning Complete];
    I -- No --> K;
    K --> L[Save Game State];
    L --> M[Advance Narrative];
    M --> N[End Signal Tuning];