# Plan: Reduce Audio Visualizer Height

**Goal:** Make the audio visualizer less intrusive by reducing its height from 400px to 100px.

**Steps:**

1.  **Update CSS:**
    *   File: `src/components/AudioVisualizer/AudioVisualizer.module.scss`
    *   Change: Modify the `.visualizer` class rule `height: 400px;` to `height: 100px;`.

2.  **Update Component JavaScript (Resize Logic):**
    *   File: `src/components/AudioVisualizer/index.jsx`
    *   Change: In the `resizeCanvas` function, update the line `canvas.height = 400` to `canvas.height = 100`.

3.  **Update Component JSX (Default Attribute):**
    *   File: `src/components/AudioVisualizer/index.jsx`
    *   Change: Update the default `height="400"` attribute on the `<canvas>` element to `height="100"`.

4.  **Update Container in App.jsx:**
    *   File: `src/App.jsx`
    *   Change: Modify the inline style on the `div` wrapping `<AudioVisualizer />` from `style={{ height: '400px' }}` to `style={{ height: '100px' }}`.

5.  **Review & Refine:**
    *   After implementing the changes, visually inspect the visualizer.
    *   If necessary, adjust the drawing logic (bar heights, scaling factors) within the `draw()` function in `src/components/AudioVisualizer/index.jsx` to ensure the visualization looks proportional and aesthetically pleasing at the new 100px height.

**Visual Representation:**

```mermaid
graph TD
    subgraph "File Updates (Target: 100px Height)"
        A["AudioVisualizer.module.scss"] -- "height: 100px;" --> B;
        C["AudioVisualizer/index.jsx (JS)"] -- "canvas.height = 100;" --> B;
        D["AudioVisualizer/index.jsx (JSX)"] -- "height='100'" --> B;
        E["App.jsx"] -- "style={{ height: '100px' }}" --> B;
    end
    B((Reduced Height Visualizer)) --> F{Review Visuals};
    F -- Optional Refinement --> G["AudioVisualizer/index.jsx (draw() logic)"];
    F & G --> H((Final Appearance));

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#ccf,stroke:#333,stroke-width:2px
```

**Next Step:** Switch to Code mode to implement these changes.