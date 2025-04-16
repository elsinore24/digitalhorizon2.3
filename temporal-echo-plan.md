# Plan: Modify TemporalEcho for Moon Destination

**Goal:** Transform the interactive "fragments" (`TemporalEcho` components) that appear during Data Perception mode into representations of destinations. Specifically, modify the first fragment (`id="research_001"`) to:

1.  **Visually resemble the Moon.**
2.  **Display the text "Moon"** temporarily above it when clicked/touched.

**Affected Components:**

*   `src/components/TemporalEcho.jsx` (and associated styles)
*   `src/scenes/LunarArrival/index.jsx`

**Plan Steps:**

1.  **Analyze `TemporalEcho` Component:** Examine the code of `src/components/TemporalEcho.jsx` and any associated CSS (`TemporalEcho.module.scss`?) to understand how its appearance (currently pink based on `type="RESEARCH_LOG"`) and interaction are handled.
2.  **Modify Visuals:** Update the styling for the `TemporalEcho` component, specifically targeting the instance with `id="research_001"` (or perhaps introducing a new `type` like `"DESTINATION"` or an `appearance` prop like `"moon"`), to make it look like the Moon (e.g., using CSS background image, gradients, or SVG).
3.  **Implement Interaction Logic:** Add an `onClick` handler to the `TemporalEcho` component.
4.  **Implement Caption Display:**
    *   Inside the `onClick` handler, set a temporary state within the `TemporalEcho` component to show the "Moon" caption.
    *   Use `setTimeout` to clear this state after a few seconds, hiding the caption.
    *   Add JSX to conditionally render the caption element above the component based on this state.
5.  **Update `LunarArrival`:** Modify the instantiation of the target `TemporalEcho` in `src/scenes/LunarArrival/index.jsx` if necessary (e.g., change its `type` or add an `appearance` prop).

**Diagram:**

```mermaid
graph TD
    subgraph LunarArrival Scene (src/scenes/LunarArrival/index.jsx)
        LA1(Render TemporalEcho) -- Props (id, type/appearance, position) --> TE(TemporalEcho Component);
    end

    subgraph TemporalEcho Component (src/components/TemporalEcho.jsx)
        TE -- Reads Props --> TE_Logic{Internal Logic};
        TE_Logic -- Determines Style --> TE_Visuals[Visual Representation];
        TE_Logic -- Handles Click --> TE_Interaction[onClick Handler];
        TE_Interaction -- Sets State --> TE_CaptionState{Show Caption State};
        TE_CaptionState -- Conditionally Renders --> TE_Caption[Caption Element ("Moon")];
        TE_Interaction -- Sets Timeout --> TE_Timeout(Hide Caption After Delay);
    end

    subgraph Styling (TemporalEcho.module.scss / Inline Styles)
        TE_Visuals -- Applies Styles --> Style_Moon(Moon Appearance CSS);
        TE_Caption -- Applies Styles --> Style_Caption(Caption Positioning CSS);
    end

    %% Proposed Changes
    TE_Visuals -- Change --> Style_Moon;
    TE -- Add --> TE_Interaction;
    TE -- Add --> TE_Caption;
    TE -- Add --> Style_Caption;

    style Style_Moon fill:#lightgrey,stroke:#333,stroke-width:2px
    style TE_Interaction fill:#lightgreen,stroke:#333,stroke-width:2px
    style TE_Caption fill:#lightgreen,stroke:#333,stroke-width:2px
    style Style_Caption fill:#lightgreen,stroke:#333,stroke-width:2px