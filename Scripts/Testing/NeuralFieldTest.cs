using UnityEngine;

public class NeuralFieldTest : MonoBehaviour
{
    [Header("Test Configuration")]
    [Tooltip("The ID of the Decision Junction to load for testing.")]
    public string testJunctionId = "opening_scene"; // Default test junction ID

    [Tooltip("Reference to the Narrative Manager in the scene.")]
    public NarrativeManager narrativeManager;

    // Start is called before the first frame update
    void Start()
    {
        // Ensure NarrativeManager reference is set
        if (narrativeManager != null)
        {
            Debug.Log($"NeuralFieldTest: Loading test junction '{testJunctionId}'...");
            narrativeManager.LoadJunction(testJunctionId);
        }
        else
        {
            Debug.LogError("NeuralFieldTest: NarrativeManager reference not set. Cannot load test junction.", this);
        }

        // Subscribe to events for debugging output
        GameEvents.OnDecisionMade += HandleTestDecisionMade;
        GameEvents.OnNarrativeAdvance += HandleTestNarrativeAdvance;
        GameEvents.OnFocusIntensityChanged += HandleTestFocusIntensityChanged;
        GameEvents.OnRegionSelected += HandleTestRegionSelected;

        Debug.Log("NeuralFieldTest: Subscribed to GameEvents for debugging.");
    }

    // Unsubscribe from events when the script is destroyed
    void OnDestroy()
    {
        GameEvents.OnDecisionMade -= HandleTestDecisionMade;
        GameEvents.OnNarrativeAdvance -= HandleTestNarrativeAdvance;
        GameEvents.OnFocusIntensityChanged -= HandleTestFocusIntensityChanged;
        GameEvents.OnRegionSelected -= HandleTestRegionSelected;

        Debug.Log("NeuralFieldTest: Unsubscribed from GameEvents.");
    }

    // --- Event Handlers for Debugging ---

    private void HandleTestDecisionMade(string decisionId)
    {
        Debug.Log($"TEST EVENT: Decision made: {decisionId}");
    }

    private void HandleTestNarrativeAdvance(string sceneId)
    {
        Debug.Log($"TEST EVENT: Narrative advanced to: {sceneId}");
        // In a real test, you might load the next junction here based on sceneId
        // Example: narrativeManager.LoadJunction(sceneId);
    }

    private void HandleTestFocusIntensityChanged(float intensity)
    {
        // Debug.Log($"TEST EVENT: Focus intensity changed: {intensity}"); // Can be noisy, uncomment if needed
    }

    private void HandleTestRegionSelected(int regionIndex)
    {
        Debug.Log($"TEST EVENT: Region selected: {regionIndex}");
    }

    // Optional: Add a button in the Inspector to manually trigger loading a junction
    /*
    [ContextMenu("Load Test Junction")]
    public void ManualLoadTestJunction()
    {
         if (narrativeManager != null)
        {
            Debug.Log($"NeuralFieldTest: Manually loading test junction '{testJunctionId}'...");
            narrativeManager.LoadJunction(testJunctionId);
        }
        else
        {
            Debug.LogError("NeuralFieldTest: NarrativeManager reference not set. Cannot manually load test junction.", this);
        }
    }
    */
}