# Plan: Conditionally Hide DialogueDisplay & App Visualizer via CSS

**Goal:**
1.  Make the audio visualizer rendered directly in `App.jsx` invisible when Data Perception mode is active.
2.  Make the *entire* `DialogueDisplay` component invisible using CSS (`display: none`) when Data Perception mode is active. This preserves the component's internal state (e.g., typing animation) while hidden.
3.  Visibility should be controlled by the `gameState.dataPerceptionActive` state from the `useGameState` hook.
4.  Audio playback should remain unaffected.

**Steps:**

1.  **Modify `AppContent` (within `src/App.jsx`):**
    *   Ensure `useGameState` is imported and `gameState` is retrieved.
    *   Revert the previous change: Render `<DialogueDisplay />` unconditionally (remove the `{ !gameState.dataPerceptionActive && ... }` wrapper).
    *   Pass the `dataPerceptionActive` state down as a prop: `<DialogueDisplay isHidden={gameState.dataPerceptionActive} />`.
    *   Keep the conditional rendering for the separate `<AudioVisualizer />` at the top level of `AppContent` as is (`{isPlaying && !gameState.dataPerceptionActive && ...}`).

2.  **Modify `DialogueDisplay.jsx`:**
    *   Update the component function signature to accept the `isHidden` prop:
        ```javascript
        export default function DialogueDisplay({ isHidden }) { ... }
        ```
    *   Apply a conditional inline style to the root `div` (e.g., the one with `className={styles.dialogueContainer}`) to control its visibility:
        ```jsx
        <div
          className={styles.dialogueContainer}
          style={{ display: isHidden ? 'none' : 'block' }} // Adjust 'block' if needed
        >
          {/* Rest of the component */}
        </div>
        ```

3.  **Ensure `DialogueSystem/index.jsx` is Clean:**
    *   Verify that the conditional logic previously added around the `dialogueHeader` inside `DialogueSystem` has been removed (as done in the previous step). The component should not have visibility logic related to `dataPerceptionActive`.

**Visual Representation:**

```mermaid
graph TD
    A[GameStateProvider wraps App] --> B(useGameState Hook);
    B --> C{gameState.dataPerceptionActive};

    subgraph "AppContent (in App.jsx)"
        D[Get gameState] --> E{Check isPlaying && !gameState.dataPerceptionActive};
        E -- True --> F[Render App Visualizer Container];
        E -- False --> G[Render Nothing for App Visualizer];

        D --> H[Pass isHidden=gameState.dataPerceptionActive to DialogueDisplay];
        H --> I[Render DialogueDisplay (Always Mounted)];
    end

    subgraph "DialogueDisplay.jsx"
        J[Accept isHidden prop] --> K{Check isHidden prop};
        K -- True --> L[Apply style 'display: none' to root div];
        K -- False --> M[Apply style 'display: block' to root div];
        N[Internal state (typing effect) persists]
    end

    C --> E;
    C --> H;
    J --> N;


    style F fill:#ccf,stroke:#333,stroke-width:2px
    style I fill:#cfc,stroke:#333,stroke-width:2px
    style L fill:#f99,stroke:#333,stroke-width:2px
    style M fill:#9cf,stroke:#333,stroke-width:2px
    style N fill:#eee,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5
```

**Next Step:** Switch to Code mode to implement these changes.