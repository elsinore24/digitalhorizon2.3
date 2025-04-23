using System;
using UnityEngine;

// Simple event system
public static class GameEvents
{
    // Decision events
    public static event Action<string> OnDecisionMade;
    public static event Action<string> OnNarrativeAdvance;

    // Neural field events
    public static event Action<float> OnFocusIntensityChanged;
    public static event Action<int> OnRegionSelected;

    // Methods to trigger events
    public static void TriggerDecision(string decisionID)
    {
        Debug.Log($"Decision made: {decisionID}");
        OnDecisionMade?.Invoke(decisionID);
    }

    public static void AdvanceNarrative(string sceneID = "")
    {
        Debug.Log($"Advancing narrative to: {sceneID}");
        OnNarrativeAdvance?.Invoke(sceneID);
    }

    public static void UpdateFocusIntensity(float intensity)
    {
        OnFocusIntensityChanged?.Invoke(intensity);
    }

    public static void SelectRegion(int regionIndex)
    {
        OnRegionSelected?.Invoke(regionIndex);
    }
}