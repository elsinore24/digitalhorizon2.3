# Plan: Add Lunar Image Above Narrative Box

**Goal:** Modify the `NarrativeReader` component and its styles to include an image (`moon.png`) above the text box, increase the text box `min-height` to `125px`, implement a 2-second fade-in effect for the image, and ensure it's hidden along with the text box when `dataPerceptionMode` is active.

**Files to Modify:**

1.  `src/components/NarrativeReader/NarrativeReader.module.scss`
2.  `src/components/NarrativeReader/index.jsx`

**Plan Details:**

1.  **Modify `NarrativeReader.module.scss`:**
    *   **Increase Text Height:** Locate the `.narrativeText` CSS rule (around line 25). Change `min-height: 100px;` to `min-height: 125px;`.
    *   **Add Image Styles:** Add the following CSS rules:
        ```scss
        /* Add these styles */
        .lunarImageContainer {
          position: relative;
          width: 90%;
          max-width: 400px;
          margin: 0 auto 20px auto;
          opacity: 0;
          transition: opacity 2s ease-in; // 2-second fade-in
        }

        .lunarImage {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 4px;
        }

        // Style to trigger the fade-in
        .fadeInActive {
          opacity: 1;
        }

        // Ensure image container is also hidden when data perception mode is active
        .hidden .lunarImageContainer {
           display: none;
        }
        ```

2.  **Modify `NarrativeReader/index.jsx`:**
    *   **Add State:** Add `const [imageVisible, setImageVisible] = useState(false);`.
    *   **Trigger Fade-in:** Add a `useEffect` hook that sets `imageVisible` to `true` after a short delay when `narrativeData` loads.
        ```javascript
        useEffect(() => {
          if (narrativeData) {
            const timer = setTimeout(() => {
              setImageVisible(true);
            }, 100);
            return () => clearTimeout(timer);
          } else {
            setImageVisible(false);
          }
        }, [narrativeData]);
        ```
    *   **Add Image Element:** Modify the JSX return statement. Add the image container `div` *before* the `.narrativeBox`, wrapping both in a React Fragment (`<>...</>`). Ensure both the image container and narrative box are conditionally rendered based on `narrativeData`.
        ```jsx
         return (
           <div className={`${styles.narrativeContainer} ${dataPerceptionMode ? styles.hidden : ''}`}>
             <>
               {narrativeData && (
                 <div className={`${styles.lunarImageContainer} ${imageVisible ? styles.fadeInActive : ''}`}>
                   <img src="/front_pic/moon.png" alt="Lunar surface" className={styles.lunarImage} />
                 </div>
               )}
               {narrativeData && (
                 <div className={styles.narrativeBox}>
                   {/* ... existing content ... */}
                 </div>
               )}
             </>
           </div>
         );
        ```

**Diagram:**

```mermaid
graph TD
    subgraph "Plan Steps"
        direction LR
        A[Modify CSS: NarrativeReader.module.scss] --> B(Increase .narrativeText min-height to 125px);
        A --> C(Add .lunarImageContainer styles);
        A --> D(Add .lunarImage styles);
        A --> E(Add .fadeInActive style w/ 2s transition);
        A --> F(Add .hidden .lunarImageContainer style);
        G[Modify JSX: NarrativeReader/index.jsx] --> H(Add imageVisible state);
        G --> I(Add useEffect to set imageVisible);
        G --> J(Add image container div with img tag);
        G --> K(Conditionally apply .fadeInActive class);
        G --> L(Conditionally render image and narrative box);
    end
    M(User Request) --> A;
    M --> G;
    A & G --> N(Final Result: Image above taller text box, fades in, hides with data perception);