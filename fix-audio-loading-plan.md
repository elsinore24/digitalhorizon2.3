# Plan to Fix Audio Loading Logic

**Goal:** Modify the application to load narration audio based on the `audio` path specified within the narrative JSON files (e.g., `public/narratives/moon_dialogue.json`), resolving the 404 error caused by the current logic attempting to load missing local files.

**Steps:**

1.  **Modify `src/components/NarrativeReader/index.jsx`:**
    *   Locate the `fetchNarrative` function within the `useEffect` hook.
    *   Replace the line that currently constructs the audio path using `narrativeId` (approx. line 59: `playAudioFile(\`audio/narration/${narrativeId}.mp3\`);`) with the following logic:
        ```javascript
        if (data.audio) {
          playAudioFile(data.audio); // Use the path from the JSON data
        } else {
          console.warn(`Narrative ${narrativeId} is missing the 'audio' property in its JSON data.`);
        }
        ```
    *   Remove the commented-out line related to `data.audio` (approx. line 62: `// playAudio(data.audio);`).

2.  **Modify `src/contexts/AudioContext.jsx`:**
    *   Comment out or remove the local `getAudioUrl` function definition (lines 8-11). This function incorrectly forces local path usage.
    *   Comment out or remove the `playNarration` function definition (lines 570-662). Playback initiation will now be handled by `NarrativeReader` calling `playAudioFile`.

**Diagram:**

```mermaid
graph TD
    A[NarrativeReader Loads JSON] --> B(Extract 'data.audio' path);
    B --> C{Check if data.audio exists};
    C -- Yes --> D[Call playAudioFile(data.audio)];
    C -- No --> E[Log Warning];
    D --> F[AudioContext plays file from public path];

    G[AudioContext.jsx] --> H(Remove local getAudioUrl);
    G --> I(Remove/Comment playNarration);
```

**Implementation:**

These changes will be implemented by switching to Code mode.