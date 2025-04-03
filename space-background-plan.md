# Plan: Enhance Scene Background - Futuristic Space View

**Goal:** Transform the scene's visual aesthetic into a surreal, futuristic, and beautiful view from a space station looking towards the galactic center, replacing the current simple background.

**Approach:** Modify the existing `Scene3D` component (using Three.js) and related CSS.

**Plan Steps:**

1.  **Clean up Old Background (CSS & JSX):**
    *   **Modify `LunarArrival/index.jsx`:** Remove the divs responsible for the old background (`.lunarSurface`, `.stars`, `.horizon`, `.lunarGround`).
    *   **Modify `LunarArrival.module.scss`:** Remove the corresponding CSS rules for the removed divs.

2.  **Enhance `Scene3D.jsx` (Three.js Implementation):**
    *   **Remove Grid:** Comment out or remove the `GridHelper` creation and addition to the scene.
    *   **Create Dynamic Starfield:**
        *   Use `THREE.Points` with `BufferGeometry` for thousands of star particles.
        *   Use `THREE.PointsMaterial` with `sizeAttenuation: true` and potentially vertex colors or small textures.
        *   Add subtle rotation to the starfield object.
    *   **Implement Nebulae/Milky Way:**
        *   Create large `THREE.PlaneGeometry` objects.
        *   Apply nebula/galaxy textures using `THREE.MeshBasicMaterial` (or `ShaderMaterial` for advanced effects).
        *   Use appropriate blending (`AdditiveBlending`?) and transparency.
        *   Position planes at different depths for parallax.
    *   **Add Bloom Post-Processing:**
        *   Import `EffectComposer`, `RenderPass`, and `UnrealBloomPass` from Three.js examples (`examples/jsm/...`).
        *   Set up `EffectComposer` with a `RenderPass` and an `UnrealBloomPass`.
        *   Adjust `UnrealBloomPass` parameters (threshold, strength, radius) for desired effect.
        *   Render the scene via the composer instead of the direct renderer in the animation loop.
    *   **Adjust Camera/Lighting:**
        *   Consider widening camera FOV slightly.
        *   Adjust ambient/directional light intensity if needed.

3.  **Add Window Frame Effect (CSS):**
    *   **Modify `LunarArrival.module.scss`:** Add styles to `.sceneContainer` (or a new wrapper) using pseudo-elements or border-image to create a subtle, futuristic window frame effect.

**Diagram:**

```mermaid
graph TD
    subgraph LunarArrival Component (index.jsx)
        LA_Container[div.sceneContainer] -- Contains --> LA_Scene3D(Scene3D Component);
        LA_Container -- Contains --> LA_Overlays(UI Overlays: Destinations, Dialogue, Mute Button);
        %% Removed Old Background Divs
    end

    subgraph Scene3D Component (Scene3D.jsx - Enhanced)
        S3D_Scene[THREE.Scene] --> S3D_Camera(Camera - Adjusted FOV?);
        S3D_Scene --> S3D_Lights(Lights - Adjusted Intensity?);
        S3D_Scene -- Add --> S3D_Starfield[THREE.Points (Dynamic Stars)];
        S3D_Scene -- Add --> S3D_Nebulae[THREE.Mesh (Textured Planes - Nebulae/Milky Way)];
        %% Removed GridHelper
        S3D_Renderer[THREE.WebGLRenderer] --> S3D_Composer(EffectComposer - Bloom Added);
        S3D_Composer --> Renders(Render to Canvas);
    end

    subgraph Styling (LunarArrival.module.scss)
        Style_Container[styles.sceneContainer] -- Add --> Style_Frame(CSS Window Frame Effect);
        %% Removed Old Background Styles
    end

    style S3D_Starfield fill:#lightblue
    style S3D_Nebulae fill:#lightblue
    style S3D_Composer fill:#lightcyan
    style Style_Frame fill:#lightgrey