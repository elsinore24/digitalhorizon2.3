#if UNITY_EDITOR // Ensure this code is only compiled in the Unity Editor
using UnityEngine;
using UnityEditor;
using System.Collections.Generic; // Needed for List<>

[CustomEditor(typeof(NeuralResonanceField))] // Tell Unity this is an editor for NeuralResonanceField
public class NeuralFieldEditor : Editor
{
    private NeuralResonanceField targetField;
    private SerializedProperty regionsProperty;
    private SerializedObject serializedTargetObject; // Use SerializedObject for robust undo/redo

    private void OnEnable()
    {
        targetField = (NeuralResonanceField)target; // Get the component being inspected
        serializedTargetObject = new SerializedObject(targetField); // Create SerializedObject
        // Find the serialized property for the decisionRegions list (must match the private field name)
        regionsProperty = serializedTargetObject.FindProperty("decisionRegions");

        // Register the Scene GUI delegate
        SceneView.duringSceneGui += OnSceneGUI;
    }

    private void OnDisable()
    {
        // Unregister the Scene GUI delegate to prevent errors
        SceneView.duringSceneGui -= OnSceneGUI;
    }

    // Draw the custom inspector GUI
    public override void OnInspectorGUI()
    {
        // Update the serialized object representation
        serializedTargetObject.Update();

        // Draw the default inspector fields first (for configuration, scaling, prefabs etc.)
        DrawDefaultInspector();

        EditorGUILayout.Space();
        EditorGUILayout.LabelField("Decision Regions (Editor)", EditorStyles.boldLabel);

        // Draw the decisionRegions list using the serialized property
        // This handles undo/redo, multi-object editing, and prefab overrides correctly.
        EditorGUILayout.PropertyField(regionsProperty, true); // 'true' includes children (elements of the list)

        // Apply any changes made in the inspector
        serializedTargetObject.ApplyModifiedProperties();

        // Add a button for manual regeneration (optional, but helpful)
        if (GUILayout.Button("Regenerate Network (Manual)"))
        {
             if (Application.isPlaying)
             {
                  // In Play mode, call SetupDecision if data is assigned
                  if(targetField.currentJunctionData != null)
                  {
                       targetField.SetupDecision(targetField.currentJunctionData);
                       Debug.Log("Neural Network Regenerated via Editor Button (using currentJunctionData).");
                  }
                  else
                  {
                       Debug.LogWarning("Cannot regenerate in Play mode without currentJunctionData assigned.");
                  }
             }
             else
             {
                  // In Edit mode, maybe just log or provide limited functionality
                  Debug.LogWarning("Manual regeneration in Edit mode is not fully implemented via this button. Use Scene Handles.");
             }
        }
    }

    // Draw custom handles in the Scene view
    private void OnSceneGUI(SceneView sceneView)
    {
        // Ensure we have valid data
        if (targetField == null || regionsProperty == null || !serializedTargetObject.targetObject)
        {
            // If the target object was destroyed, unregister the delegate
             SceneView.duringSceneGui -= OnSceneGUI;
            return;
        }

        // Update the serialized object representation before drawing handles
        serializedTargetObject.Update();

        // Make sure the target transform is available
        Transform handleTransform = targetField.transform;
        Quaternion handleRotation = Tools.pivotRotation == PivotRotation.Local ? handleTransform.rotation : Quaternion.identity;

        // Loop through each DecisionRegion in the serialized list
        for (int i = 0; i < regionsProperty.arraySize; i++)
        {
            SerializedProperty regionProperty = regionsProperty.GetArrayElementAtIndex(i);

            // Find the properties within the DecisionRegion class
            SerializedProperty centerProp = regionProperty.FindPropertyRelative("regionCenter");
            SerializedProperty radiusProp = regionProperty.FindPropertyRelative("regionRadius");
            SerializedProperty colorProp = regionProperty.FindPropertyRelative("regionColor");
            SerializedProperty idProp = regionProperty.FindPropertyRelative("decisionID"); // For label

            Vector3 center = centerProp.vector3Value;
            float radius = radiusProp.floatValue;
            Color regionColor = colorProp.colorValue;

            // --- Draw Handles ---
            Handles.color = regionColor;

            // Draw a label for the region ID
            Handles.Label(center + Vector3.up * (radius + 0.2f), $"Region {i}: {idProp.stringValue}");

            // Position Handle for the center
            EditorGUI.BeginChangeCheck();
            Vector3 newCenter = Handles.PositionHandle(center, handleRotation);
            if (EditorGUI.EndChangeCheck())
            {
                Undo.RecordObject(targetField, "Move Decision Region Center"); // Register Undo
                centerProp.vector3Value = newCenter; // Apply change to serialized property
            }

            // Radius Handle (draws a circle and allows scaling)
            EditorGUI.BeginChangeCheck();
            // Draw a wire disc first for better visibility
            Handles.DrawWireDisc(center, handleTransform.forward, radius); // Use transform.forward assuming Z is depth
             Handles.DrawWireDisc(center, handleTransform.up, radius);
             Handles.DrawWireDisc(center, handleTransform.right, radius);
            // Use the ScaleValueHandle for interactive radius adjustment
            float newRadius = Handles.ScaleValueHandle(radius, center, handleRotation * Quaternion.LookRotation(Vector3.right), HandleUtility.GetHandleSize(center) * 1.5f, Handles.SphereHandleCap, 0.1f);
            if (EditorGUI.EndChangeCheck())
            {
                Undo.RecordObject(targetField, "Change Decision Region Radius"); // Register Undo
                radiusProp.floatValue = Mathf.Max(0.1f, newRadius); // Apply change, ensure radius is positive
            }
        }

        // Apply changes to the serialized object so they are saved and undo works
        serializedTargetObject.ApplyModifiedProperties();
    }
}
#endif // UNITY_EDITOR