# Plan: Debug Event Blocking for Data Perception Toggle

This plan aims to diagnose why the data perception mode cannot be toggled *off* after being toggled *on*, likely due to event blocking by elements visible in that mode.

## Problem Diagnosis

- The data perception mode toggles correctly from `false` to `true`.
- Visuals update correctly when the mode becomes active.
- Console logs show that when the mode is active (`dataPerceptionActive: true`), the event handlers in `GameContainer.jsx` (for 'Tab' key and button click) are *not* being triggered when attempting to toggle back to `false`.
- This indicates an element visible only in data perception mode is capturing/blocking these events. Likely candidates are the `.dataElements` container or the `TemporalEcho` components within it.

## Debugging Strategy

Temporarily disable pointer events on the suspected blocking elements (`.dataElements` and `.echo`) to see if this allows the toggle events to reach their listeners.

## Plan Steps

1.  **Disable `.dataElements` Interaction:**
    *   **File:** `src/scenes/LunarArrival/LunarArrival.module.scss`
    *   **Action:** Add `pointer-events: none;` to the `.dataElements` CSS rule.
    *   **Tool:** `apply_diff`.
2.  **Disable `TemporalEcho` Interaction:**
    *   **File:** `src/components/TemporalEcho.module.scss`
    *   **Action:** Change `pointer-events: all;` to `pointer-events: none;` for the `.echo` CSS rule.
    *   **Tool:** `apply_diff`.
3.  **Test and Analyze:**
    *   Run the application.
    *   Toggle data perception ON.
    *   Attempt to toggle data perception OFF using both the 'Tab' key and the button.
    *   *Does the toggle OFF now work?*
4.  **Formulate Fix:**
    *   If toggling OFF works, the blocking was caused by one or both disabled elements. Determine if the echoes *need* pointer events. If not, the fix might be permanent. If they do, a more nuanced solution (e.g., only enabling pointer events on specific parts of the echo, or adjusting event propagation) will be needed.
    *   If toggling OFF *still* doesn't work, the event blocking is happening elsewhere, requiring further investigation.

## Next Steps

- Implement the `pointer-events: none;` changes using `apply_diff` in Code mode.
- Request user testing and feedback.