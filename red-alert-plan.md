# Red Alert Implementation Plan

This plan outlines the steps to implement a dedicated state flag for the Red Alert screen and update the "Enter Digital Horizons" button handler to trigger it.

**Files to be modified:**

*   `src/store/useGameStore.js`
*   `src/scenes/LunarArrival/index.jsx`

**Plan Steps:**

1.  **Update `src/store/useGameStore.js`**:
    *   Add a new state variable `isRedAlertActive: false` to the `initialGameState`.
    *   Add a new action `setRedAlertActive: (isActive) => set({ gameState: { ...get().gameState, isRedAlertActive: isActive } })` to the store.

2.  **Update `src/scenes/LunarArrival/index.jsx`**:
    *   Import the new `setRedAlertActive` action from `../../store/useGameStore`.
    *   Modify the `handleEnter` function to call `setRedAlertActive(true)` when the "Enter Digital Horizons" button is clicked. Remove the existing `updateGameState` calls within `handleEnter`.
    *   Update the conditional rendering for the `RedAlertInterface` component to use `gameState.isRedAlertActive` instead of `gameState.introPhase === 'redAlert'`.

**State Flow Diagram:**

```mermaid
graph TD
    A[Initial State] --> B{Click "Enter Digital Horizons"};
    B --> C[Call setRedAlertActive(true)];
    C --> D[Game State: isRedAlertActive = true];
    D --> E[Render RedAlertInterface];
    E --> F{Red Alert Action Taken};
    F --> G[Call setRedAlertActive(false)];
    G --> H[Game State: isRedAlertActive = false];
    H --> I[Proceed to next state/view];