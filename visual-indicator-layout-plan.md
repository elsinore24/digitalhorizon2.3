# Visual Indicator Layout Adjustment Plan (Revised)

**Goal:** Reposition indicators horizontally at the top, spread out, remove technical details, and significantly reduce size for mobile compatibility.

**Revised Plan Details:**

1.  **Adjust `TopStatusBar` Positioning (`src/components/TopStatusBar/TopStatusBar.module.scss`):**
    *   Modify the `.statusBarContainer` class:
        *   Set `top: 5px;` (or adjust for precise top alignment).
        *   Set `left: 0;`, `right: 0;`, `width: 100%;` (span full width).
        *   Set `transform: none;`.
        *   Set `justify-content: space-between;` (spread indicators).
        *   Set `padding: 5px 15px;` (horizontal padding).
        *   Remove `background-color` and `border-radius` (if container is invisible).

2.  **Adjust `IndicatorContainer` Layout (`src/components/GameUIIndicators/IndicatorContainer.module.scss`):**
    *   Modify the `.indicatorsGrid` class:
        *   Set `display: flex;`.
        *   Remove `grid-template-columns`.
        *   Set `gap: 10px;` (adjust spacing if needed).
        *   Remove `justify-items`, `align-items`.
        *   Set `align-items: flex-start;`.
        *   Set `padding: 5px;`.

3.  **Remove Technical Details Section (JSX):**
    *   Modify `NeuralStabilityIndicator.jsx`, `PhysicalVitalityIndicator.jsx`, and `ConsciousnessSpectrumIndicator.jsx`.
    *   In each file, **remove** the entire `div` element with the class `sharedStyles.indicatorTechData`.

4.  **Further Reduce Indicator Size (CSS - `src/components/GameUIIndicators/IndicatorContainer.module.scss`):**
    *   Modify CSS Variables:
        *   Reduce `--indicator-width` (e.g., to `~150px-160px`).
        *   Reduce `--indicator-padding` (e.g., to `~5px`).
        *   Reduce `--indicator-border-radius` (e.g., to `3px`).
        *   Reduce `--indicator-glow-spread` (e.g., to `3px`).
    *   Modify Typography Styles:
        *   Reduce `font-size` for `.indicatorTitle` (e.g., to `~0.6em`).
        *   Reduce `font-size` for `.indicatorStatus` (e.g., to `~0.7em`).
        *   Adjust `margin-bottom` for `.indicatorStatus`.
    *   Modify Bar Styles:
        *   Reduce `height` for `.indicatorBarBase` (and related) (e.g., to `~8px`).
        *   Adjust `margin-top`/`margin-bottom` for `.indicatorBarBase`.

**Visual Representation (Conceptual - Smaller):**

```mermaid
graph LR
    subgraph TopStatusBar (.statusBarContainer - Spanning Top)
        direction LR
        style TopStatusBar fill:#eee,stroke:#333,stroke-width:1px,height:40px
        A[NS<br>95% N.] -- Space --- B(PV<br>100% O.) -- Space --- C(CS<br>H:50/A:50 B.)
    end
    style A fill:#ccf,stroke:#66f
    style B fill:#cff,stroke:#6ff
    style C fill:#fcf,stroke:#f6f
```
*(Note: Text abbreviated for diagram clarity)*

**Implementation:** These changes will be implemented in `code` mode by modifying the three indicator JSX files and the two relevant SCSS files.