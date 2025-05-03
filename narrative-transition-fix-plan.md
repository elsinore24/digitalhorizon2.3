# Narrative Transition Fix Plan

**Problem:** The game narrative does not transition from "Chapter1_LunarArrival" to "Chapter1_LunarSignalAnalysisIntro".

**Analysis:**
- The narrative flow is defined in JSON files in the `public/narratives/` directory.
- The `NarrativeReader` component reads these JSON files and uses the `next` property to determine the subsequent narrative node.
- The `Chapter1_NeuralMergeSequence.json` file correctly points to `Chapter1_LunarArrival`.
- The `Chapter1_LunarArrival.json` file is missing the `next` property.
- The `Chapter1_LunarSignalAnalysisIntro.json` file has `requiresTuning: true` and `challengeConfig`, which the `NarrativeReader` component correctly identifies and uses to set the `activeTuningChallenge` state in the `useGameStore`.
- The `GameContainer.jsx` component listens to the `activeTuningChallenge` state and renders the `SignalTuningInterface` when it is set.

**Conclusion:** The narrative flow stops at "Chapter1_LunarArrival" because the JSON file for this narrative node does not specify the next node to load.

**Plan:**

1.  **Modify `public/narratives/Chapter1_LunarArrival.json`:** Add a `"next"` property with the value `"Chapter1_LunarSignalAnalysisIntro"` to this JSON file.

**Mermaid Diagram of the corrected narrative flow:**

```mermaid
graph TD
    A[Chapter1_NeuralMergeSequence] --> B(Chapter1_LunarArrival);
    B --> C{Narrative Complete?};
    C -- Yes --> D[Check for 'next' property];
    D -- 'next' property exists --> E[Load next narrative: Chapter1_LunarSignalAnalysisIntro];
    E -- requiresTuning: true --> F[Set activeTuningChallenge in store];
    F --> G[GameContainer renders SignalTuningInterface];