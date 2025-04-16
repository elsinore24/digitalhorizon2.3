# Plan to Fix Audio Path Issue in NarrativeReader

## Analysis Summary

1.  **The Error:** The console shows a `GET` request failing with a `414 URI Too Long` error. The requested URL starts with `https://.../data:audio/mpeg;base64,...`. This indicates a base64 data URI is being treated as a relative file path.
2.  **Data Source:** The `audio` field in the narrative JSON files (e.g., `public/narratives/moon_dialogue.json`) contains the full `data:audio/mpeg;base64,...` string.
3.  **Correct Audio Source:** The actual audio files are located in the `public/audio/narration/` directory, likely named `${narrativeId}.mp3`.
4.  **Code Flow:**
    *   The `NarrativeReader` component (`src/components/NarrativeReader/index.jsx`) fetches the JSON data based on the `narrativeId` prop.
    *   It incorrectly uses the `data.audio` field (the base64 URI) when calling the `playAudioFile` function.
    *   The `playAudioFile` function in `src/contexts/AudioContext.jsx` expects a relative file path and prepends a `/`, creating an invalid URL when given the data URI.
5.  **Root Cause:** The `NarrativeReader` component is using the wrong data source (`data.audio` from JSON) instead of constructing the correct relative path to the audio file based on the `narrativeId`.

## Revised Plan

1.  **Modify `src/components/NarrativeReader/index.jsx`:**
    *   Locate the `fetchNarrative` function (around line 42).
    *   Find the line where `playAudioFile` is called (line 59): `playAudioFile(data.audio);`
    *   **Replace** this line to construct the correct relative `filePath` using the `narrativeId` prop. Assuming the files are MP3s, the path should be `audio/narration/${narrativeId}.mp3`.
    *   The corrected call will be: `playAudioFile(\`audio/narration/${narrativeId}.mp3\`);`
2.  **No Change Needed in `AudioContext.jsx`:** The existing `playAudioFile` function correctly handles relative paths.
3.  **JSON Cleanup (Recommendation):** Remove the large, unnecessary base64 `audio` field from the narrative JSON files to avoid confusion and reduce file size.

## Diagram

```mermaid
graph TD
    A[NarrativeReader: Fetches JSON for narrativeId] --> B{JSON contains text & timestamps};
    A -- narrativeId --> C[NarrativeReader: Constructs filePath = 'audio/narration/' + narrativeId + '.mp3'];
    C --> D[NarrativeReader: Calls playAudioFile(filePath)];
    D --> E{AudioContext: playAudioFile receives filePath};
    E --> G[playAudioFile: prepends '/' --> url = '/audio/narration/...' ];
    G --> H[Playback Function uses correct URL];
    H --> I[Audio Plays Successfully];

    style C fill:#ccf,stroke:#333,stroke-width:2px
    style D fill:#ccf,stroke:#333,stroke-width:2px
```

## Next Steps

1.  Switch to "Code" mode.
2.  Apply the necessary changes to `src/components/NarrativeReader/index.jsx`.
3.  Test the application to ensure the audio plays correctly for narratives.