using UnityEngine;
using System.Collections.Generic;

public class NarrativeManager : MonoBehaviour
{
    [System.Serializable]
    public class JunctionOption
    {
        public string junctionId;
        public DecisionJunctionData junctionData;
    }

    [Header("Configuration")]
    public List<JunctionOption> availableJunctions = new List<JunctionOption>();
    public NeuralResonanceField neuralField;

    private void Awake()
    {
        // Ensure GameState instance exists
        GameState.Instance.ToString(); // Accessing Instance creates it if it doesn't exist
    }

    private void Start()
    {
        // Listen for decision events
        GameEvents.OnDecisionMade += HandleDecisionMade;

        // TODO: Implement initial junction loading logic here
        // Example: LoadJunction("starting_junction_id");
    }

    private void OnDestroy()
    {
        // Unsubscribe from events to prevent memory leaks
        GameEvents.OnDecisionMade -= HandleDecisionMade;
    }

    /// <summary>
    /// Loads a specific narrative junction and sets up the neural field.
    /// </summary>
    /// <param name="junctionId">The ID of the junction to load.</param>
    public void LoadJunction(string junctionId)
    {
        // Find the junction data
        JunctionOption junction = availableJunctions.Find(j => j.junctionId == junctionId);

        if (junction != null && neuralField != null)
        {
            Debug.Log($"Loading junction: {junctionId}");

            // Set current junction in GameState
            GameState.Instance.currentJunctionId = junctionId;

            // Clear previous regions and populate from junction data
            // Note: NeuralResonanceField.SetupDecision already handles clearing and populating regions
            // based on the provided DecisionJunctionData.
            neuralField.SetupDecision(junction.junctionData);

            // Setup audio (handled within NeuralResonanceField.SetupDecision)
            // if (junction.junctionData.ambientAudio != null)
            // {
            //     // Set ambient audio if you have audio system
            // }

            // Regenerate the neural network (handled within NeuralResonanceField.SetupDecision)
            // neuralField.RegenerateNeuralNetwork(); // This method is now called internally by SetupDecision

            Debug.Log($"Loaded junction: {junctionId}");
        }
        else
        {
            Debug.LogError($"Junction not found: {junctionId} or NeuralField reference is null.");
        }
    }

    /// <summary>
    /// Handles the GameEvents.OnDecisionMade event.
    /// </summary>
    /// <param name="decisionId">The ID of the decision that was made.</param>
    private void HandleDecisionMade(string decisionId)
    {
        // Here you would determine the next junction based on the decision
        Debug.Log($"NarrativeManager received decision: {decisionId}. Determining next step...");

        // For now, just delay and advance (you'd replace this with proper logic)
        // Invoke("AdvanceToNextJunction", 3.0f); // Example of delayed narrative advance

        // TODO: Implement logic to determine the next junction based on decisionId
        // This might involve looking up data in DecisionJunctionData or another narrative structure.
        // Once the next junction ID is determined, call LoadJunction(nextJunctionId).

        // Example placeholder for immediate narrative advance (replace with your logic)
        // GameEvents.AdvanceNarrative("next_scene_id_placeholder");
        Debug.LogWarning("NarrativeManager.HandleDecisionMade: Placeholder logic for narrative progression. Implement actual logic here.");
    }

    // Example method to be called after a delay or based on logic
    /*
    private void AdvanceToNextJunction()
    {
        // This would be replaced with your logic to determine the next junction ID
        string nextJunctionId = "placeholder_next_junction"; // Determine this based on game state/decisions

        if (!string.IsNullOrEmpty(nextJunctionId))
        {
            LoadJunction(nextJunctionId);
        }
        else
        {
            Debug.LogWarning("NarrativeManager: Could not determine next junction.");
            // Handle end of narrative or other state
        }
    }
    */
}