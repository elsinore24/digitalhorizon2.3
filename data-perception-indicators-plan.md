# Plan: Conditionally Render Indicators based on Data Perception

**Goal:** Make the three top status indicators (Neural Stability, Physical Vitality, Consciousness Spectrum) visible only when the Data Perception mode is active.

**Context:**
*   **Indicators:** `NeuralStabilityIndicator`, `PhysicalVitalityIndicator`, `ConsciousnessSpectrumIndicator` located within `src/components/GameUIIndicators/IndicatorContainer.jsx`.
*   **Container:** `IndicatorContainer` is rendered by `src/components/TopStatusBar/index.jsx`.
*   **Control State:** The `dataPerceptionActive` boolean state within `GameStateContext` (`src/contexts/GameStateContext.jsx`) determines if Data Perception is active.
*   **Behavior:** Indicators should appear/disappear in place (conditional rendering).

**Implementation Steps:**

1.  **Modify File:** `src/components/TopStatusBar/index.jsx`
2.  **Import Dependencies:**
    *   Add `import { useContext } from 'react';`
    *   Add `import { GameStateContext } from '../../contexts/GameStateContext';` (adjust path if necessary).
3.  **Access Context:** Inside the `TopStatusBar` component function, get the game state:
    ```javascript
    const { gameState } = useContext(GameStateContext);
    ```
4.  **Conditional Rendering:** Wrap the `<IndicatorContainer ... />` component instance in a conditional check based on `gameState.dataPerceptionActive`:
    ```jsx
    {gameState.dataPerceptionActive && (
      <IndicatorContainer
        neuralValue={neuralValue}
        vitalityValue={vitalityValue}
        consciousnessHuman={consciousnessHuman}
        consciousnessAI={consciousnessAI}
      />
    )}
    ```
    *(Note: Ensure `neuralValue`, `vitalityValue`, etc., are still defined or fetched appropriately if they are meant to come from the game state as well, though the current implementation uses placeholders).*

**Visual Flow:**

```mermaid
graph TD
    subgraph TopStatusBar Component
        A[Access GameStateContext] --> B{Get dataPerceptionActive state};
        B -- If true --> C[Render IndicatorContainer];
        B -- If false --> D[Render Nothing for Indicators];
        C --> E[NeuralStabilityIndicator];
        C --> F[PhysicalVitalityIndicator];
        C --> G[ConsciousnessSpectrumIndicator];
    end
    H[GameStateContext] -- Provides dataPerceptionActive --> A;