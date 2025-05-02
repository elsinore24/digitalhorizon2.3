# Signal Tuning Challenge Integration Plan

## Objective

Integrate the first Signal Tuning challenge into the narrative flow, triggered by the `Chapter1_LunarSignalAnalysisIntro` narrative node, using the provided configuration details.

## Narrative Flow

The planned narrative flow is as follows:

1.  **Chapter1_LabIntro:** Initial dialogue between Thorne and Alara in the lab.
2.  **Chapter1_NeuralMergeSequence:** Description of the neural merge process.
3.  **Chapter1_LunarArrival:** Description of the virtual arrival on the Moon and initial orientation.
4.  **Chapter1_LunarSignalAnalysisIntro:** Alara introduces the faint Tau Ceti signal for analysis. This node triggers the Signal Tuning challenge.
5.  **Result Nodes:** Based on the outcome of the tuning challenge, the narrative proceeds to one of the following nodes:
    *   `Chapter1_PathA_Result` (Interpretation A)
    *   `Chapter1_PathB_Result` (Interpretation B)
    *   `Chapter1_PathC_Result` (Interpretation C)

## Implementation Plan

**Steps:**

1.  **Define New Narrative Nodes:**
    *   Create or update the narrative data structure (likely JSON files in `public/narratives/`) to include the following new nodes:
        *   `Chapter1_NeuralMergeSequence`: Content describing the neural merge process.
        *   `Chapter1_LunarArrival`: Content describing the virtual arrival on the Moon and initial orientation.
        *   `Chapter1_LunarSignalAnalysisIntro`: Content where Alara introduces the signal. This node will contain the trigger for the tuning challenge.
        *   `Chapter1_PathA_Result`: Content for the narrative path following a successful tune to Interpretation A.
        *   `Chapter1_PathB_Result`: Content for the narrative path following a successful tune to Interpretation B.
        *   `Chapter1_PathC_Result`: Content for the narrative path following a successful tune to Interpretation C.
    *   Ensure the `Chapter1_LabIntro` node is linked to `Chapter1_NeuralMergeSequence`, which is linked to `Chapter1_LunarArrival`, which is linked to `Chapter1_LunarSignalAnalysisIntro`.
    *   The `Chapter1_LunarSignalAnalysisIntro` node will link to the three result nodes (`Chapter1_PathA_Result`, `Chapter1_PathB_Result`, `Chapter1_PathC_Result`) based on the outcome of the tuning challenge.

2.  **Add Tuning Challenge Configuration to Narrative Node:**
    *   In the data structure for the `Chapter1_LunarSignalAnalysisIntro` node, add a flag `requiresTuning: true`.
    *   Add a `challengeConfig` object to this node, containing the detailed parameters provided:
        *   `challengeId: "LunarSignal1"`
        *   `baseSignalStrength: "Very Low"`
        *   `noiseLevel: "Moderately High"`
        *   `stabilityLockThreshold: 0.85`
        *   `challengeDuration`: (Optional, if adding a time limit for failure)
        *   `witnessCueTriggerEnabled: true`
        *   `interpretations`: An array containing objects for Interpretation A, B, and C, each with their respective `id`, `descriptionHint`, `targetFrequencyRange`, `phaseAlignment`, `filterRequirement`, `tuningDifficulty`, `stabilityBehavior`, `hiddenPointImpact`, and `visibleIndicatorImpact`.

3.  **Modify Narrative Manager:**
    *   Update the `NarrativeManager.cs` (or the relevant component handling narrative progression) to check for the `requiresTuning` flag when loading a narrative node.
    *   If `requiresTuning` is true, pause the standard narrative playback and trigger the display of the `SignalTuningInterface` component.
    *   Pass the `challengeConfig` data from the current narrative node to the `SignalTuningInterface` component as a prop.
    *   Implement a callback mechanism in the `NarrativeManager` to receive the result of the tuning challenge (which interpretation was successfully tuned) from the `SignalTuningInterface`.
    *   Based on the received interpretation ID, resume narrative playback by loading the corresponding result node (`Chapter1_PathA_Result`, etc.).
    *   Apply the `hiddenPointImpact` and `visibleIndicatorImpact` from the chosen interpretation to the game state.

4.  **Update Signal Tuning Interface (`src/components/SignalTuningInterface.jsx`):**
    *   Modify the component to accept a `challengeConfig` prop.
    *   Use the data within `challengeConfig` to initialize the internal state and simulation logic for the tuning challenge. This includes setting up the target parameters and stability behaviors for each of the three interpretations.
    *   Implement the logic for the tuning controls and the simulation of the signal based on the player's input and the `challengeConfig` parameters.
    *   Implement the logic to track the dominant stability and check against the `stabilityLockThreshold`.
    *   Implement the visual Witness Cue trigger based on tuning parameters being close to Interpretation B.
    *   When a successful lock is achieved, determine which interpretation was locked and call the callback function provided by the `NarrativeManager`, passing the interpretation ID and its impact data.

5.  **Update Game State (`src/store/useGameStore.js` or similar):**
    *   Ensure the game state includes variables to track the player's hidden points (Enlightenment, Trust, Reality, Witness) and visible indicators (Neural Stability).
    *   Add or modify actions/mutations in the game state store to apply the impacts received from the `NarrativeManager` after a tuning challenge is completed.

## Narrative Flow Diagram

```mermaid
graph TD
    A[Chapter1_LabIntro] --> B(Chapter1_NeuralMergeSequence);
    B --> C(Chapter1_LunarArrival);
    C --> D{Chapter1_LunarSignalAnalysisIntro<br>requiresTuning: true};
    D -- Trigger Tuning Challenge --> E[SignalTuningInterface];
    E -- Successful Tune (Interpretation A) --> F(Chapter1_PathA_Result);
    E -- Successful Tune (Interpretation B) --> G(Chapter1_PathB_Result);
    E -- Successful Tune (Interpretation C) --> H(Chapter1_PathC_Result);
    E -- Update Game State --> I[Game State];
    F --> J(Continue Narrative);
    G --> J;
    H --> J;