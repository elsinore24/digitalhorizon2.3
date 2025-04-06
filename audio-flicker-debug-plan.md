# Audio Flickering/Visualizer Debug Plan

## Problem Analysis

The flickering, audio issues, and visualizer problems seem to stem from the `playAudioFile` function in `AudioContext` having an unstable reference. This causes the `useEffect` hook in `NarrativeReader` (which depends on `playAudioFile`) to re-run repeatedly, triggering a loop of audio restarts and analyzer reconnections.

## Proposed Plan

1.  **Analyze `AudioContext` Dependencies:** Carefully review the `useCallback` dependency arrays for `playAudioFile`, `playAudioWithElement`, `playAudioWithTone`, and `connectAnalyzerToAudio` within `src/contexts/AudioContext.jsx`. Identify any dependencies that might be changing unnecessarily on re-renders.
2.  **Stabilize Function References:** Refactor the `useCallback` hooks in `AudioContext.jsx` to ensure they only depend on values that truly necessitate recreating the function (e.g., use `useRef` for stable references where appropriate).
3.  **Verify `NarrativeReader`:** Confirm that after stabilizing the functions in `AudioContext`, the `useEffect` in `NarrativeReader` no longer triggers unnecessarily.

## Diagram (Conceptual Flow & Problem Area)

```mermaid
graph TD
    A[NarrativeReader Component] -- receives --> NID(narrativeId Prop);
    A -- triggers --> FX1(useEffect [narrativeId, playAudioFile]);
    FX1 -- calls --> PAF(AudioContext.playAudioFile);
    PAF -- depends on --> PAWE(AudioContext.playAudioWithElement);
    PAF -- depends on --> PAWT(AudioContext.playAudioWithTone);
    PAF -- depends on --> CATA(AudioContext.connectAnalyzerToAudio);
    PAWE -- causes state changes --> AC(AudioContext State);
    PAWT -- causes state changes --> AC;
    CATA -- causes state changes --> AC;
    AC -- re-render causes --> PAF_NEW{Potentially New playAudioFile Reference};
    PAF_NEW -- passed back to --> A;
    A -- sees new reference --> FX1; subgraph Problem Loop
    FX1;
    PAF;
    AC;
    PAF_NEW;
    end

    style Problem Loop fill:#f9f,stroke:#333,stroke-width:2px

    %% Styling
    classDef component fill:#ccf,stroke:#333,stroke-width:2px;
    classDef hook fill:#cfc,stroke:#333,stroke-width:2px;
    classDef function fill:#fec,stroke:#333,stroke-width:2px;
    classDef state fill:#eee,stroke:#333,stroke-width:1px;
    class A,AC component;
    class FX1 hook;
    class PAF,PAWE,PAWT,CATA,PAF_NEW function;
    class NID state