# Plan: Integrate Signal Tuning Interface into Perception Page

**Objective:** Move the `SignalTuningInterface` component to a new `PerceptionPage` component, integrate it into the main application flow, and manage view and tuning state using Zustand.

**Plan:**

1.  **State Management Setup (`src/store/useGameStore.js`):**
    *   Add `currentView` ('narrative' or 'perception') and `activeTuningChallenge` (object or null) state variables.
    *   Add `setView` and `setActiveTuningChallenge` actions to modify the new state.
    *   Modify `advanceNarrativeAction` to clear `activeTuningChallenge` and set `currentView` back to 'narrative' after narrative advancement.

2.  **Main App Structure & View Switching (`src/App.jsx`):**
    *   Import the new `PerceptionPage` component (to be created in `src/components/PerceptionPage.jsx`).
    *   Read `currentView` from `useGameStore`.
    *   Conditionally render `NarrativeReader` or `PerceptionPage` based on the `currentView` state.
    *   Ensure necessary props (like `handleAdvanceNarrative` if still needed by children, though actions can be accessed directly) are available to the rendered view component.

3.  **Toggle Button Logic (`src/components/GameContainer.jsx`):**
    *   Import `useGameStore`.
    *   Get `currentView` and `setView` action from the store.
    *   Modify the existing button's `onClick` handler to call `setView`, toggling between 'narrative' and 'perception'.

4.  **Triggering Tuning from Narrative (`src/components/NarrativeReader/index.jsx`):**
    *   Import `useGameStore`.
    *   Get the `setActiveTuningChallenge` action from the store.
    *   Add logic within the `useEffect` that processes narrative nodes to check if the current node requires tuning.
    *   If tuning is required, define the `challengeConfig` based on the node data and call `setActiveTuningChallenge` with this config.
    *   Remove any code that previously rendered `SignalTuningInterface` directly within `NarrativeReader`.

5.  **Create and Integrate PerceptionPage (`src/components/PerceptionPage.jsx`):**
    *   Create a new file `src/components/PerceptionPage.jsx`.
    *   Import `React`, `useGameStore`, and `SignalTuningInterface`.
    *   Import any other components needed for the perception view (e.g., `MapComponent`, `IndicatorDisplay` - assuming these exist or will be created).
    *   Get `activeTuningChallenge` and `advanceNarrativeAction` from `useGameStore`.
    *   Conditionally render `SignalTuningInterface` only if `activeTuningChallenge` is not null, passing `challengeConfig` (which is `activeTuningChallenge`) and `advanceNarrative` (which is `advanceNarrativeAction`) as props.
    *   Include placeholders or actual components for other perception view elements (map, indicators, etc.), deciding on the layout based on whether `SignalTuningInterface` is active.

6.  **Adapting SignalTuningInterface (`src/components/SignalTuningInterface.jsx`):**
    *   Modify the component to accept `challengeConfig` as a prop.
    *   Update the component's internal state and logic (e.g., setting target frequencies, amplitudes, thresholds) based on the data provided in the `challengeConfig` prop instead of using hardcoded `INTERPRETATIONS`. You may need to restructure how `INTERPRETATIONS` is defined or accessed to make it dynamic based on the challenge config.
    *   Ensure the component continues to use the `advanceNarrative` prop to signal completion.

7.  **Refine `advanceNarrativeAction` (`src/store/useGameStore.js`):**
    *   Ensure the cleanup steps (setting `activeTuningChallenge` to null and `currentView` to 'narrative') are correctly placed after the game state update and before saving.

**Component Interaction and State Flow (Mermaid Diagram):**

```mermaid
graph TD
    App -- Reads currentView --> useGameStore
    App -- Renders based on currentView --> NarrativeReader
    App -- Renders based on currentView --> PerceptionPage
    NarrativeReader -- Calls setActiveTuningChallenge --> useGameStore
    PerceptionPage -- Reads activeTuningChallenge --> useGameStore
    PerceptionPage -- Reads advanceNarrativeAction --> useGameStore
    PerceptionPage -- Passes props --> SignalTuningInterface
    SignalTuningInterface -- Calls advanceNarrative --> PerceptionPage
    PerceptionPage -- Calls advanceNarrativeAction --> useGameStore
    GameContainer -- Reads currentView --> useGameStore
    GameContainer -- Calls setView --> useGameStore
    useGameStore -- Updates state --> App
    useGameStore -- Updates state --> NarrativeReader
    useGameStore -- Updates state --> PerceptionPage
    useGameStore -- Updates state --> GameContainer