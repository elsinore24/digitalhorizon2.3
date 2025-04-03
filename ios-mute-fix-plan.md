# iOS Mute Button Fix Plan

## Problem

The mute button works on desktop but not on iOS. This is because the `AudioContext` uses different audio playback mechanisms for each platform:
*   **Desktop:** Uses a persistent HTML5 `<audio>` element (`audioElementRef`).
*   **iOS:** Uses temporary HTML5 `<audio>` elements (`iosAudioElement`) created for each playback instance.
*   **Current Mute Logic:** Only targets the persistent `audioElementRef`, thus failing to mute the temporary elements used on iOS.

## Solution

Modify `src/contexts/AudioContext.jsx` as follows:

1.  **Update `toggleMute` Function:**
    *   Continue updating the `isMuted` state.
    *   Continue setting the `.muted` property on `audioElementRef.current`.
    *   **Add:** Check if `audioRef.current` (which points to the currently active audio element, potentially the temporary iOS one) exists and set its `.muted` property according to the new `isMuted` state.

2.  **Update `playAudioWithTone` Function (iOS Playback):**
    *   **Add:** When creating a new temporary `iosAudioElement`, check the current `isMuted` state *before* playback starts.
    *   Set the initial `.muted` property of the new `iosAudioElement` to match the current `isMuted` state.

## Diagram

```mermaid
sequenceDiagram
    participant User
    participant MuteButton
    participant AudioContext
    participant audioElementRef (Desktop)
    participant iosAudioElement (iOS - Temporary)

    User->>MuteButton: Clicks Mute/Unmute
    MuteButton->>AudioContext: Calls toggleMute()

    alt Currently Playing on Desktop
        AudioContext->>AudioContext: Toggle isMuted state
        AudioContext->>audioElementRef: Set .muted property
    else Currently Playing on iOS
        AudioContext->>AudioContext: Toggle isMuted state
        AudioContext->>audioElementRef: Set .muted property (no effect on iOS sound)
        AudioContext->>iosAudioElement: Set .muted property (via audioRef)
    else Nothing Playing
        AudioContext->>AudioContext: Toggle isMuted state
        AudioContext->>audioElementRef: Set .muted property
    end

    User->>AudioContext: Initiates Playback (e.g., playNarration)

    alt Playback on Desktop
        AudioContext->>audioElementRef: Starts playing (respects .muted)
    else Playback on iOS
        AudioContext->>AudioContext: Creates new iosAudioElement
        AudioContext->>AudioContext: Checks isMuted state
        AudioContext->>iosAudioElement: Sets initial .muted property based on state
        AudioContext->>iosAudioElement: Starts playing
    end
```

## Summary

This plan ensures the mute button controls the correct audio element on both desktop and iOS, and that new audio playback on iOS respects the current mute state.