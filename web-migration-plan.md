# Plan: Web Environment Migration & Signal Tuning Implementation

**Overall Goal:** Transition the project to a fully web-based game, removing the Unity dependency and implementing core mechanics and backend persistence using React, Web Audio API, Canvas/SVG, and Supabase.

**Plan Phases:**

*   **Phase 1: Cleanup & Backend Foundation**
    *   Remove all Unity-related files and code from the React project.
    *   Set up a new Supabase project (or use an existing one).
    *   Configure Supabase Authentication.
    *   Create `profiles`, `game_saves`, and `leaderboard` tables in Supabase with appropriate Row Level Security (RLS).
    *   Obtain Supabase API keys.
    *   Integrate the Supabase JavaScript client into the React project.
    *   Solidify state management using Zustand, defining the initial store structure for auth and game state.

*   **Phase 2: Implement Authentication & Basic Persistence**
    *   Build React components for user authentication (Login, Sign Up, Logout).
    *   Implement the authentication flow using Supabase client methods and update the Zustand store.
    *   Create functions to save and load game state to/from the `game_saves` table in Supabase, integrated with the Zustand store.
    *   Implement initial load logic in the application to check auth state and load the game save.

*   **Phase 3: Implement "Signal Tuning" Mechanic**
    *   Create a new React component (`SignalTuningInterface`) for the mechanic's UI.
    *   Design the UI layout using HTML/CSS.
    *   Implement dynamic visuals (waveforms, phase display) using Canvas or SVG.
    *   Develop audio handling for the mechanic using the Web Audio API (via a custom hook or service).
    *   Implement the core game logic for signal simulation, tuning, stability calculation, and Witness signals in JavaScript.
    *   Connect UI controls to update state and audio parameters.
    *   Integrate the mechanic with the narrative flow, triggering state updates and saving upon successful signal interpretation.

*   **Phase 4: Implement Restart & Refine Flow**
    *   Add a Restart button that resets the game state in Zustand and updates the Supabase save.
    *   Ensure the narrative progression correctly uses the `currentNodeId` from the Zustand store.

*   **Phase 5: Leaderboard Foundation**
    *   Create functions to submit scores to and fetch data from the Supabase `leaderboard` table. (UI implementation is optional for this phase).

**Relevant Previous Planning Context:**

*   **Narrative Reader Arrow Navigation Plan:**
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
    ```

*   **Neural Resonance Field Implementation Plan (Superseded by Signal Tuning):**
    ```mermaid
    graph TD
        A[Start Decision Point] --> B(Load DecisionJunctionData);
        B --> C{DetermineNetworkScale};
        C --> D[GenerateNeuralNetwork];
        D --> E[ConfigureVisualization];
        E --> F[Initialize Audio System];
        F --> G{Update Loop};

        subgraph Update Loop
            G --> H[UpdateCursorPosition (Mouse/Touch)];
            H --> I[UpdateFocusLevels];
            I --> J[UpdateVisualElements (Mode-Specific)];
            J --> K[UpdateAudioState];
            K --> L{CheckForDecision};
        end

        L -- No Decision --> G;
        L -- Decision Threshold Met --> M[TriggerDecision];

        subgraph Decision Sequence
            M --> N[Record Decision (GameManager)];
            N --> O[Trigger Event (EventManager)];
            O --> P[Start ConfirmDecisionVisual Coroutine];
            P --> Q{Animate Confirmation (Mode-Specific)};
            Q --> R[Play Decision Sound];
            R --> S[Wait];
            S --> T[Advance Story (GameManager)];
        end

        T --> Z[End Decision Point];

        subgraph Visuals Update [UpdateVisualElements]
            J --> V1{Current Mode?};
            V1 -- Low Mobile --> V1a[Update Node Colors];
            V1 -- Mid/High Mobile --> V2a[Update Heatmap Mesh Vertices];
            V1 -- Desktop --> V3a[Update Node/Connection Shaders];
            V1 -- Desktop --> V3b[Update Heatmap Shader Uniforms];
            V1 -- Desktop --> V3c[Update Post-Processing];
        end

        subgraph Audio Update [UpdateAudioState]
            K --> A1{Update Ambient Source};
            K --> A2{Check/Play Threshold Warning};
        end