# Plan: Replace Dialogue Typewriter with Fade-In Effect

**Objective:** Replace the current character-by-character typewriter effect in the `DialogueSystem` component with a smooth fade-in animation for the entire text block, providing a more comfortable "novel-like" reading experience.

**Chosen Approach:** Fade-In Effect

**Implementation Steps:**

**1. Modify `src/components/DialogueSystem/DialogueSystem.jsx`:**

*   **State Changes:**
    *   Remove the `typingComplete` state variable.
    *   Add a new state variable `isTextVisible` to control the fade-in animation, initialized to `false`.
*   **Effect Hook (`useEffect`):**
    *   Replace the existing `useEffect` hook (lines 13-35) with a new one that triggers when `currentDialogue` changes.
    *   Inside this new effect:
        *   If `currentDialogue` has a value:
            *   Set `isTextVisible` to `false` immediately (resets opacity).
            *   Set `displayedText` state to the full `currentDialogue.text`.
            *   Use `setTimeout(() => { setIsTextVisible(true); }, 50);` to trigger the fade-in after a brief delay, allowing the browser to register the initial state.
        *   If `currentDialogue` is null:
            *   Set `displayedText` to an empty string.
            *   Set `isTextVisible` to `false`.
*   **Render Logic:**
    *   Remove the blinking cursor element (`<span className={styles.cursor}>_</span>`).
    *   Modify the dialogue text `div` to conditionally apply the `visible` class:
        ```jsx
        <div className={`${styles.dialogueText} ${isTextVisible ? styles.visible : ''}`}>
          {displayedText}
        </div>
        ```

**2. Modify `src/components/DialogueSystem/DialogueSystem.module.scss`:**

*   **Remove Cursor Styles:** Delete the `.cursor` class definition and the `@keyframes blink` animation (lines 56-66).
*   **Add Fade-In Styles:**
    *   Modify the existing `.dialogueText` class (lines 48-54):
        *   Add `opacity: 0;`
        *   Add `transition: opacity 0.5s ease-in-out;` (adjust duration/timing as needed).
    *   Add a new class `.visible`:
        ```scss
        .visible {
          opacity: 1;
        }
        ```

**Process Flow Diagram:**

```mermaid
graph TD
    A[Start: New Dialogue Triggered] --> B{DialogueSystem Component};
    B --> C[Set isTextVisible = false];
    C --> D[Set displayedText = full text];
    D --> E[setTimeout(50ms)];
    E --> F[Set isTextVisible = true];
    F --> G{Render};
    G --> H[Apply .dialogueText style (opacity: 0, transition)];
    G -- isTextVisible is true --> I[Apply .visible style (opacity: 1)];
    I --> J[Text Fades In via CSS Transition];
```

**Next Step:** Switch to Code mode to implement these changes.