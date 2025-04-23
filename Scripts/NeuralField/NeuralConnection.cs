using UnityEngine;

public class NeuralConnection
{
    public NeuralNode nodeA { get; private set; }
    public NeuralNode nodeB { get; private set; }

    private LineRenderer lineRenderer;
    private GameObject lineObject; // Keep a reference to the GameObject holding the LineRenderer
    private Material materialInstance; // Use an instance to modify properties independently

    // Cache shader property IDs if needed (e.g., for custom connection shaders)
    // private static readonly int ActivationProp = Shader.PropertyToID("_Activation");
    private static readonly int ColorProp = Shader.PropertyToID("_Color"); // Standard LineRenderer material property

    // Configuration for visual appearance
    private const float BASE_WIDTH = 0.02f;
    private const float MAX_WIDTH_INCREASE = 0.05f;
    private const float BASE_ALPHA = 0.1f;
    private const float MAX_ALPHA_INCREASE = 0.7f;

    public NeuralConnection(NeuralNode a, NeuralNode b, Material sharedMaterial, Transform parentTransform)
    {
        if (a == null || b == null)
        {
            Debug.LogError("NeuralConnection cannot be created with null nodes.");
            return;
        }
        nodeA = a;
        nodeB = b;

        // Create a new GameObject for the line renderer
        lineObject = new GameObject($"Connection_{nodeA.name}_{nodeB.name}");
        lineObject.transform.SetParent(parentTransform); // Keep hierarchy clean
        lineObject.transform.position = (nodeA.transform.position + nodeB.transform.position) / 2f; // Initial position

        lineRenderer = lineObject.AddComponent<LineRenderer>();

        if (sharedMaterial != null)
        {
            // Create an instance of the material for this specific line
            materialInstance = new Material(sharedMaterial);
            lineRenderer.material = materialInstance;
        }
        else
        {
            Debug.LogWarning("NeuralConnection created without a material.");
            // Optionally create a default material here
        }

        // Configure LineRenderer properties
        lineRenderer.positionCount = 2;
        lineRenderer.startWidth = BASE_WIDTH;
        lineRenderer.endWidth = BASE_WIDTH;
        lineRenderer.useWorldSpace = true; // Positions are in world space

        // Set initial color (assuming material uses _Color)
        if (materialInstance != null && materialInstance.HasProperty(ColorProp))
        {
            Color initialColor = materialInstance.GetColor(ColorProp);
            initialColor.a = BASE_ALPHA;
            materialInstance.SetColor(ColorProp, initialColor);
        }

        // Set initial positions
        UpdatePosition();
    }

    // Updates the visual properties based on node activation
    public void UpdateVisual()
    {
        if (lineRenderer == null || nodeA == null || nodeB == null) return; // Safety check

        // Update line positions in case nodes moved (though they likely won't in this setup)
        UpdatePosition();

        // Calculate average activation of connected nodes
        float averageActivation = (nodeA.activationLevel + nodeB.activationLevel) * 0.5f;

        // Update LineRenderer width based on activation
        float currentWidth = BASE_WIDTH + MAX_WIDTH_INCREASE * averageActivation;
        lineRenderer.startWidth = currentWidth;
        lineRenderer.endWidth = currentWidth;

        // Update color/alpha based on activation (if material exists and has _Color)
        if (materialInstance != null && materialInstance.HasProperty(ColorProp))
        {
            Color currentColor = materialInstance.GetColor(ColorProp);
            currentColor.a = BASE_ALPHA + MAX_ALPHA_INCREASE * averageActivation;
            materialInstance.SetColor(ColorProp, currentColor);

            // --- Optional: Update other shader properties based on activation ---
            // Example: materialInstance.SetFloat(ActivationProp, averageActivation);
        }
    }

    // Updates the start and end points of the line renderer
    public void UpdatePosition()
    {
         if (lineRenderer == null || nodeA == null || nodeB == null) return;
         // Set positions directly - ensures line stays connected even if nodes are reparented (unlikely here)
         lineRenderer.SetPosition(0, nodeA.transform.position);
         lineRenderer.SetPosition(1, nodeB.transform.position);
    }


    // Call this when the connection needs to be removed to clean up its GameObject
    public void DestroyLineObject()
    {
        if (materialInstance != null)
        {
            Object.Destroy(materialInstance); // Clean up the material instance
        }
        if (lineObject != null)
        {
            Object.Destroy(lineObject); // Destroy the GameObject holding the LineRenderer
        }
    }
}