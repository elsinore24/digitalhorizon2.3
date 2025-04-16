# Plan: Paginated Narrative Reader System

**Objective:** Create a system to display longer narrative texts, allowing users to read at their own pace with page turns, while playing associated audio.

**Key Requirements:**
*   Support longer text content than the current dialogue system.
*   Allow user-controlled pagination (e.g., Next/Previous buttons).
*   Store narrative text externally for easy management.
*   Play associated audio narration alongside the text.

**Proposed Solution:**

**1. Folder Structure & File Format:**
*   **Folder:** `public/narratives/` (Chosen for easy fetching via base URL).
*   **File Format:** JSON. Each file represents a narrative sequence.
*   **Example (`public/narratives/professor_joker_intro.json`):**
    ```json
    {
      "id": "professor_joker_intro",
      "audio": "audio/narratives/professor_joker_intro.mp3",
      "pages": [
        "Professor Joker? Can you hear me? Your neural connection is stabilizing... There you are. The transfer was rougher than anticipated.",
        "Your consciousness has been projected into this data construct while your physical form remains in stasis back at the institute.",
        "I'm ALARA - Advanced Linguistic Analysis and Retrieval Algorithm. I've been tasked with guiding you through these forgotten data fragments."
      ]
    }
    ```
    *   *Note:* Each string in the `pages` array represents one screen/page of text. Length should be determined based on comfortable reading chunks.

**2. New Component: `NarrativeReader.jsx`**
*   **Location:** `src/components/NarrativeReader/index.jsx` (and corresponding `.module.scss`).
*   **Props:** Accepts `narrativeId` (e.g., "professor_joker_intro").
*   **Functionality:**
    *   On mount/`narrativeId` change, fetches `/narratives/${narrativeId}.json`.
    *   Stores fetched data (pages, audio path) in state.
    *   Manages `currentPageIndex` state (defaulting to 0).
    *   Displays `pages[currentPageIndex]` as the current text.
    *   Renders "Next" and "Previous" buttons.
        *   "Previous" button disabled if `currentPageIndex` is 0.
        *   "Next" button disabled if `currentPageIndex` is the last page.
        *   Buttons update `currentPageIndex`.
    *   Handles loading and error states during fetch.

**3. Integration:**
*   Components that need to display long narratives (e.g., `LunarArrival.jsx`) will conditionally render `<NarrativeReader narrativeId="some_id" />` instead of `<DialogueSystem />` or `<DialogueDisplay />`. The logic for choosing which component to render needs to be determined (e.g., based on dialogue length or a specific flag).

**4. Audio Handling (Initial Approach):**
*   When `NarrativeReader` successfully fetches the JSON data:
    *   It extracts the `audio` path.
    *   It calls a function (likely from `useAudio` hook) to play this audio file from the beginning.
    *   The audio plays continuously, regardless of page turns. The user controls text pacing independently.
    *   *Future Enhancement:* Consider more complex audio sync later if needed.

**Process Flow Diagram:**

```mermaid
graph TD
    A[Scene Trigger] --> B{Narrative Manager/Trigger};
    B -- Narrative ID --> C[NarrativeReader Component];
    C --> D{Fetch /narratives/[ID].json};
    D -- JSON Data --> C;
    C -- Display pages[currentPageIndex] --> E[UI: Text Display];
    C -- Audio Path --> F{Audio System (useAudio)};
    F -- Play Full Audio --> G[Audio Output];
    H[UI: Next/Prev Buttons] -- Click --> C;
    C -- Update currentPageIndex --> E;
```

**Next Steps:**
1.  Create the `NarrativeReader` component structure (JSX, SCSS).
2.  Implement the JSON fetching logic.
3.  Implement state management for pages and current index.
4.  Implement rendering of text and navigation buttons.
5.  Integrate audio playback trigger.
6.  Modify triggering components (e.g., `LunarArrival`) to use `NarrativeReader`.