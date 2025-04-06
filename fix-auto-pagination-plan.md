# Plan to Fix Narrative Auto-Pagination

## Problem

The automatic page turning in the `NarrativeReader` component, which relies on audio timestamps from JSON files, is not working correctly on non-iOS devices (specifically tested on Windows/Chrome).

## Analysis

1.  **Narrative Data:** JSON files (`public/narratives/*.json`) contain `pages` arrays with `text` and `timestamp` properties.
2.  **Narrative Reader (`src/components/NarrativeReader/index.jsx`):** This component fetches the narrative data, plays the associated audio using the `useAudio` hook, and attempts to auto-turn pages based on the audio's `currentTime`. It uses `getAudioInstance()` from the `useAudio` hook to get the audio element and attach a `timeupdate` listener.
3.  **Audio Hook (`src/hooks/useAudio.js`):** This hook acts as a pass-through, getting state and functions from `AudioContext`.
4.  **Audio Context (`src/contexts/AudioContext.jsx`):**
    *   Detects the platform (iOS vs. non-iOS).
    *   Uses different playback strategies:
        *   **iOS:** `playAudioWithToneRef` creates a temporary HTML5 audio element (`iosAudioElement`) and assigns it to `audioRef.current`.
        *   **Non-iOS:** `playAudioWithElementRef` uses a persistent hidden HTML5 audio element (`audioElementRef.current`) for playback.
    *   The `getAudioInstance` function returns `audioRef.current`.

## Hypothesis

On non-iOS devices, the `playAudioWithElementRef` function plays audio using `audioElementRef.current` but **fails to update `audioRef.current`**. As a result, `getAudioInstance()` returns an incorrect or null reference to the `NarrativeReader`, preventing the `timeupdate` listener from being attached to the correct audio element.

## Proposed Fix

Modify the `playAudioWithElementRef` function within `src/contexts/AudioContext.jsx` (around line 341) to explicitly assign the currently playing audio element reference to the reference returned by `getAudioInstance`.

**Change:** Add `audioRef.current = audioElementRef.current;` inside the `playAudioWithElementRef` function, likely after setting the `src` attribute and before attempting to play.

## Diagram

```mermaid
sequenceDiagram
    participant NR as NarrativeReader
    participant UA as useAudio Hook
    participant AC as AudioContext
    participant AE as audioElementRef (HTML5 Audio)
    participant AR as audioRef (Returned by getAudioInstance)

    %% ... (Initial steps same as before) ...

    AC->>AC: Call playAudioWithElementRef(url, id, info)
    AC->>AE: Set src = url
    AC->>AR: **Proposed Fix:** AR.current = AE.current
    AC->>AE: Add event listeners (onloadeddata, onended, onerror)
    AC->>AE: Connect Analyzer
    AC->>AE: play()
    AC-->>UA: (Playback starts)
    UA-->>NR: (Playback starts)

    NR->>UA: getAudioInstance()
    UA->>AC: getAudioInstance()
    AC-->>UA: Return AR.current (Now correct)
    UA-->>NR: Return AR.current (Correct)
    NR->>AR: addEventListener('timeupdate', ...)
    Note right of NR: Listener attached successfully!