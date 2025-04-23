using UnityEngine;
using System.Collections.Generic;

// Simple game state manager
public class GameState : MonoBehaviour
{
    private static GameState _instance;
    public static GameState Instance {
        get {
            if (_instance == null) {
                GameObject go = new GameObject("GameState");
                _instance = go.AddComponent<GameState>();
                DontDestroyOnLoad(go);
            }
            return _instance;
        }
    }

    // Game metrics
    public float neuralStability = 0.5f;
    public float integrationBalance = 0.5f;
    public float witnessResonance = 0.1f;
    public float realityAnchor = 0.7f;

    // Player decisions
    public Dictionary<string, string> decisions = new Dictionary<string, string>();

    // Current state
    public string currentJunctionId;

    private void Awake()
    {
        if (_instance != null && _instance != this)
        {
            Destroy(gameObject);
            return;
        }

        _instance = this;
        DontDestroyOnLoad(gameObject);
    }

    // Record a player decision
    public void RecordDecision(string junctionId, string decisionId)
    {
        decisions[junctionId] = decisionId;

        // You could add impact calculation here
        // UpdateGameMetrics(decisionId);

        // Trigger events
        GameEvents.TriggerDecision(decisionId);
    }

    // Optional: Method to update game metrics based on decision
    /*
    private void UpdateGameMetrics(string decisionID)
    {
        // This would require a data structure mapping decisionIDs to metric impacts
        // Example placeholder:
        // if (decisionID == "mars_ethics_science")
        // {
        //     neuralStability += 0.1f;
        //     integrationBalance -= 0.05f;
        // }
        // Clamp values
        // neuralStability = Mathf.Clamp01(neuralStability);
        // integrationBalance = Mathf.Clamp01(integrationBalance);
        // witnessResonance = Mathf.Clamp01(witnessResonance);
        // realityAnchor = Mathf.Clamp01(realityAnchor);
    }
    */
}