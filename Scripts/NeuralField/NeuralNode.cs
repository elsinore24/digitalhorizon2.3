using UnityEngine;
using System.Collections;

[RequireComponent(typeof(Renderer))]
public class NeuralNode : MonoBehaviour
{
    [HideInInspector] // Assigned internally, not meant for direct Inspector modification
    public int regionIndex = -1;

    [HideInInspector]
    public float activationLevel = 0;

    private Renderer nodeRenderer;
    private Material materialInstance; // Use material instance to avoid modifying shared material
    private float baseScale;
    private Color baseColor;
    private Color baseEmissionColor; // Store base emission if the shader uses it

    // Cache shader property IDs for performance
    private static readonly int ActivationProp = Shader.PropertyToID("_Activation");
    private static readonly int EmissionColorProp = Shader.PropertyToID("_EmissionColor");
    private static readonly int ColorProp = Shader.PropertyToID("_BaseColor"); // Or just "_Color" depending on shader

    void Awake()
    {
        nodeRenderer = GetComponent<Renderer>();
        if (nodeRenderer.material != null)
        {
            // Create an instance of the material to modify properties per-node
            materialInstance = nodeRenderer.material;
            baseColor = materialInstance.HasProperty(ColorProp) ? materialInstance.GetColor(ColorProp) : Color.white;
            baseEmissionColor = materialInstance.HasProperty(EmissionColorProp) ? materialInstance.GetColor(EmissionColorProp) : Color.black;
        }
        else
        {
            Debug.LogError("NeuralNode requires a Renderer with a Material!", this);
        }
        baseScale = transform.localScale.x; // Assume uniform scale initially
    }

    public void Initialize(int region)
    {
        regionIndex = region;
        activationLevel = 0;
        // Reset visuals to base state if needed
        SetActivationLevel(0);
        SetFade(1.0f); // Ensure fully opaque on init
    }

    public void SetActivationLevel(float level)
    {
        activationLevel = Mathf.Clamp01(level); // Ensure level is between 0 and 1

        if (materialInstance != null)
        {
            // --- Visual Update Logic (will depend on the specific shader used) ---

            // Example 1: Using a dedicated "_Activation" property in the shader
            materialInstance.SetFloat(ActivationProp, activationLevel);

            // Example 2: Lerping emission color based on activation
            // Color targetEmission = Color.Lerp(baseEmissionColor, Color.white, activationLevel); // Adjust target color as needed
            // materialInstance.SetColor(EmissionColorProp, targetEmission * activationLevel * 2.0f); // Multiply for bloom

            // Example 3: Directly influencing base color (less common for activation)
            // materialInstance.SetColor(ColorProp, Color.Lerp(baseColor, Color.red, activationLevel));
        }

        // Scale node based on activation
        transform.localScale = Vector3.one * baseScale * (1 + activationLevel * 0.5f); // Example scaling
    }

    public void Pulse(Color pulseColor, float intensity = 2.0f, float duration = 0.3f)
    {
        // Ensure we have a material instance to work with
        if (materialInstance != null)
        {
            StartCoroutine(PulseEffect(pulseColor, intensity, duration));
        }
        else
        {
             Debug.LogWarning("Cannot Pulse: Material instance is null.", this);
        }
    }

    private IEnumerator PulseEffect(Color pulseColor, float intensity, float duration)
    {
        // Store original values (safer if multiple pulses overlap, though ideally they shouldn't rapidly)
        Color originalEmission = materialInstance.HasProperty(EmissionColorProp) ? materialInstance.GetColor(EmissionColorProp) : Color.black;
        float originalScaleMultiplier = 1 + activationLevel * 0.5f; // Current scale based on activation

        float halfDuration = duration / 2.0f;
        float timer = 0f;

        // Pulse Out
        while (timer < halfDuration)
        {
            float progress = timer / halfDuration;
            float currentIntensity = Mathf.Lerp(1.0f, intensity, progress);
            float currentScale = Mathf.Lerp(originalScaleMultiplier, 2.0f, progress); // Pulse scale up

            if (materialInstance.HasProperty(EmissionColorProp))
            {
                 materialInstance.SetColor(EmissionColorProp, pulseColor * currentIntensity);
            }
            transform.localScale = Vector3.one * baseScale * currentScale;

            timer += Time.deltaTime;
            yield return null;
        }

        // Pulse In
        timer = 0f;
         while (timer < halfDuration)
        {
            float progress = timer / halfDuration;
            float currentIntensity = Mathf.Lerp(intensity, 1.0f, progress); // Fade intensity back
             // Lerp back towards the emission color appropriate for the current activation level
            Color targetEmission = Color.Lerp(baseEmissionColor, Color.white, activationLevel); // Recalculate target based on current activation
            Color lerpedEmission = Color.Lerp(pulseColor * intensity, targetEmission * activationLevel * 2.0f, progress); // Lerp back to activation-based emission

            float currentScale = Mathf.Lerp(2.0f, originalScaleMultiplier, progress); // Pulse scale back down

            if (materialInstance.HasProperty(EmissionColorProp))
            {
                 // materialInstance.SetColor(EmissionColorProp, pulseColor * currentIntensity); // Simpler fade out
                 materialInstance.SetColor(EmissionColorProp, lerpedEmission); // Smoother transition back
            }
            transform.localScale = Vector3.one * baseScale * currentScale;

            timer += Time.deltaTime;
            yield return null;
        }


        // Ensure final state matches activation level
        SetActivationLevel(activationLevel);
    }

    public void SetFade(float opacity)
    {
        if (materialInstance != null && materialInstance.HasProperty(ColorProp)) // Check if shader supports transparency via base color alpha
        {
            Color currentColor = materialInstance.GetColor(ColorProp);
            currentColor.a = Mathf.Clamp01(opacity);
            materialInstance.SetColor(ColorProp, currentColor);

            // If using a different property for alpha, adjust here:
            // materialInstance.SetFloat("_Opacity", Mathf.Clamp01(opacity));
        }
         // Also potentially disable renderer if fully faded?
         // nodeRenderer.enabled = opacity > 0.01f;
    }

    // Optional: Call this if the node is destroyed to clean up the material instance
    void OnDestroy()
    {
        if (materialInstance != null)
        {
            Destroy(materialInstance);
        }
    }
}