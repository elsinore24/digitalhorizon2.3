# Plan: Implement Destination Pathway with Compound Elements

**Goal:** Transform the `TemporalEcho` components into a sequence of 6 distinct destinations, each with unique visuals, positions (Y-coordinate indicating distance), and temporary captions on click, representing a pathway through space. The Mars destination will be a compound element with an orbiting outpost.

**Destinations:** Moon, Mars (with Orbiting Outpost), Deep Space Satellite, Proxima Centauri Outpost, Exoplanet Kepler-186f, Galactic Core Structure.

**Plan Steps:**

1.  **Update Config (`src/config/destinations.js`):**
    *   Modify the structure to support compound destinations where needed (e.g., Mars).
    *   Use `parentBody` and `childBody` properties for compound elements.
    *   Update Y-coordinates for better depth perception (higher Y = closer).
    ```javascript
    // src/config/destinations.js Example Update
    export const destinations = [
      { id: 'dest_moon', name: 'Moon', caption: 'Moon', visualStyle: 'moon', position: { x: 25, y: 95 }, color: '#c0c0c0', motion: null }, // Inverted Y
      {
        id: 'dest_mars_compound', // New ID for compound element
        name: 'Mars System',
        position: { x: 75, y: 85 }, // Position for Mars (parent) - Inverted Y
        parentBody: { // Mars Planet
          visualStyle: 'planet_mars',
          size: 60, // Example size
          color: '#b22222',
          caption: 'Mars'
        },
        childBody: { // Orbiting Outpost
          visualStyle: 'orbiting_outpost',
          size: 15, // Example size
          color: '#add8e6',
          caption: 'Mars Outpost', // Optional: separate caption for child?
          motion: { type: 'orbit', speed: 5 } // Example orbit animation speed
        }
      },
      { id: 'dest_satellite', name: 'Deep Space Satellite', caption: 'Satellite', visualStyle: 'satellite', position: { x: 50, y: 70 }, color: '#add8e6', motion: { type: 'pulse', speed: 0.5 } }, // Inverted Y
      { id: 'dest_proxima_outpost', name: 'Proxima Centauri Outpost', caption: 'Proxima Outpost', visualStyle: 'alien_outpost', position: { x: 30, y: 55 }, color: '#9400d3', motion: null }, // Inverted Y
      { id: 'dest_alien_planet', name: 'Exoplanet Kepler-186f', caption: 'Alien Planet', visualStyle: 'alien_planet', position: { x: 70, y: 40 }, color: '#00fa9a', motion: { type: 'rotate', speed: 0.05 } }, // Inverted Y
      { id: 'dest_mega_structure', name: 'Galactic Core Structure', caption: 'Mega Structure', visualStyle: 'mega_structure', position: { x: 50, y: 25 }, color: '#ffd700', motion: { type: 'shimmer', speed: 1 } } // Inverted Y
    ];
    ```
2.  **Refactor `TemporalEcho` (`src/components/TemporalEcho.jsx`):**
    *   Modify component to accept `destinationConfig`.
    *   Check if `parentBody` and `childBody` exist in the config.
    *   If compound: Render the parent element at `position`. Render the child element wrapped in a container for relative positioning and animation. Apply styles based on `parentBody.visualStyle` and `childBody.visualStyle`.
    *   If simple: Render a single element based on top-level `visualStyle`, `color`, etc.
    *   Update click handler: If compound, clicking the parent shows `parentBody.caption`. If simple, clicking shows `caption`.
    *   Apply animations based on `motion` properties (e.g., orbit for the child wrapper).
3.  **Update `LunarArrival` (`src/scenes/LunarArrival/index.jsx`):**
    *   Import `destinations.js`.
    *   Map over the `destinations` array when `dataPerceptionMode` is active.
    *   Render a `TemporalEcho` for each destination, passing the full config object as the `destinationConfig` prop. (No change needed here from previous step).
4.  **Implement Styles (`src/components/TemporalEcho.module.scss`):**
    *   Add/update CSS rules for all `visualStyle` types (`.moon`, `.planet_mars`, `.orbiting_outpost`, `.satellite`, etc.).
    *   Define unique shapes, colors, backgrounds.
    *   Create `@keyframes orbit` animation.
    *   Add styles for the child wrapper to handle positioning and apply the orbit animation.
5.  **(Optional) Add Scale/Opacity:** Consider adding `scale` and/or `opacity` properties later to further enhance depth perception if needed.

**Diagram (Overall Flow - Component Internals More Complex):**

```mermaid
graph TD
    subgraph Configuration (src/config/destinations.js)
        Config[Destination Data Array] --> Data{Destination Object (may include parent/child bodies)};
    end

    subgraph LunarArrival Scene (src/scenes/LunarArrival/index.jsx)
        LA1[Import destinations.js] --> LA2{Map over Destinations};
        LA2 -- destinationConfig --> TE(TemporalEcho Component);
    end

    subgraph TemporalEcho Component (src/components/TemporalEcho.jsx)
        TE -- Reads destinationConfig --> TE_Logic{Internal Logic (Handles Simple/Compound)};
        TE_Logic -- Determines Structure --> TE_Visuals[Visual Representation (Single/Parent+Child)];
        TE_Logic -- Determines Click Target --> TE_Interaction[onClick Handler];
        TE_Interaction -- Sets State --> TE_CaptionState{Show Caption State};
        TE_CaptionState -- Conditionally Renders --> TE_Caption[Caption Element];
        TE_Logic -- Applies Styles/Animations --> TE_Styling;
    end

    subgraph Styling (TemporalEcho.module.scss)
        TE_Visuals -- Applies Classes --> Style_Specifics(.moon, .planet_mars, .orbiting_outpost, etc.);
        TE_Caption -- Applies Class --> Style_Caption(.caption);
        TE_Styling -- Applies Animation --> Animation_Orbit('@keyframes orbit');
    end

    style Config fill:#lightblue,stroke:#333,stroke-width:2px
    style TE fill:#lightgreen,stroke:#333,stroke-width:2px
    style Style_Specifics fill:#lightgrey,stroke:#333,stroke-width:2px
    style Animation_Orbit fill:#lightgrey