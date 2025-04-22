# Plan to Fix `ReferenceError: audioInstance is not defined` in NarrativeReader

## Problem Description

A `ReferenceError: audioInstance is not defined` occurs in the `NarrativeReader` component at `src/components/NarrativeReader/index.jsx:394`. This error happens within the cleanup function of a `useEffect` hook responsible for synchronizing text scrolling and image display with audio playback. The error is caused by the `audioInstance` variable, which is declared within the effect's callback, not being accessible in the scope of the cleanup function.

## Analysis

- The `NarrativeReader` component uses the `useAudio` hook to manage audio playback.
- The `useAudio` hook provides a `getAudioInstance()` function to retrieve the current audio instance.
- The `useEffect` on lines 315-394 in `src/components/NarrativeReader/index.jsx` gets the audio instance inside its callback using `getAudioInstance()` (line 316).
- The cleanup function for this effect (lines 389-393) attempts to use `animationFrameIdRef.current`, but the error occurs because `audioInstance` is not defined in the cleanup's scope.
- The `useAutoScroll` hook, used by `NarrativeReader`, receives the audio instance as a prop and uses it internally, but the `ReferenceError` originates in `NarrativeReader`'s effect cleanup, not within `useAutoScroll`.

## Plan

The plan is to ensure the `audioInstance` is accessible within the cleanup function of the problematic `useEffect` in `NarrativeReader` by storing it in a `useRef`.

1.  **Introduce a `useRef` for the audio instance:**
    *   In `src/components/NarrativeReader/index.jsx`, add a `useRef` to the component to store the audio instance.
    ```javascript
    const currentAudioInstanceRef = useRef(null);
    ```

2.  **Store the audio instance in the ref:**
    *   Inside the `useEffect` on line 315, after obtaining the `audioInstance` from `getAudioInstance()`, store it in the newly created ref.
    ```javascript
    const audioInstance = getAudioInstance();
    currentAudioInstanceRef.current = audioInstance; // Store instance in ref
    ```

3.  **Access the audio instance via the ref in the cleanup:**
    *   Modify the cleanup function of the same `useEffect` (lines 389-393) to access the audio instance using `currentAudioInstanceRef.current`.
    ```javascript
    return () => {
      // Access via ref
      if (animationFrameIdRef.current && currentAudioInstanceRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      // Optionally clear the ref on cleanup if needed, depending on lifecycle
      // currentAudioInstanceRef.current = null;
    };
    ```
    *(Note: Clearing the ref might not be strictly necessary here as the effect will re-run and set it again, but it can be good practice depending on the component's lifecycle.)*

4.  **Remove `audioInstance` from the dependency array:**
    *   Remove `audioInstance` from the dependency array of the `useEffect` on line 394. The effect should re-run based on changes to `isPlaying`, `isPausedByUser`, `isAutoScrollEnabled`, `audioDuration`, `updateScrollPosition`, and `narrativeData`. The `getAudioInstance()` call inside the effect will retrieve the current instance when the effect runs.

## Implementation Steps (for Code Mode)

1.  Open `src/components/NarrativeReader/index.jsx`.
2.  Add `const currentAudioInstanceRef = useRef(null);` near the other `useRef` declarations.
3.  Locate the `useEffect` starting around line 315.
4.  Inside the effect's callback, after `const audioInstance = getAudioInstance();`, add `currentAudioInstanceRef.current = audioInstance;`.
5.  Modify the cleanup function within this `useEffect` to use `currentAudioInstanceRef.current` when checking if the audio instance exists before cancelling the animation frame.
6.  Remove `audioInstance` from the dependency array of this `useEffect`.
7.  Save the file.
8.  Test the application to confirm the error is resolved and scrolling/image sync works correctly.

## Mermaid Diagram

```mermaid
graph TD
    A[NarrativeReader Component] --> B{useEffect for Scroll & Image Sync};
    B --> C[Get audioInstance via getAudioInstance()];
    C --> D[Store audioInstance in currentAudioInstanceRef.current];
    B --> E[Define cleanup function];
    E --> F[Access audio instance via currentAudioInstanceRef.current];
    F --> G[Cancel animation frame];
    B --> H[Dependency Array (excluding audioInstance)];
    H --> B;