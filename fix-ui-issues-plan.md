# Plan: Fix UI Issues (Visualizer & Toggle)

This plan addresses two UI issues: permanently hiding the audio visualizer and debugging the non-functional data perception toggle.

## Problem Identification

1.  **Audio Visualizer Display:** The user wants the `<AudioVisualizer />` component to stop being displayed. It's currently rendered conditionally in `src/App.jsx` and `src/components/DialogueSystem/index.jsx`.
2.  **Data Perception Toggle:** The toggle button and 'Tab' key shortcut for data perception mode are not working. The state management logic in `src/hooks/useGameState.js` and the event handling in `src/components/GameContainer.jsx` appear correct, suggesting a more subtle issue requiring debugging.

## Plan Steps

1.  **Hide Audio Visualizer:**
    *   **File:** `src/App.jsx`
    *   **Action:** Comment out the block rendering `<AudioVisualizer />` (lines 23-43).
    *   **Tool:** `apply_diff`.
    *   **File:** `src/components/DialogueSystem/index.jsx`
    *   **Action:** Comment out the block rendering `<AudioVisualizer />` (lines 30-35).
    *   **Tool:** `apply_diff`.
2.  **Debug Data Perception Toggle:** Add `console.log` statements to trace the execution flow and state changes.
    *   **File:** `src/components/GameContainer.jsx`
        *   **Action:** Add logging inside `handleKeyPress` (around line 27) and within the 'Tab' key check (around line 29).
        *   **Action:** Add logging inside the button's `onClick` handler (around line 53).
        *   **Tool:** `apply_diff`.
    *   **File:** `src/hooks/useGameState.js`
        *   **Action:** Add logging before and after the state update within `toggleDataPerception` (around lines 39 and 41).
        *   **Tool:** `apply_diff`.
    *   **File:** `src/App.jsx`
        *   **Action:** Add logging inside `AppContent` to show the `dataPerceptionActive` state on re-renders (around line 15).
        *   **Tool:** `apply_diff`.

## Next Steps

- Implement the changes using `apply_diff` in Code mode.
- Run the application and observe the browser console logs when pressing 'Tab' or clicking the toggle button to diagnose the toggle issue.
- Verify the audio visualizer is no longer displayed.
- Based on the logs, formulate a plan for the toggle fix.