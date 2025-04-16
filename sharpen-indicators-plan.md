# Plan to Sharpen UI Indicators

## Problem Description

The user observed that the three status indicators at the top of the UI ("Neural Stability", "Physical Body", "Consciousness") appear significantly blurrier and less sharp compared to the "Toggle Data Perception" button at the bottom.

## Analysis

Investigation revealed the following:

1.  **Top Indicators (`src/components/GameUIIndicators/IndicatorContainer.module.scss`):**
    *   Use `text-shadow: 0 0 2px var(--indicator-glow-color)` on titles and status text, creating a text glow.
    *   Use `box-shadow: 0 0 var(--indicator-glow-spread) var(--indicator-glow-color), ...` on the wrapper element for a box glow.
    *   Employ `::before` and `::after` pseudo-elements to add further border glows and highlights.
    *   Utilize 'Roboto Mono' font and various background effects (grid, noise, scanlines).
    *   **Conclusion:** These combined effects create an intentional soft, glowing, "holographic" appearance.

2.  **Bottom Button (`src/components/GameContainer.module.scss`):**
    *   Lacks `text-shadow` and `box-shadow` effects.
    *   Uses a simple solid border and translucent background.
    *   Likely uses a default, sharper system font.
    *   **Conclusion:** Standard styling results in a sharper look.

The difference in sharpness is a deliberate design choice, contrasting the "readout" style of the indicators with the "interactive element" style of the button.

## Objective

Modify the styling of the top indicators to remove glow and shadow effects, making them appear sharper and closer in style to the button, as requested by the user.

## Plan

Modify the file `src/components/GameUIIndicators/IndicatorContainer.module.scss`:

1.  **Comment out `box-shadow`** on the `.indicatorWrapper` class (around line 50).
2.  **Comment out the `&::before` pseudo-element rule** within `.indicatorWrapper` (around lines 67-73).
3.  **Comment out the `&::after` pseudo-element rule** within `.indicatorWrapper` (around lines 76-81).
4.  **Comment out `text-shadow`** on the `.indicatorTitle` class (around line 173).
5.  **Comment out `text-shadow`** on the `.indicatorStatus` class (around line 181).

```mermaid
graph TD
    A[Start: Indicators have Glows] --> B{Modify IndicatorContainer.module.scss};
    B --> C[Comment out box-shadow on .indicatorWrapper];
    B --> D[Comment out ::before rule on .indicatorWrapper];
    B --> E[Comment out ::after rule on .indicatorWrapper];
    B --> F[Comment out text-shadow on .indicatorTitle];
    B --> G[Comment out text-shadow on .indicatorStatus];
    C & D & E & F & G --> H[Result: Sharper Indicators];