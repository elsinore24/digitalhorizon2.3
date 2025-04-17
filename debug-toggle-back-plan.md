# Plan: Debug Data Perception Toggle Back

This plan aims to diagnose why the data perception mode cannot be toggled *off* after being toggled *on*.

## Problem Diagnosis

- The data perception mode toggles correctly from `false` to `true`.
- Visuals update correctly when the mode becomes active.
- However, subsequent attempts (via 'Tab' key or button click) to toggle the mode back from `true` to `false` fail.
- This suggests that when the mode is active, something prevents the event handlers (key press, button click) from successfully triggering the `toggleDataPerception` state update function again. Potential causes include event blocking by overlay elements or focus management issues.

## Debugging Strategy

Re-introduce `console.log` statements at key points in the event and state update flow to pinpoint where the process breaks down when trying to toggle *off*.

## Plan Steps

1.  **Re-add Logs to Event Handlers:**
    *   **File:** `src/components/GameContainer.jsx`
    *   **Action:** Add `console.log` inside the `handleKeyPress` function (to log all key presses) and specifically within the `if (e.key === 'Tab')` block.
    *   **Action:** Add `console.log` inside the `onClick` handler for the toggle button.
    *   **Tool:** `apply_diff`.
2.  **Re-add Logs to State Update:**
    *   **File:** `src/hooks/useGameState.js`
    *   **Action:** Add `console.log` statements inside the `toggleDataPerception` function to show the state *before* and *after* the attempted toggle.
    *   **Tool:** `apply_diff`.
3.  **Verify Pointer Events (Manual Check):**
    *   Ensure `.overlay` in `DataPerceptionOverlay.module.scss` still has `pointer-events: none;`.
    *   Ensure `.dataElements` in `LunarArrival.module.scss` does not have `pointer-events: all;` (it shouldn't by default).
4.  **Test and Analyze:**
    *   Run the application.
    *   Toggle data perception ON.
    *   Attempt to toggle data perception OFF using both the 'Tab' key and the button.
    *   Observe the browser console logs carefully.
        *   *Are the key press/button click events logged when trying to toggle off?*
        *   *If yes, is the `toggleDataPerception` function in the hook logged as being called?*
        *   *If yes, what are the 'before' and 'after' states logged?*
5.  **Formulate Fix:** Based on the log analysis, determine the exact cause (event blocking, focus issue, other logic error) and create a plan to fix it.

## Next Steps

- Implement the logging changes using `apply_diff` in Code mode.
- Request user testing and log feedback.