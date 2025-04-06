# Plan to Fix AudioContext ReferenceError

## Analysis

*   **Error:** `Uncaught ReferenceError: Cannot access 'playAudioWithElement' before initialization` in `src/contexts/AudioContext.jsx` at line 358.
*   **Cause:** The `useEffect` hook defined between lines 331-358 attempts to access functions (`playAudioWithElement`, `playAudioWithTone`) listed in its dependency array (line 358). However, these functions are defined *after* the hook using `useCallback` (starting at lines 361 and 411 respectively). Functions defined with `const func = useCallback(...)` are not fully hoisted like standard function declarations, meaning they aren't available before their definition is encountered during execution.
*   **Secondary Issue:** The warning "The AudioContext was not allowed to start..." is standard browser behavior requiring user interaction to initiate audio. This is likely handled by existing code (`resumeAudioContext`) and should resolve once the primary ReferenceError is fixed.

## Proposed Plan

1.  **Reorder Definitions:** Modify `src/contexts/AudioContext.jsx` by moving the `useCallback` definitions for `playAudioWithElement` (lines 361-408) and `playAudioWithTone` (lines 411-562) to *before* the `useEffect` hook (lines 331-358) that depends on them. This ensures the functions are initialized before the effect hook attempts to access them.

## Visualization

```mermaid
graph TD
    subgraph "Current Order (Causes Error)"
        A[Component Renders] --> B{useEffect (lines 331-358) runs};
        B --> C{Access playAudioWithElement/playAudioWithTone};
        D[useCallback definitions (lines 361+)] --> E{Functions Initialized};
        C -- Error! --> F(ReferenceError: Accessed before initialization);
    end

    subgraph "Proposed Order (Fix)"
        G[Component Renders] --> H[useCallback definitions run];
        H --> I{Functions Initialized};
        I --> J{useEffect (lines 331-358) runs};
        J --> K{Access playAudioWithElement/playAudioWithTone};
        K --> L[Functions Accessed Successfully];
    end