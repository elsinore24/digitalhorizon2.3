using UnityEngine;
using System.Collections.Generic;
using System.Collections; // Required for Coroutines like ConfirmDecisionVisual

// Define platform-specific scaling settings
[System.Serializable]
public struct PlatformScalingSettings
{
    public int minNodes;
    public int maxNodes;
    public int baseNodesPerChoice;
    public float connectionDensity; // Connections per node ratio
}

// Define a decision region within the neural field
[System.Serializable]
public class DecisionRegion
{
    public string decisionID;
    public string decisionDescription; // Optional description for editor/debugging
    public Vector3 regionCenter;
    public float regionRadius;
    public Color regionColor = Color.white; // Default color
}

// Define audio system parameters and references
[System.Serializable]
public class NeuralAudioSystem
{
    [Header("Audio Sources")]
    public AudioSource ambientSource;
    public AudioSource focusSource;
    public AudioSource effectsSource;

    [Header("Audio Clips")]
    public AudioClip ambientBaseLoop; // The base neural hum
    public AudioClip[] regionPulseSounds; // One per region type (ensure array size matches potential regions or handle index carefully)
    public AudioClip decisionConfirmSound;
    public AudioClip thresholdWarningSound;
    public AudioClip networkGenerationSound; // Initialization sound

    [Header("Focus Parameters")]
    public float minFocusPitch = 0.8f;
    public float maxFocusPitch = 1.2f;
    public float minAmbientVolume = 0.2f;
    public float maxAmbientVolume = 0.5f;

    // Placeholder for audio update logic
    public void InitializeAudio()
    {
        if (ambientSource && ambientBaseLoop)
        {
            ambientSource.clip = ambientBaseLoop;
            ambientSource.loop = true;
            ambientSource.volume = minAmbientVolume;
            ambientSource.pitch = minFocusPitch;
            ambientSource.Play();
        }
        // Add initialization for other sources if needed (e.g., setting volume)
    }

    public void UpdateAudioState(float[] regionFocusLevels, float highestFocus)
    {
        // Update ambient tone modulation
        if (ambientSource)
        {
            ambientSource.pitch = Mathf.Lerp(minFocusPitch, maxFocusPitch, highestFocus);
            ambientSource.volume = Mathf.Lerp(minAmbientVolume, maxAmbientVolume, highestFocus);
        }

        // Play threshold warning if approaching decision
        // Ensure threshold values here match decisionThreshold logic
        if (focusSource && thresholdWarningSound)
        {
            if (highestFocus > 0.65f && highestFocus < 0.75f) // Example thresholds
            {
                if (!focusSource.isPlaying)
                    focusSource.PlayOneShot(thresholdWarningSound);
            }
        }
    }

    public void PlayDecisionSound()
    {
        if (effectsSource && decisionConfirmSound)
        {
            effectsSource.PlayOneShot(decisionConfirmSound);
        }
    }

     public void PlayRegionPulseSound(int regionIndex)
    {
        if (effectsSource && regionPulseSounds != null && regionIndex >= 0 && regionIndex < regionPulseSounds.Length && regionPulseSounds[regionIndex] != null)
        {
            effectsSource.PlayOneShot(regionPulseSounds[regionIndex]);
        }
    }

    public void PlayGenerationSound()
    {
         if (effectsSource && networkGenerationSound)
        {
            effectsSource.PlayOneShot(networkGenerationSound);
        }
    }
}

// Enum to manage different visualization approaches
public enum VisualizationMode
{
    ColoredNodes, // Low-end mobile
    MeshHeatMap,  // Mid/High mobile
    FullShader    // Desktop
}

public class NeuralResonanceField : MonoBehaviour
{
    [Header("Configuration")]
    public DecisionJunctionData currentJunctionData; // Assign this to set up the field
    public bool LowDetailMode { get; set; } = false; // Set by AssetOptimizer for WebGL mobile

    [Header("Scaling Settings")]
    public PlatformScalingSettings mobileLowSettings = new PlatformScalingSettings { minNodes = 40, maxNodes = 60, baseNodesPerChoice = 10, connectionDensity = 0.3f };
    public PlatformScalingSettings mobileHighSettings = new PlatformScalingSettings { minNodes = 60, maxNodes = 100, baseNodesPerChoice = 15, connectionDensity = 0.35f };
    public PlatformScalingSettings desktopSettings = new PlatformScalingSettings { minNodes = 80, maxNodes = 150, baseNodesPerChoice = 20, connectionDensity = 0.4f };

    [Header("Decision Regions (Runtime)")]
    [SerializeField] // Show in inspector for debugging, but populated from data
    private List<DecisionRegion> decisionRegions = new List<DecisionRegion>();

    [Header("Visual Elements")]
    public GameObject nodePrefab;
    public Material connectionMaterial; // Base material for LineRenderer
    public Material heatMapMaterial; // Used for Desktop Heatmap Shader or Mobile Mesh
    public GameObject heatMapMeshObject; // Reference to the object holding the mobile heatmap mesh
    public HeatMapMeshGenerator heatMapGenerator; // Reference to the generator script (can be on the same object as heatMapMeshObject)
    public float networkRadius = 5f; // Overall radius for random node placement
    public float heatMapInfluenceRadius = 2.0f; // Radius of cursor/region influence on heatmap

    [Header("Interaction Settings")]
    public float focusAccumulationSpeed = 1.0f;
    public float focusDecaySpeed = 0.5f;
    public float decisionThreshold = 0.75f;
    public LayerMask neuralFieldLayer; // Layer mask for raycasting

    [Header("Audio System")]
    public NeuralAudioSystem audioSystem;

    // Internal State
    private List<NeuralNode> nodes = new List<NeuralNode>();
    private List<NeuralConnection> connections = new List<NeuralConnection>();
    private Vector3 cursorPosition;
    private float[] regionFocusLevels;
    private bool isInteractable = true;
    private VisualizationMode currentVisualizationMode;
    private PlatformScalingSettings activeScalingSettings;
    private int nodeCount;
    private int connectionCount;


    void Start()
    {
        if (currentJunctionData != null)
        {
            SetupDecision(currentJunctionData);
        }
        else
        {
            Debug.LogError("NeuralResonanceField: No DecisionJunctionData assigned!");
            // Optionally, generate a default placeholder field
        }
    }

    void Update()
    {
        if (!isInteractable) return;

        UpdateCursorPosition();
        UpdateFocusLevels();
        UpdateVisualElements();
        UpdateAudioState();
        CheckForDecision();
    }

    public void SetupDecision(DecisionJunctionData data)
    {
        currentJunctionData = data;
        isInteractable = true; // Re-enable interaction

        // Clear previous state
        ClearNeuralNetwork();
        decisionRegions.Clear();

        // Populate regions from data
        if (data.regions != null)
        {
            decisionRegions.AddRange(data.regions);
        }
        regionFocusLevels = new float[decisionRegions.Count];

        // Determine scaling and visualization based on platform
        DetermineNetworkScale();
        ConfigureVisualization();

        // Generate the new network
        GenerateNeuralNetwork();

        // Initialize Audio
        audioSystem.InitializeAudio();
        if (data.ambientAudio) // Override default ambient if junction specifies one
        {
             audioSystem.ambientSource.clip = data.ambientAudio;
             audioSystem.ambientSource.Play();
        }
        audioSystem.PlayGenerationSound();

        Debug.Log($"Neural Field Setup: {nodes.Count} nodes, {connections.Count} connections. Mode: {currentVisualizationMode}");
    }


    void DetermineNetworkScale()
    {
        // Simplified platform detection - enhance as needed
        if (Application.isMobilePlatform)
        {
            // Basic check - could be refined with SystemInfo.graphicsMemorySize etc.
             activeScalingSettings = (SystemInfo.graphicsMemorySize > 1000 && SystemInfo.processorCount > 4) ? mobileHighSettings : mobileLowSettings;
        }
        else if (Application.platform == RuntimePlatform.WebGLPlayer && LowDetailMode)
        {
            activeScalingSettings = mobileLowSettings; // Use low settings for mobile WebGL
        }
        else
        {
            activeScalingSettings = desktopSettings;
        }

        // Scale based on choice count but within limits
        int choiceCount = decisionRegions.Count > 0 ? decisionRegions.Count : 1; // Avoid division by zero or zero nodes
        nodeCount = Mathf.Clamp(activeScalingSettings.baseNodesPerChoice * choiceCount,
                                activeScalingSettings.minNodes,
                                activeScalingSettings.maxNodes);

        connectionCount = Mathf.FloorToInt(nodeCount * activeScalingSettings.connectionDensity);
    }

    void ConfigureVisualization()
    {
        // Simplified detection - enhance as needed
        // Assumes AssetOptimizer sets LowDetailMode correctly for WebGL mobile
        if (Application.isMobilePlatform || LowDetailMode)
        {
            // Could differentiate further between low/high mobile if needed
             currentVisualizationMode = (SystemInfo.graphicsShaderLevel >= 35) ? VisualizationMode.MeshHeatMap : VisualizationMode.ColoredNodes; // Example threshold
        }
        else
        {
            currentVisualizationMode = VisualizationMode.FullShader;
        }

        // Activate/Deactivate relevant objects/components based on mode
        if (heatMapMeshObject) heatMapMeshObject.SetActive(currentVisualizationMode == VisualizationMode.MeshHeatMap);
        // Add logic for post-processing enabling/disabling if applicable
    }

    void GenerateNeuralNetwork()
    {
        if (nodePrefab == null)
        {
            Debug.LogError("GenerateNeuralNetwork: Node Prefab is not assigned!", this);
            return;
        }

        // 1. Create Nodes
        for (int i = 0; i < nodeCount; i++)
        {
            Vector3 position;
            int regionIndex = -1;
            float placementChance = Random.value;

            // Determine position: 70% chance to cluster in a region (if regions exist)
            if (decisionRegions.Count > 0 && placementChance < 0.7f)
            {
                int randomRegionIdx = Random.Range(0, decisionRegions.Count);
                DecisionRegion region = decisionRegions[randomRegionIdx];
                // Place within the region's sphere
                position = region.regionCenter + Random.insideUnitSphere * region.regionRadius;
                regionIndex = randomRegionIdx; // Assign region index based on placement
            }
            else
            {
                // Place randomly within the overall network radius
                position = transform.position + Random.insideUnitSphere * networkRadius;
                // Check if this random position falls within any region anyway
                regionIndex = GetRegionForPosition(position);
            }

            // Instantiate and initialize the node
            GameObject nodeObj = Instantiate(nodePrefab, position, Quaternion.identity, transform);
            nodeObj.name = $"Node_{i}"; // Give unique names for debugging
            NeuralNode node = nodeObj.GetComponent<NeuralNode>();
            if (node != null)
            {
                // Get the color for the region, or default white if no region
                Color nodeColor = (regionIndex >= 0 && regionIndex < decisionRegions.Count) ? decisionRegions[regionIndex].regionColor : Color.white;
                node.Initialize(regionIndex, nodeColor);
                nodes.Add(node);
            }
            else
            {
                Debug.LogError($"Node Prefab {nodePrefab.name} is missing NeuralNode component!", nodePrefab);
                Destroy(nodeObj); // Clean up invalid object
            }
        }

        // 2. Create Connections
        if (nodes.Count < 2) return; // Need at least two nodes to connect

        int createdConnections = 0;
        int maxAttempts = connectionCount * 5; // Prevent infinite loop if connections are hard to make
        int attempts = 0;

        while (createdConnections < connectionCount && attempts < maxAttempts)
        {
            attempts++;
            // Select two distinct random nodes
            NeuralNode nodeA = nodes[Random.Range(0, nodes.Count)];
            NeuralNode nodeB = nodes[Random.Range(0, nodes.Count)];

            // Ensure nodes are different and not already connected (basic check)
            // A more robust check would involve querying the 'connections' list, but can be slow.
            if (nodeA == nodeB) continue;

            // Optional: Check distance to avoid overly long connections
            // if (Vector3.Distance(nodeA.transform.position, nodeB.transform.position) > networkRadius * 0.8f) continue;

            // Check if connection already exists (simple check based on pairs)
            bool alreadyConnected = false;
            foreach(var existingConnection in connections)
            {
                if ((existingConnection.nodeA == nodeA && existingConnection.nodeB == nodeB) ||
                    (existingConnection.nodeA == nodeB && existingConnection.nodeB == nodeA))
                {
                    alreadyConnected = true;
                    break;
                }
            }
            if (alreadyConnected) continue;


            // --- Connection Logic with Region Bias (Example) ---
            // Increase probability if nodes are in the same region
            bool connectAttempt = false;
            if (nodeA.regionIndex != -1 && nodeA.regionIndex == nodeB.regionIndex)
            {
                 // Higher chance (e.g., 80%) to connect if in the same region
                 if (Random.value < 0.8f) connectAttempt = true;
            }
            else
            {
                 // Lower chance (e.g., 30%) to connect if in different regions or no region
                 if (Random.value < 0.3f) connectAttempt = true;
            }


            if (connectAttempt)
            {
                 NeuralConnection newConnection = new NeuralConnection(nodeA, nodeB, connectionMaterial, transform);
                 connections.Add(newConnection);
                 createdConnections++;
            }
        }

        if (attempts >= maxAttempts)
        {
             Debug.LogWarning($"GenerateNeuralNetwork: Reached max attempts ({maxAttempts}) trying to create {connectionCount} connections. Created {createdConnections}.");
        }
    }

     void ClearNeuralNetwork()
    {
        // Destroy existing nodes and connections GameObjects
        foreach (var connection in connections)
        {
            connection.DestroyLineObject(); // Need to add this method to NeuralConnection
        }
        connections.Clear();

        foreach (var node in nodes)
        {
            if (node != null) Destroy(node.gameObject);
        }
        nodes.Clear();

         // Clear heatmap mesh if applicable
        if (currentVisualizationMode == VisualizationMode.MeshHeatMap && heatMapMeshObject)
        {
            MeshFilter mf = heatMapMeshObject.GetComponent<MeshFilter>();
            if (mf && mf.mesh)
            {
                 // Reset vertex colors or clear mesh data
                 Mesh mesh = mf.mesh;
                 Vector3[] vertices = mesh.vertices;
                 Color32[] colors = new Color32[vertices.Length];
                 for(int i=0; i< colors.Length; ++i) colors[i] = Color.clear; // Reset to transparent
                 mesh.colors32 = colors;
            }
        }
    }

    void UpdateCursorPosition()
    {
        Vector3 inputPos = Vector3.zero;
        bool inputActive = false;

        // Check for touch input first
        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0); // Use the first touch
            if (touch.phase == TouchPhase.Began || touch.phase == TouchPhase.Moved || touch.phase == TouchPhase.Stationary)
            {
                inputPos = touch.position;
                inputActive = true;
            }
        }
        // Fallback to mouse input if no active touch
        else if (Input.mousePresent)
        {
            // Check if mouse button is held down (optional, could track focus only when clicking/holding)
            // if (Input.GetMouseButton(0)) {
                 inputPos = Input.mousePosition;
                 inputActive = true;
            // }
        }

        if (inputActive && Camera.main != null)
        {
            Ray ray = Camera.main.ScreenPointToRay(inputPos);
            RaycastHit hit;

            // Raycast against the specified layer
            if (Physics.Raycast(ray, out hit, 100f, neuralFieldLayer))
            {
                cursorPosition = hit.point;
                 // Debug.DrawLine(ray.origin, hit.point, Color.yellow); // Visualize hit
            }
            else
            {
                // Fallback: Project onto a plane at the field's depth if the raycast misses
                // This keeps the cursor interaction somewhat consistent even if pointing slightly off the field
                Plane interactionPlane = new Plane(-Camera.main.transform.forward, transform.position); // Plane facing the camera at the field's origin
                float distance;
                if (interactionPlane.Raycast(ray, out distance))
                {
                    cursorPosition = ray.GetPoint(distance);
                    // Debug.DrawLine(ray.origin, cursorPosition, Color.grey); // Visualize projection
                }
                // If even the plane projection fails, maybe keep the last valid position or reset?
                // For now, it will just keep the last value if both fail.
            }
        }
        // If no input is active, cursorPosition retains its last value.
        // Consider if focus should decay faster or reset if input stops.
    }

    void UpdateFocusLevels()
    {
        if (regionFocusLevels == null || regionFocusLevels.Length == 0) return;

        // 1. Decay all focus levels slightly
        for (int i = 0; i < regionFocusLevels.Length; i++)
        {
            regionFocusLevels[i] = Mathf.Max(0f, regionFocusLevels[i] - focusDecaySpeed * Time.deltaTime);
        }

        // 2. Determine region under cursor
        int cursorRegionIndex = GetRegionIndexForPosition(cursorPosition);

        // 3. Increase focus for the region under the cursor (if any)
        if (cursorRegionIndex >= 0)
        {
            regionFocusLevels[cursorRegionIndex] += focusAccumulationSpeed * Time.deltaTime;
            // Clamp the focus level between 0 and 1
            regionFocusLevels[cursorRegionIndex] = Mathf.Clamp01(regionFocusLevels[cursorRegionIndex]);
        }
        // else: No region under cursor, only decay applies this frame.
    }

    void UpdateVisualElements()
    {
        // 1. Update Node Visuals
        foreach (NeuralNode node in nodes)
        {
            if (node == null) continue; // Safety check

            float nodeActivation = 0f;
            if (node.regionIndex >= 0 && node.regionIndex < regionFocusLevels.Length)
            {
                // Base activation from the region's focus level
                float regionFocus = regionFocusLevels[node.regionIndex];

                // Modulate activation by proximity to the cursor (nodes closer to cursor in focused region light up more)
                // Adjust the divisor (2.0f) to control the falloff distance
                float distanceFactor = Vector3.Distance(node.transform.position, cursorPosition) / 2.0f;
                float proximityBoost = Mathf.Max(0f, 1f - distanceFactor); // 1 when close, 0 when far

                // Combine region focus and proximity
                // Simple multiplication: nodeActivation = regionFocus * proximityBoost;
                // Alternative: Additive boost capped at 1
                nodeActivation = Mathf.Clamp01(regionFocus + (proximityBoost * regionFocus * 0.5f)); // Boost focus effect near cursor

            }
            // Nodes not in a region might still have a base activation or react differently (optional)
            // else { nodeActivation = 0f; }

            node.SetActivationLevel(nodeActivation);
        }

        // 2. Update Connection Visuals
        foreach (NeuralConnection connection in connections)
        {
             if (connection == null) continue; // Safety check
            connection.UpdateVisual(); // This method uses the updated node activation levels
        }

        // 3. Update Mode-Specific Visuals (Heatmap, Shaders)
        switch (currentVisualizationMode)
        {
            case VisualizationMode.ColoredNodes:
                // Node colors are likely handled within NeuralNode.SetActivationLevel based on its logic
                break;
            case VisualizationMode.MeshHeatMap:
                if (heatMapGenerator != null)
                {
                    // Update vertex colors of the heatmap mesh
                    // Pass cursor position, region data, focus levels, a default (clear) color, and influence radius
                    heatMapGenerator.UpdateVertexColors(cursorPosition, decisionRegions, regionFocusLevels, Color.clear, heatMapInfluenceRadius);
                }
                else if (heatMapMeshObject != null) // Fallback check if generator wasn't assigned but object exists
                {
                     Debug.LogWarning("HeatMapMeshObject is assigned, but HeatMapMeshGenerator component reference is missing.", this);
                }
                break;
            case VisualizationMode.FullShader:
                // TODO: Update heatMapMaterial shader properties
                if (heatMapMaterial != null)
                {
                    // heatMapMaterial.SetVector("_CursorPosition", cursorPosition);
                    // heatMapMaterial.SetFloatArray("_RegionFocusLevels", regionFocusLevels);
                    // heatMapMaterial.SetFloat("_WaveRadius", ...); // During confirmation animation
                    // heatMapMaterial.SetVector("_WaveOrigin", ...); // During confirmation animation
                }
                // TODO: Potentially update global shader properties affecting nodes/connections if needed
                break;
        }
    }

     void UpdateAudioState()
    {
        if (audioSystem == null) return;

        float highestFocus = 0f;
        if(regionFocusLevels != null)
        {
            for (int i = 0; i < regionFocusLevels.Length; i++)
            {
                highestFocus = Mathf.Max(highestFocus, regionFocusLevels[i]);
            }
        }
        audioSystem.UpdateAudioState(regionFocusLevels, highestFocus);
    }


    void CheckForDecision()
    {
        if (!isInteractable || regionFocusLevels == null) return; // Don't check if not interactable or not initialized

        for (int i = 0; i < regionFocusLevels.Length; i++)
        {
            // Check if the focus level for this region meets or exceeds the threshold
            if (regionFocusLevels[i] >= decisionThreshold)
            {
                // Trigger the decision for this region
                TriggerDecision(i);
                // Important: Break after triggering one decision to prevent multiple triggers in the same frame
                // if multiple regions happen to cross the threshold simultaneously.
                break;
            }
        }
    }

    void TriggerDecision(int regionIndex)
    {
        if (!isInteractable) return;
        isInteractable = false; // Prevent multiple triggers

        string decisionID = decisionRegions[regionIndex].decisionID;
        Debug.Log($"Decision Triggered: Region {regionIndex}, ID: {decisionID}");

        // Animate the decision confirmation
        StartCoroutine(ConfirmDecisionVisual(regionIndex));

        // Play Decision Sound
        audioSystem.PlayDecisionSound();

        // --- Placeholder ---
        // TODO: Add calls to GameManager.Instance.RecordDecision(decisionID);
        // TODO: Add calls to EventManager.TriggerEvent("DecisionMade", decisionID);
        Debug.LogWarning("TriggerDecision: GameManager.RecordDecision and EventManager.TriggerEvent calls are placeholders.");
    }

    IEnumerator ConfirmDecisionVisual(int regionIndex)
    {
        Debug.Log($"Starting visual confirmation for region {regionIndex}");
        if (regionIndex < 0 || regionIndex >= decisionRegions.Count)
        {
            Debug.LogError("Invalid region index for visual confirmation.");
            yield break; // Exit if index is invalid
        }

        DecisionRegion chosenRegion = decisionRegions[regionIndex];
        Vector3 center = chosenRegion.regionCenter;
        Color pulseColor = chosenRegion.regionColor;
        float maxRadius = networkRadius * 1.5f; // Ensure wave covers the whole area
        float waveSpeed = networkRadius * 1.5f; // Adjust speed as needed
        float waveThickness = 0.75f; // How wide the pulsing band is
        float rippleDuration = maxRadius / waveSpeed; // Duration of the ripple effect

        // --- Ripple Effect ---
        float timer = 0f;
        while (timer < rippleDuration)
        {
            timer += Time.deltaTime;
            float currentRadius = Mathf.Lerp(0f, maxRadius, timer / rippleDuration);

            // Update shader parameters for wave effect (Mode 3: FullShader)
            if (currentVisualizationMode == VisualizationMode.FullShader && heatMapMaterial != null)
            {
                 // TODO: Implement shader uniform updates for wave effect
                 // heatMapMaterial.SetFloat("_WaveRadius", currentRadius);
                 // heatMapMaterial.SetVector("_WaveOrigin", center);
                 // heatMapMaterial.SetColor("_WaveColor", pulseColor); // Optional: Pass region color to shader
            }

            // Trigger pulse on nodes as the wave passes through (All Modes)
            foreach (NeuralNode node in nodes)
            {
                 if (node == null) continue;
                float distance = Vector3.Distance(node.transform.position, center);
                // Check if the node is within the current wave band
                if (distance <= currentRadius && distance >= currentRadius - waveThickness)
                {
                    // Trigger the pulse effect on the node
                    node.Pulse(pulseColor);
                    // Optional: Play a subtle sound per node pulse? audioSystem.PlayRegionPulseSound(node.regionIndex);
                }
            }

            yield return null; // Wait for the next frame
        }

         // Reset wave shader parameters if used
         if (currentVisualizationMode == VisualizationMode.FullShader && heatMapMaterial != null)
         {
              // TODO: Reset shader uniforms after wave
              // heatMapMaterial.SetFloat("_WaveRadius", -1f); // Indicate wave finished
         }


        // --- Fade Out Non-Selected & Highlight Selected ---
        float fadeDuration = 0.75f; // Duration of the fade effect
        timer = 0f;

        // Store initial activation levels for lerping the selected region
        // This is done to ensure a smooth transition from the current activation level
        List<float> initialSelectedActivations = new List<float>();
         foreach (NeuralNode node in nodes)
         {
             if (node != null && node.regionIndex == regionIndex)
             {
                 initialSelectedActivations.Add(node.activationLevel);
             }
         }
         int selectedNodeCounter = 0; // Counter to match initial activations list


        while (timer < fadeDuration)
        {
            timer += Time.deltaTime;
            float progress = Mathf.Clamp01(timer / fadeDuration);

            selectedNodeCounter = 0; // Reset counter for each frame
            foreach (NeuralNode node in nodes)
            {
                 if (node == null) continue;

                if (node.regionIndex != regionIndex)
                {
                    // Fade out nodes not in the selected region
                    node.SetFade(1f - progress);
                }
                else
                {
                    // Enhance the selected region nodes (e.g., brighten, hold activation)
                    if(selectedNodeCounter < initialSelectedActivations.Count)
                    {
                        // Lerp activation towards 1.0 (full brightness/prominence)
                        node.SetActivationLevel(Mathf.Lerp(initialSelectedActivations[selectedNodeCounter], 1.0f, progress));
                        selectedNodeCounter++;
                    }
                    node.SetFade(1f); // Ensure selected nodes remain fully visible
                }
            }

             // Fade connections similarly (optional, could just rely on node fade)
             foreach (NeuralConnection connection in connections)
             {
                  if (connection == null || connection.nodeA == null || connection.nodeB == null) continue;
                  // Fade if either connected node is not in the selected region
                  if (connection.nodeA.regionIndex != regionIndex || connection.nodeB.regionIndex != regionIndex)
                  {
                       // Simple approach: fade based on average node fade? Or just hard fade?
                       // connection.SetAlpha(1f - progress); // Requires SetAlpha method in NeuralConnection
                  }
             }

            yield return null;
        }

        // --- Final State & Transition ---
        // Ensure selected nodes are fully activated and non-selected are fully faded
         foreach (NeuralNode node in nodes)
         {
              if (node == null) continue;
             if (node.regionIndex != regionIndex)
             {
                 node.SetFade(0f); // Ensure fully transparent
             }
             else
             {
                 node.SetActivationLevel(1.0f); // Ensure fully activated
                 node.SetFade(1f); // Ensure fully visible
             }
         }
         // Ensure non-selected connections are fully faded (if implemented)


        yield return new WaitForSeconds(1.0f); // Hold the final state briefly

        // --- Placeholder ---
        // TODO: Add call to GameManager.Instance.AdvanceStory();
        Debug.LogWarning("ConfirmDecisionVisual: GameManager.AdvanceStory call is a placeholder.");

        // Optionally, deactivate the field GameObject or trigger a scene transition here
        // gameObject.SetActive(false);
    }

    int GetRegionIndexForPosition(Vector3 position)
    {
        // Simple distance check - could be refined
        for (int i = 0; i < decisionRegions.Count; i++)
        {
            if (Vector3.Distance(position, decisionRegions[i].regionCenter) <= decisionRegions[i].regionRadius)
            {
                return i;
            }
        }
        return -1; // No region found at this position
    }

     // Helper to get region index safely for node assignment during generation
    int GetRegionForPosition(Vector3 position)
    {
        // Could add weighting or priority if needed
        return GetRegionIndexForPosition(position);
    }
}