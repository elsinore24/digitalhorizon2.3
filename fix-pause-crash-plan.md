# Plan to Fix Narrative Pause Crash

## Problem

When pausing the narrative playback using the pause button, the application crashes with the error: `Uncaught ReferenceError: Cannot access 'handleTimeUpdate' before initialization` originating from `src/components/NarrativeReader/index.jsx` (line 96 in the provided stack trace).

## Analysis

1.  **Pause Action:** Clicking the pause button triggers `handlePlayPause` in `NarrativeReader`, which calls `pauseAudio` from the `useAudio` hook.
2.  **State Change:** `pauseAudio` (in `AudioContext`) sets the `isPlaying` state to `false`.
3.  **Effect Re-run:** The `useEffect` hook in `NarrativeReader` (lines 91-145) depends on `isPlaying`. When `isPlaying` becomes `false`, the effect re-runs its cleanup function.
4.  **Cleanup Logic:** The cleanup function (lines 95-97 and 139-142) attempts to remove the `timeupdate` event listener using `audioInstanceRef.current.removeEventListener('timeupdate', handleTimeUpdate)`.
5.  **Temporal Dead Zone:** At the point the cleanup function runs (specifically line 97), the `handleTimeUpdate` function, which is defined *inside* the `useEffect` hook (starting line 110), has not yet been initialized in the current execution scope of the effect. This causes the `ReferenceError`.

## Proposed Fix

Refactor the `useEffect` hook and the `handleTimeUpdate` function in `src/components/NarrativeReader/index.jsx`:

1.  **Move Definition:** Define the `handleTimeUpdate` function *before* the `useEffect` hook (currently lines 91-145) that uses it.
2.  **Wrap in `useCallback`:** Wrap the `handleTimeUpdate` function definition in `useCallback` to give it a stable reference across renders and declare its dependencies correctly (e.g., `narrativeData`, `isAutoPageTurnEnabled`, `isPausedByUser`, `setCurrentPageIndex`).
3.  **Use Stable Reference:** Update the `useEffect` hook to use the stable `handleTimeUpdate` reference returned by `useCallback` when adding (`addEventListener`) and removing (`removeEventListener`) the listener.

## Diagram

```mermaid
graph TD
    A[Pause Button Clicked] --> B{AudioContext: pauseAudio};
    B --> C{AudioContext: setIsPlaying(false)};
    C --> D{NarrativeReader: useEffect re-runs due to isPlaying change};
    D --> E{Condition `!isPlaying` is true (Line 96)};
    E --> F{Attempt `removeEventListener('timeupdate', handleTimeUpdate)` (Line 97)};
    F --> G{Error: `handleTimeUpdate` not initialized yet (Defined later at Line 111)};

    subgraph Proposed Fix
        H[Define `handleTimeUpdate` *before* useEffect using `useCallback`]
        I[useEffect uses stable `handleTimeUpdate` reference]
        J[Cleanup logic (Line 97 & 142) uses stable reference]
    end

    H --> I;
    I --> J;
    J --> K[No ReferenceError];