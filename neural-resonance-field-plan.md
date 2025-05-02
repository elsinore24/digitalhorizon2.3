# Neural Resonance Field Implementation Plan

This document outlines the plan for implementing the Neural Resonance Field decision-making interface in Unity, designed for cross-platform compatibility (Desktop, Mobile, WebGL) with optimizations for performance and build size.

## Core Concept

Players make choices by focusing attention (via mouse or touch) on different regions of a dynamic neural network visualization. The system tracks focus intensity, triggering a choice when concentration reaches a threshold in a particular neural cluster.

## Implementation Phases

**Phase 1: Core Structure & Setup**

1.  **Project Organization:**
    *   Create folders: `Scripts/NeuralField`, `Prefabs/NeuralField`, `Materials/NeuralField`, `Shaders/NeuralField`, `Audio/NeuralField`, `ScriptableObjects/DecisionJunctions`.
2.  **Core Scripts:**
    *   Implement `NeuralResonanceField.cs`: Include headers, serializable fields (`PlatformScalingSettings`, `DecisionRegion`, `NeuralAudioSystem`), basic `Start`/`Update` structure, and placeholder methods.
    *   Implement `NeuralNode.cs`: Basic structure with `Initialize`, `SetActivationLevel`, `Pulse`, `SetFade` methods.
    *   Implement `NeuralConnection.cs`: Basic structure with constructor and `UpdateVisual` method.
    *   Define `DecisionRegion` struct/class.
3.  **Data Structure:**
    *   Create `DecisionJunctionData.cs` ScriptableObject definition.
    *   Create a sample `DecisionJunctionData` asset for testing.

**Phase 2: Network Generation & Interaction**

1.  **Dynamic Scaling:**
    *   Implement `PlatformScalingSettings` struct within `NeuralResonanceField.cs`.
    *   Implement `DetermineNetworkScale` method using `SystemInfo` and `Application.isMobilePlatform` to select settings and calculate `nodeCount`/`connectionCount`. Add `LowDetailMode` property.
2.  **Network Generation:**
    *   Implement `GenerateNeuralNetwork`: Use calculated counts, instantiate node prefabs, implement weighted distribution towards regions, and connection logic prioritizing same-region links.
3.  **Input Handling:**
    *   Implement `UpdateCursorPosition`: Use `Input.mousePosition` / `Input.touches` and `Camera.ScreenPointToRay` with `Physics.Raycast`.
4.  **Focus Logic:**
    *   Implement `UpdateFocusLevels`: Include focus accumulation based on cursor proximity and decay.
    *   Implement `GetRegionIndexForPosition` helper function.

**Phase 3: Visual Implementation (Hybrid Approach)**

1.  **Base Visuals:**
    *   Create a simple sphere `nodePrefab`.
    *   Create a basic `connectionMaterial` for `LineRenderer`.
2.  **Visualization Mode Switching:**
    *   Implement `ConfigureVisualization` method to set `visualizationMode` enum based on platform checks.
3.  **Mode 1: Colored Nodes (Low-End Mobile):**
    *   Modify node/connection colors based on `activationLevel` and `regionColor`.
4.  **Mode 2: Mesh Heat Map (Mid/High Mobile):**
    *   Create `HeatMapMeshGenerator.cs`.
    *   Create `MobileHeatMap.shader` (unlit, vertex colors).
    *   Update heat map mesh vertex colors based on focus.
5.  **Mode 3: Full Shader (Desktop):**
    *   Implement `NodeShader.shader`, `ConnectionShader.shader`, `DesktopHeatMap.shader` (or use Shader Graph).
    *   Integrate Unity's Post-Processing package (Bloom).
6.  **Decision Animation:**
    *   Implement `NeuralNode.Pulse` coroutine.
    *   Implement `ConfirmDecisionVisual` coroutine, adapting effects based on `visualizationMode`.

**Phase 4: Audio Implementation**

1.  **Audio System Script:**
    *   Implement `NeuralAudioSystem.cs` (serializable class or standalone).
2.  **Integration:**
    *   Add `AudioSource` components and assign clips.
3.  **Logic:**
    *   Implement `UpdateAudioState` (ambient modulation, threshold warning).
    *   Trigger specific sounds (`regionPulseSounds`, `decisionConfirmSound`, initialization sound) from relevant methods.

**Phase 5: Decision Logic & Game Integration**

1.  **Decision Triggering:**
    *   Implement `CheckForDecision` comparing `regionFocusLevels` against `decisionThreshold`.
    *   Implement `TriggerDecision`: Get `decisionID`, call `ConfirmDecisionVisual`, disable input.
2.  **External Calls:**
    *   Add calls to `GameManager.Instance.RecordDecision(decisionID)` and `EventManager.TriggerEvent("DecisionMade", decisionID)`. (Requires existing/mock systems).
3.  **Setup Example:**
    *   Implement `SetupDecision(DecisionJunctionData data)` to load junction data and regenerate the field.

**Phase 6: Editor Tooling**

1.  **Editor Script:**
    *   Create `Editor/NeuralFieldEditor.cs`.
    *   Implement basic UI (`OnGUI`).
2.  **Scene View Integration:**
    *   Implement `OnSceneGUI` to draw `Handles` for visual region placement/sizing.

**Phase 7: Optimization & Platform Specifics**

1.  **Battery Saving:** Implement `OnApplicationPause`.
2.  **WebGL Optimization:**
    *   Implement `AssetOptimizer.cs` to adjust quality settings (`masterTextureLimit`, `SetQualityLevel`) based on platform/user agent. Call `NeuralResonanceField.LowDetailMode`.
3.  **Asset Settings:**
    *   Configure Texture Import Settings (Compression, Max Size).
    *   Configure Audio Import Settings (Compression Format, Quality).
4.  **Quality Settings:** Define Unity Quality Settings levels.
5.  **Addressables:** Set up Addressables system for `DecisionJunctionData` and large assets. Load asynchronously.

**Phase 8: Testing & Refinement**

1.  **Platform Testing:** Build and test on target mobile devices, desktop, WebGL.
2.  **Profiling:** Use Unity Profiler to identify bottlenecks.
3.  **Iteration:** Adjust visual/audio parameters, interaction speeds, scaling based on testing.

## Workflow Diagram

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