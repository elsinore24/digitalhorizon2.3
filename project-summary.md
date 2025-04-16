# Project Summary: Digital Horizons

## 1. Overview

"Digital Horizons" is an interactive, space-themed web experience built with React and Vite. It combines a 3D visual environment rendered with Three.js with a narrative system that synchronizes text display and audio playback. The application features an alternative "Data Perception" mode that overlays interactive points representing celestial bodies and points of interest. It utilizes Supabase for backend services like authentication and potentially data persistence.

## 2. Technology Stack

*   **Frontend Framework:** React (v18.2.0)
*   **Build Tool:** Vite (v4.4.5)
*   **Routing:** React Router DOM (v6.15.0)
*   **State Management:** Zustand (v4.4.1), React Context API
*   **3D Graphics:** Three.js (v0.174.0)
*   **Animation:** Framer Motion (v10.16.0), GSAP (v3.12.7)
*   **Audio:** Howler.js (v2.2.3), Tone.js (v15.0.4)
*   **Styling:** Sass (v1.66.1) (using CSS Modules - `.module.scss`)
*   **Backend Service:** Supabase JS (v2.49.1)
*   **Utility:** Node Fetch (v3.3.2) (Likely for Supabase interactions or other API calls)

## 3. Project Structure

The project follows a standard Vite/React structure:

*   **`public/`**: Static assets.
    *   `audio/`: Contains audio files (narration, effects).
    *   `front_pic/`: Images used in UI elements (e.g., `moon.png`).
    *   `narratives/`: JSON files defining narrative content (text, timestamps, audio paths).
    *   `textures/`: Textures used in the 3D scene (nebula, galaxy).
*   **`src/`**: Source code.
    *   `components/`: Reusable React components (e.g., `GameContainer`, `Scene3D`, `NarrativeReader`, `TemporalEcho`, `AudioVisualizer`).
    *   `config/`: Configuration files (e.g., `destinations.js`).
    *   `contexts/`: React Context providers (`AudioContext`, `GameStateContext`, `AuthContext`).
    *   `data/`: (Potentially for static data not fetched from backend - currently seems unused based on file list).
    *   `hooks/`: Custom React hooks (`useAudio`, `useGameState`, `useAuth`, `useDatabase`).
    *   `scenes/`: Components representing major application states or locations (e.g., `LunarArrival`).
    *   `styles/`: Global styles or base Sass files (if any).
    *   `App.jsx`: Root application component, sets up providers and routing structure.
    *   `main.jsx`: Entry point, renders the root `App` component.
*   **`supabase/`**: Supabase specific files (migrations, etc.).
*   **Root Files:** `index.html`, `vite.config.js`, `package.json`, `.gitignore`, `README.md`, Netlify config (`_redirects`, `netlify.toml`), SQL files (`schema.sql`, etc.).

### Component Hierarchy

```mermaid
graph TD
    App --> AuthProvider
    AuthProvider --> Router
    Router --> GameStateProvider
    GameStateProvider --> AudioProvider
    AudioProvider --> AppContent

    AppContent --> GameContainer
    AppContent --> DialogueDisplay[DialogueDisplay (Conditional)]
    AppContent --> AudioVisualizer[AudioVisualizer (Conditional)]

    GameContainer --> Routes
    GameContainer --> DataPerceptionOverlay[DataPerceptionOverlay (Conditional)]
    GameContainer --> StabilityMeter[StabilityMeter (Conditional)]
    GameContainer --> NarrationIndicator
    GameContainer --> MuteButton
    GameContainer --> ToggleButton[Perception Toggle Button]

    Routes --> Route_Root[Route "/"]
    Route_Root --> LunarArrival

    LunarArrival --> EnterButton[Enter Button (Conditional)]
    LunarArrival --> Scene3D
    LunarArrival --> DataPerceptionOverlay_Scene[DataPerceptionOverlay (Passed Prop)]
    LunarArrival --> TemporalEchoContainer{TemporalEcho Container (Conditional)}
    TemporalEchoContainer --> TemporalEcho[...]
    LunarArrival --> NarrativeReader[NarrativeReader (Conditional)]
    LunarArrival --> IOSFallbackButton[iOS Fallback Button (Conditional)]

    %% Hooks Used By Components
    AppContent -- uses --> useAudio
    AppContent -- uses --> useGameState
    GameContainer -- uses --> useGameState
    GameContainer -- uses --> useAuth
    GameContainer -- uses --> useDatabase
    LunarArrival -- uses --> useGameState
    LunarArrival -- uses --> useAudio
    NarrativeReader -- uses --> useAudio
```

## 4. Core Features

*   **3D Scene Rendering (`Scene3D.jsx`):**
    *   Uses Three.js to render the main visual environment.
    *   Includes camera, lighting, and renderer setup.
    *   Features a dynamic background with a starfield, nebula, and galaxy textures.
    *   Implements post-processing effects (Unreal Bloom).
    *   Handles window resizing.
    *   Contains commented-out logic for elements potentially related to the Data Perception mode (terminal, grid).
*   **Narrative System (`NarrativeReader/index.jsx`):**
    *   Fetches narrative data (text, audio path, page timestamps) from JSON files in `public/narratives/`.
    *   Plays associated audio narration from `public/audio/narration/`.
    *   Synchronizes text display with audio playback using timestamps for automatic page turning (toggleable).
    *   Displays associated imagery (`public/front_pic/moon.png`).
    *   Provides UI controls (arrows, play/pause, auto-turn toggle).
    *   Includes specific handling for audio playback on iOS.
    *   Hidden when Data Perception mode is active.
*   **Data Perception Mode (`TemporalEcho.jsx`, `GameContainer.jsx`, `LunarArrival/index.jsx`):**
    *   Toggled via a button or the 'Tab' key (`GameContainer`).
    *   Displays interactive points (`TemporalEcho`) representing destinations defined in `src/config/destinations.js`.
    *   `TemporalEcho` components render differently based on configuration (simple vs. compound with orbiting elements).
    *   An overlay (`DataPerceptionOverlay`) and potentially other UI elements (`StabilityMeter`) are shown in this mode.
    *   The main `NarrativeReader` and `AudioVisualizer` are hidden.
*   **State Management (`contexts/`, `hooks/`, Zustand):**
    *   Uses React Context (`AuthProvider`, `GameStateProvider`, `AudioProvider`) for global state.
    *   Custom hooks (`useAuth`, `useGameState`, `useAudio`, `useDatabase`) provide abstracted access to context state and logic.
    *   Zustand is listed as a dependency, likely used within the custom hooks/contexts for managing state logic.
*   **Audio System (`hooks/useAudio.js`, `components/AudioVisualizer.jsx`, `components/MuteButton.jsx`):**
    *   Managed primarily through the `useAudio` hook and `AudioContext`.
    *   Handles loading, playing, pausing, and resuming audio files (likely using Howler.js).
    *   Provides audio playback status (`isPlaying`).
    *   Includes an `AudioVisualizer` component (conditionally rendered).
    *   Includes a `MuteButton`.
*   **Backend Integration (Supabase):**
    *   Uses `@supabase/supabase-js` library.
    *   `AuthContext` and `useAuth` handle user authentication.
    *   `useDatabase` hook includes a `loadGame` function, suggesting game state or user data is loaded/persisted via Supabase.

## 5. Key Configuration & Data

*   **Narratives:** `public/narratives/*.json` (JSON files defining story content, structure, and timings).
*   **Audio:** `public/audio/` (Contains narration and potentially other sound assets).
*   **Textures:** `public/textures/` (Images used for 3D models/backgrounds).
*   **UI Images:** `public/front_pic/` (Images used directly in UI components).
*   **Destinations:** `src/config/destinations.js` (JavaScript array defining points of interest for Data Perception mode).
*   **Dependencies:** `package.json` (Defines all project dependencies and scripts).
*   **Build Config:** `vite.config.js` (Vite build and development server configuration).
*   **Deployment:** `netlify.toml`, `_redirects` (Configuration for Netlify deployment).
*   **Database Schema:** `schema.sql`, `supabase/migrations/` (Database structure definitions for Supabase).