# Plan to Fix NarrativeReader ReferenceError

## Problem Analysis

The console output shows an `Uncaught ReferenceError: animationFrameIdRef is not defined` in `src/components/NarrativeReader/index.jsx`. Upon examining the code, it was found that `animationFrameIdRef` is declared and managed within the `useAutoScroll` hook (`src/hooks/useAutoScroll.js`), but the `NarrativeReader` component was attempting to access it directly in its `useEffect` hook responsible for scrolling and image synchronization. This indicates a duplication of animation frame management logic and an incorrect access pattern.

## Proposed Solution

The plan is to centralize the animation frame management within the `useAutoScroll` hook and allow the `NarrativeReader` component to provide a callback function to handle actions that need to occur on each scroll animation frame, such as image synchronization.

## Plan Steps

1.  **Modify `useAutoScroll.js`:**
    *   Add a new optional parameter to the hook's arguments, for example, `onScrollFrame`. This parameter will accept a callback function.
    *   Inside the `scrollText` function within `useAutoScroll`, after calculating the `currentTime` and `progress` of the audio playback, call the `onScrollFrame` callback if it is provided. Pass the `currentTime` and `progress` as arguments to this callback.

2.  **Modify `NarrativeReader/index.jsx`:**
    *   Remove the `useEffect` block that currently handles both scrolling and image synchronization (approximately lines 316 to 403). This logic is being moved or refactored.
    *   Create a new callback function within `NarrativeReader` using the `useCallback` hook. This function will contain the logic for synchronizing the displayed image based on the `currentTime` and `progress` (the logic currently found within lines 336-359 of the removed effect). Ensure this callback has the necessary dependencies (`narrativeData`, `setCurrentImageUrl`).
    *   When calling the `useAutoScroll` hook in `NarrativeReader` (around line 40), pass the newly created image synchronization callback as the `onScrollFrame` parameter.
    *   Review the dependencies passed to the `useAutoScroll` hook and the dependencies of the new image synchronization callback to ensure they are correct and prevent unnecessary re-renders or stale closures.

## Visual Representation of the Flow

```mermaid
graph TD
    A[NarrativeReader Component] --> B{Calls useAutoScroll Hook with onScrollFrame Callback};
    B --> C[useAutoScroll Hook];
    C --> D[Manages animationFrameIdRef];
    C --> E[Runs scrollText function on animation frame];
    E --> F{Calculates currentTime and progress};
    F --> G{Calls onScrollFrame callback with currentTime and progress};
    G --> H[Image Sync Logic in NarrativeReader Callback];
    H --> I[Updates currentImageUrl state];

    A --> H; % NarrativeReader defines the Image Sync Logic
```

## Implementation

Once this plan is approved and written to a file, I will switch to Code mode to implement the changes in `src/hooks/useAutoScroll.js` and `src/components/NarrativeReader/index.jsx`.