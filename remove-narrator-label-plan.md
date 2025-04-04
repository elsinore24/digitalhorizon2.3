# Plan: Remove "NARRATOR" Speaker Label

**Objective:** Prevent the speaker label "NARRATOR" from appearing in the dialogue display when narrative audio starts playing via `playAudioFile`.

**Analysis:**

1.  **Origin:** The label originates from the `speaker` property of a temporary dialogue object created within the `playAudioFile` function in `src/contexts/AudioContext.jsx` (around line 624):
    ```javascript
    // Code before this change, after removing "Narrative playing..." text
    const tempDialogueInfo = { speaker: 'Narrator', text: '' };
    ```
2.  **State Update:** This object is used to set the `currentDialogue` state in the `AudioContext`.
3.  **Display:** The `src/components/DialogueDisplay.jsx` component reads `currentDialogue.speaker` (line 41) and displays it.

**Proposed Solution:**

Modify the `tempDialogueInfo` object in `src/contexts/AudioContext.jsx` to have an empty string for the `speaker` property.

**Steps:**

1.  **Edit File:** Open `src/contexts/AudioContext.jsx`.
2.  **Locate Function:** Find the `playAudioFile` function.
3.  **Modify Line:** Change the line defining `tempDialogueInfo` (around line 624) from:
    ```javascript
    const tempDialogueInfo = { speaker: 'Narrator', text: '' };
    ```
    to:
    ```javascript
    const tempDialogueInfo = { speaker: '', text: '' };
    ```

**Rationale:**

*   This directly targets the source of the unwanted speaker label.
*   It has minimal impact on the surrounding logic, as the `currentDialogue` state is still set, but with an empty speaker.
*   `DialogueDisplay` will render an empty string for the speaker instead of "NARRATOR".

**Diagram:**

```mermaid
graph TD
    A[NarrativeReader calls playAudioFile] --> B(AudioContext: playAudioFile);
    B --> C_mod{Create tempDialogueInfo\n(speaker: '', text: '')};
    C_mod --> D[Set currentDialogue state];
    D --> E[DialogueDisplay reads currentDialogue];
    E --> F_mod[DialogueDisplay shows empty speaker & text];