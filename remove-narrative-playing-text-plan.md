# Plan: Remove "Narrative playing..." Text

**Objective:** Prevent the text "Narrative playing..." from appearing in the dialogue display when narrative audio starts playing.

**Analysis:**

1.  **Origin:** The text originates from a temporary dialogue object created within the `playAudioFile` function in `src/contexts/AudioContext.jsx` (around line 624):
    ```javascript
    const tempDialogueInfo = { speaker: 'Narrator', text: 'Narrative playing...' };
    ```
2.  **State Update:** This object is used to set the `currentDialogue` state in the `AudioContext`.
3.  **Display:** The `src/components/DialogueDisplay.jsx` component reads `currentDialogue.text` and displays it.

**Proposed Solution:**

Modify the `tempDialogueInfo` object in `src/contexts/AudioContext.jsx` to have an empty string for the `text` property.

**Steps:**

1.  **Edit File:** Open `src/contexts/AudioContext.jsx`.
2.  **Locate Function:** Find the `playAudioFile` function.
3.  **Modify Line:** Change the line defining `tempDialogueInfo` (around line 624) from:
    ```javascript
    const tempDialogueInfo = { speaker: 'Narrator', text: 'Narrative playing...' };
    ```
    to:
    ```javascript
    const tempDialogueInfo = { speaker: 'Narrator', text: '' };
    ```

**Rationale:**

*   This directly targets the source of the unwanted text.
*   It has minimal impact on the surrounding logic, as the `currentDialogue` state is still set, but with empty text.
*   `DialogueDisplay` will render an empty string instead of the placeholder text.

**Diagram:**

```mermaid
graph TD
    A[NarrativeReader calls playAudioFile] --> B(AudioContext: playAudioFile);
    B --> C_mod{Create tempDialogueInfo\n(text: '')};
    C_mod --> D[Set currentDialogue state];
    D --> E[DialogueDisplay reads currentDialogue];
    E --> F_mod[DialogueDisplay shows empty text];