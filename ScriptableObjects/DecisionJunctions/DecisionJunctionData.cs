using UnityEngine;

// This allows creating instances of this data structure easily from the Unity Editor:
// Right-click in Project window -> Create -> Narrative -> Decision Junction
[CreateAssetMenu(fileName = "NewDecisionJunction", menuName = "Narrative/Decision Junction")]
public class DecisionJunctionData : ScriptableObject
{
    [Header("Junction Identification")]
    [Tooltip("Unique identifier for this decision point (e.g., 'mars_ethics_choice')")]
    public string junctionID;

    [Tooltip("Brief description for editor reference")]
    public string junctionDescription;

    [Header("Field Configuration")]
    [Tooltip("The different choice regions presented to the player")]
    public DecisionRegion[] regions; // Uses the DecisionRegion class defined in NeuralResonanceField.cs

    [Header("Context & Ambience")]
    [Tooltip("Optional text displayed when entering this decision state")]
    [TextArea(3, 6)]
    public string onEntryText;

    [Tooltip("Optional specific ambient audio loop for this decision field")]
    public AudioClip ambientAudio;

    // Note: The DecisionRegion class needs to be accessible here.
    // It's currently defined within NeuralResonanceField.cs.
    // For better organization, consider moving DecisionRegion to its own file
    // (e.g., Scripts/NeuralField/DecisionRegion.cs) if it causes issues or for clarity.
    // However, C# allows classes defined within other classes to be used if public.
}