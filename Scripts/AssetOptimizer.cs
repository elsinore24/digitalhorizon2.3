using UnityEngine;
using System.Runtime.InteropServices; // Required for DllImport

public class AssetOptimizer : MonoBehaviour
{
    // Reference to the NeuralResonanceField to set LowDetailMode
    public NeuralResonanceField neuralField;

    // Import JavaScript function for WebGL user agent check
    [DllImport("__Internal")]
    private static extern string GetUserAgent();

    void Awake()
    {
        // Detect platform and set quality accordingly
        if (Application.platform == RuntimePlatform.WebGLPlayer)
        {
            Debug.Log("Running on WebGL. Applying WebGL optimizations.");

            // Reduce texture memory usage for web builds
            // QualitySettings.masterTextureLimit = 1; // Half resolution textures - Uncomment and adjust as needed

            // Check if mobile device is accessing web build
            if (IsMobileWebGL())
            {
                Debug.Log("WebGL detected on a mobile device. Applying low detail settings.");
                QualitySettings.SetQualityLevel(0); // Lowest quality preset (ensure this preset exists)
                if (neuralField != null)
                {
                    neuralField.LowDetailMode = true;
                    Debug.Log("NeuralResonanceField LowDetailMode set to true.");
                }
                else
                {
                    Debug.LogWarning("AssetOptimizer: Neural Field reference is not assigned. Cannot set LowDetailMode.", this);
                }
            }
            else
            {
                 Debug.Log("WebGL detected on a desktop-like device.");
                 // Optionally set a higher quality level for desktop WebGL
                 // QualitySettings.SetQualityLevel(1); // Example: Medium quality preset
            }
        }
        else if (Application.isMobilePlatform)
        {
            Debug.Log("Running on a native mobile platform.");
            // Native mobile platforms can potentially handle higher quality than WebGL mobile
            // You might differentiate here based on SystemInfo or provide a quality setting option
            // For now, assuming a default quality level is set in Project Settings.
        }
        else
        {
            Debug.Log("Running on a desktop platform.");
            // Desktop platforms can typically handle highest quality
            // Ensure QualitySettings are configured appropriately for desktop.
        }
    }

    // Check user agent for mobile browsers in WebGL
    bool IsMobileWebGL()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        string userAgent = GetUserAgent();
        if (string.IsNullOrEmpty(userAgent)) return false; // Cannot get user agent

        // Basic check for common mobile keywords
        return userAgent.Contains("Android") || userAgent.Contains("iPhone") || userAgent.Contains("iPad") || userAgent.Contains("Mobile");
#else
        return false; // Not WebGL or in Editor
#endif
    }

    // Optional: Implement OnApplicationPause for battery optimization as discussed
    void OnApplicationPause(bool pauseStatus)
    {
        if (Application.platform == RuntimePlatform.WebGLPlayer) return; // WebGL doesn't typically pause like native apps

        if (pauseStatus)
        {
            Debug.Log("Application paused. Reducing update frequency.");
            Time.fixedDeltaTime = 0.1f; // Reduce physics updates (adjust as needed)
            Application.targetFrameRate = 5; // Minimal rendering (adjust as needed)
        }
        else
        {
            Debug.Log("Application resumed. Restoring update frequency.");
            Time.fixedDeltaTime = 0.02f; // Restore default fixed timestep
            // Restore target frame rate based on quality settings or vSync
            Application.targetFrameRate = QualitySettings.vSyncCount > 0 ? 0 : 60; // Example: Match vSync or target 60
        }
    }

    // Note: For the WebGL user agent check to work, you'll need a .jslib file
    // in a Plugins folder in your Unity project, containing the GetUserAgent function:
    /*
    // MyPlugin.jslib
    mergeInto(LibraryManager.library, {
      GetUserAgent: function() {
        return UTF8ToString(stringToUTF8(navigator.userAgent));
      },
    });
    */
}