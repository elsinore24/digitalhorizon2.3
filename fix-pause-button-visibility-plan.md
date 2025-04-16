# Plan to Fix Disappearing Pause/Resume Button

## Problem

After pausing the narrative playback, the pause/resume button disappears from the UI, preventing the user from resuming playback.

## Analysis

1.  **Button Rendering Logic (`src/components/NarrativeReader/index.jsx` lines 236-241):** The Play/Pause button is conditionally rendered using `{isPlaying && (<button>...</button>)}`.
2.  **State Change on Pause:** When the user clicks "Pause", the `isPlaying` state (managed in `AudioContext`) is set to `false`.
3.  **Re-render:** The `NarrativeReader` component re-renders.
4.  **Condition Fails:** The condition `{isPlaying && ...}` evaluates to `false`, causing the entire button element to be removed from the DOM.

## Proposed Fix

Modify the conditional rendering logic for the Play/Pause button in `src/components/NarrativeReader/index.jsx`:

1.  **Change Condition:** Instead of checking `isPlaying`, the button should be rendered whenever `narrativeData` is truthy (meaning a narrative is loaded and active). This aligns with how the rest of the narrative controls (like the text box and page numbers) are displayed.
2.  **Keep Internal Logic:** The text displayed *inside* the button (`{isPausedByUser ? 'Resume' : 'Pause'}`) already correctly handles switching between "Pause" and "Resume" based on user interaction and does not need to be changed.

**Modified JSX Snippet:**

```jsx
              {/* Play/Pause Button - Render when narrative is loaded */}
              {narrativeData && ( // Changed condition from isPlaying to narrativeData
                 <button onClick={handlePlayPause}>
                   {isPausedByUser ? 'Resume' : 'Pause'}
                 </button>
              )}
```

## Diagram

```mermaid
graph TD
    A[Narrative Loaded] --> B{narrativeData is not null};
    B --> C{Render Button Container};
    C --> D{Check isPausedByUser};
    D -- True --> E[Show "Resume" Text];
    D -- False --> F[Show "Pause" Text];

    G[Pause Clicked] --> H{isPlaying becomes false};
    H --> I{Component Re-renders};
    I --> B; # Button container still renders because narrativeData is not null
    B --> C;
    C --> D;
    D -- True --> E; # Button now shows "Resume"