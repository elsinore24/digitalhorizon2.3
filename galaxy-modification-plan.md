# Plan: Modify Galaxy Band Background Element

**Goal:** Modify the appearance or position of the nebula/galaxy band background elements, specifically moving the galaxy band further back.

**File:** `src/components/Scene3D.jsx`

**Implementation Details:**

*   The background elements (nebula, galaxy band) are implemented as textured planes (`THREE.Mesh` with `THREE.PlaneGeometry`) within the `Scene3D` component.
*   Textures are loaded from `/public/textures/nebula.jpg` and `/public/textures/galaxy_band.jpg`.
*   Materials (`THREE.MeshBasicMaterial`) are created using these textures.
*   The position, rotation, and opacity of these planes are set and potentially animated.

**Key Code Sections in `src/components/Scene3D.jsx`:**

*   **Texture Loading:** Lines `131-133`
*   **Nebula Material & Mesh:** Lines `135-148`
*   **Galaxy Material & Mesh:** Lines `150-162`
*   **Animation/Updates (Opacity):** Lines `218-224`

**Modification Strategy:**

*   **To Change Appearance:**
    *   Swap texture file paths (lines `132`, `133`).
    *   Adjust `THREE.MeshBasicMaterial` properties (lines `135-142`, `150-157`).
    *   Modify opacity animation (lines `220`, `223`).
*   **To Change Position/Rotation:**
    *   Modify `.position` properties (e.g., line `144`, `159`).
    *   Modify `.rotation` properties (e.g., line `145`, `160`).

**Specific Change Requested:**

*   Move the galaxy band further back by increasing its negative Z position (modify line `159`). For example, change `galaxyPlane.position.z = -300;` to `galaxyPlane.position.z = -400;` (or another suitable value).

**Visual Overview (Mermaid):**

```mermaid
graph TD
    App[App.jsx] --> Scene3D[Scene3D.jsx];
    Scene3D -- Uses --> ThreeJS[Three.js Library];
    Scene3D -- Creates --> NebulaPlane[Nebula Mesh (Plane)];
    Scene3D -- Creates --> GalaxyPlane[Galaxy Band Mesh (Plane)];
    NebulaPlane -- Uses Material --> NebulaMaterial[Nebula Material];
    GalaxyPlane -- Uses Material --> GalaxyMaterial[Galaxy Material];
    NebulaMaterial -- Loads Texture --> NebulaTexture[/public/textures/nebula.jpg];
    GalaxyMaterial -- Loads Texture --> GalaxyTexture[/public/textures/galaxy_band.jpg];
```

**Implementation:**

1.  Switch to **Code Mode**.
2.  Use the `apply_diff` tool to modify line `159` in `src/components/Scene3D.jsx` to set a larger negative Z value for `galaxyPlane.position.z`.

**Verification:**

1.  Observe the running application (served by `npm run dev`) to confirm the galaxy band appears further away.