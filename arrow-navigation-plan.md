# Plan: Replace Text Navigation Buttons with Arrow Buttons

**Objective:** Replace the "Previous" and "Next" text buttons in the `NarrativeReader` component with simple text arrow buttons (`<` and `>`) positioned on the sides of the narrative text box.

**Target Files:**

*   `src/components/NarrativeReader/index.jsx`
*   `src/components/NarrativeReader/NarrativeReader.module.scss`

**Detailed Steps:**

1.  **Modify Component (`src/components/NarrativeReader/index.jsx`):**
    *   **Remove Old Buttons:** Delete the `<button>` elements containing the text "Previous" (around lines 264-266) and "Next" (around lines 272-274) from within the `div` with `className={styles.navigation}`.
    *   **Add New Arrow Buttons:** Inside the `div` with `className={styles.narrativeBox}` (around line 258), but *outside* the `styles.navigation` div, add two new `<button>` elements:
        *   `<button className={styles.prevArrow} onClick={handlePrevPage} disabled={isFirstPage}><</button>`
        *   `<button className={styles.nextArrow} onClick={handleNextPage} disabled={isLastPage}>></button>`
        *   (Note: `<` and `>` are HTML entities for `<` and `>`).
2.  **Update Styles (`src/components/NarrativeReader/NarrativeReader.module.scss`):**
    *   **Establish Positioning Context:** Ensure the `.narrativeBox` class has `position: relative;` so the absolute positioning of the arrows works correctly relative to this container.
    *   **Style Arrows:** Define new styles for `.prevArrow` and `.nextArrow`:
        *   `position: absolute;`
        *   `top: 50%;`
        *   `transform: translateY(-50%);` (for vertical centering)
        *   `left: 10px;` /* Adjust as needed for closeness */ for `.prevArrow`
        *   `right: 10px;` /* Adjust as needed for closeness */ for `.nextArrow`
        *   Set appropriate `font-size`, `padding`, `background-color` (perhaps transparent or matching theme), `border`, `color`, and `cursor: pointer;`.
        *   Add simple `:hover` styles (e.g., slightly darker background or text color).
    *   **Style Disabled State:** Define styles for `.prevArrow:disabled` and `.nextArrow:disabled`:
        *   `opacity: 0.5;`
        *   `cursor: not-allowed;`
    *   **Adjust Navigation Container:** Review the styles for `.navigation` and adjust `padding`, `margin`, or `justify-content` if needed, now that the text buttons are removed.

**Visual Plan (Mermaid Diagram):**

```mermaid
graph TD
    A[Start: Replace Text Buttons with Arrows '<' '>'] --> B{Locate Buttons};
    B -- Found in --> C[NarrativeReader/index.jsx];
    C --> D{Refined Plan};
    D --> E[1. Modify JSX: Remove old buttons, add new '<' & '>' buttons outside navigation div, add handlers/disabled state];
    D --> F[2. Modify SCSS: Add styles for absolute positioning, vertical centering, appearance, hover, disabled state];
    E --> G{Implement Changes};
    F --> G;
    G --> H[End: UI Updated with Arrow Navigation];

    subgraph "Code Changes"
      direction LR
      JSX[index.jsx]
      SCSS[NarrativeReader.module.scss]
    end

    E --> JSX;
    F --> SCSS;