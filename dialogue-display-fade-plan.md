# Revised Plan: Implement Fade-In Effect in DialogueDisplay

**Objective:** Replace the typewriter effect in the `DialogueDisplay` component with a smooth fade-in animation for the entire text block.

**Target Component:** `src/components/DialogueDisplay.jsx`
**Target Stylesheet:** `src/components/DialogueDisplay.module.scss`

**Implementation Steps:**

**1. Modify `src/components/DialogueDisplay.module.scss`:**

*   **Remove Cursor:** Delete the `::after` pseudo-element rule (lines 53-56) and the `@keyframes blink` animation (lines 59-62) associated with the `.dialogueText` class.
*   **Add Fade-In Base Style:** Add the following properties to the `.dialogueText` rule (within lines 43-52):
    *   `opacity: 0;`
    *   `transition: opacity 0.5s ease-in-out;` (duration/timing can be adjusted).
*   **Add Visible State Style:** Add a new class rule:
    ```scss
    .visible {
      opacity: 1;
    }
    ```

**2. Modify `src/components/DialogueDisplay.jsx`:**

*   **Add State:** Introduce a new state variable:
    ```javascript
    const [isTextVisible, setIsTextVisible] = useState(false);
    ```
*   **Replace Effect Logic:** Replace the existing `useEffect` hook (lines 9-28) with the following:
    ```javascript
    useEffect(() => {
      let visibilityTimeout;
      if (currentDialogue) {
        setIsTextVisible(false); // Reset opacity before text change
        setDisplayText(currentDialogue.text); // Set full text

        // Use setTimeout to trigger transition after state update
        visibilityTimeout = setTimeout(() => {
          setIsTextVisible(true);
        }, 50); // Small delay (e.g., 50ms)

      } else {
        setDisplayText(''); // Clear text if no dialogue
        setIsTextVisible(false);
      }

      // Cleanup timeout on unmount or dialogue change
      return () => clearTimeout(visibilityTimeout);
    }, [currentDialogue]); // Dependency array
    ```
*   **Update JSX:** Modify the `<p>` tag rendering the dialogue text (line 43) to conditionally apply the `visible` class:
    ```jsx
    <p className={`${styles.dialogueText} ${isTextVisible ? styles.visible : ''}`}>
      {displayText}
    </p>
    ```

**Process Flow Diagram:**

```mermaid
graph TD
    A[Start: New Dialogue Triggered in useAudio] --> B{DialogueDisplay Component};
    B -- currentDialogue updates --> C[useEffect Triggered];
    C --> D[Set isTextVisible = false];
    D --> E[Set displayText = full text];
    E --> F[setTimeout(50ms)];
    F --> G[Set isTextVisible = true];
    G --> H{Render};
    H --> I[Apply .dialogueText style (opacity: 0, transition)];
    H -- isTextVisible is true --> J[Apply .visible style (opacity: 1)];
    J --> K[Text Fades In via CSS Transition];
```

**Status:** Implemented successfully on 2025-04-03.

**Confirmation:** This plan correctly identified `DialogueDisplay.jsx` (rendered in `App.jsx`) as the component responsible for the typewriter effect. Applying the fade-in logic to this component and its stylesheet resolved the issue. The `DialogueSystem.jsx` component (rendered in `LunarArrival.jsx`) was previously modified but was not the source of the observed typewriter effect for the initial dialogue. The `DialogueBox.jsx` component appears to be unused.