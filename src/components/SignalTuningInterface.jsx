import React, { useRef, useEffect, useState } from 'react'; // Import useRef, useEffect, and useState
import styles from './SignalTuningInterface.module.scss'; // Import the SCSS module
import useSignalAudio from '../hooks/useSignalAudio'; // Import the audio hook
import { useGameStore } from '../store/useGameStore'; // Import useGameStore

// Function to draw background noise
function drawNoise(ctx, width, height, noiseLevel) {
  if (noiseLevel <= 0.05) return; // Don't draw if negligible noise

  ctx.save();
  ctx.globalAlpha = noiseLevel * 0.3; // Adjust opacity for noise intensity
  ctx.strokeStyle = '#333'; // Darker color for noise
  ctx.lineWidth = 0.5;

  // Example: Drawing random lines or dots for noise
  const noiseDensity = 1000 * noiseLevel; // More density with higher noise
  for (let i = 0; i < noiseDensity; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = x1 + (Math.random() - 0.5) * 10;
    const y2 = y1 + (Math.random() - 0.5) * 10;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

// Function to draw Interpretation A (Mathematical Precision)
function drawInterpretationA(ctx, width, height, clarity) {
  if (clarity <= 0.01) return; // Don't draw if negligible clarity

  ctx.save();
  ctx.globalAlpha = clarity;
  ctx.strokeStyle = 'cyan'; // Color for Interpretation A
  ctx.lineWidth = 1 + clarity * 2; // Line weight increases with clarity

  // Example: Drawing a clean sine wave
  const amplitude = 10 + 40 * clarity;
  const frequency = 5;
  const yOffset = height / 2;

  ctx.beginPath();
  ctx.moveTo(0, yOffset);
  for (let x = 0; x < width; x++) {
    const y = yOffset + amplitude * Math.sin((x / width) * frequency * 2 * Math.PI);
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.restore();
}

// Function to draw Interpretation B (Source Signature)
function drawInterpretationB(ctx, width, height, clarity) {
  if (clarity <= 0.01) return; // Don't draw if negligible clarity

  ctx.save();
  ctx.globalAlpha = clarity;
  ctx.strokeStyle = 'lime'; // Color for Interpretation B
  ctx.lineWidth = 1 + clarity * 2; // Line weight increases with clarity

  // Example: Drawing a more complex, organic wave
  const amplitude = 20 + 30 * clarity;
  const frequency = 8;
  const yOffset = height / 2;

  ctx.beginPath();
  ctx.moveTo(0, yOffset);
  for (let x = 0; x < width; x++) {
    const y = yOffset + amplitude * (Math.sin((x / width) * frequency * 2 * Math.PI) + 0.5 * Math.sin((x / width) * frequency * 4 * Math.PI));
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.restore();
}

// Function to draw Interpretation C (Instrumental Artifact)
function drawInterpretationC(ctx, width, height, clarity) {
  if (clarity <= 0.01) return; // Don't draw if negligible clarity

  ctx.save();
  ctx.globalAlpha = clarity;
  ctx.strokeStyle = 'magenta'; // Color for Interpretation C
  ctx.lineWidth = 1 + clarity * 2; // Line weight increases with clarity

  // Example: Drawing a noisy, artifact-like pattern
  const amplitude = 30 + 20 * clarity;
  const frequency = 15;
  const yOffset = height / 2;

  ctx.beginPath();
  ctx.moveTo(0, yOffset);
  for (let x = 0; x < width; x++) {
    const noise = (Math.random() - 0.5) * 10 * (1 - clarity); // More noise with less clarity
    const y = yOffset + amplitude * Math.sin((x / width) * frequency * 2 * Math.PI) + noise;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

// Main function to render the signal display
function renderSignalDisplay(ctx, canvas, tuningState, dominantInterpretation, stability, interpretations) {
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  // Calculate effective levels
  const noiseLevel = Math.max(0.1, 1.0 - stability / 100 * 0.9); // Noise decreases as stability increases
  // Calculate clarity for each interpretation based on the passed interpretations data
  const clarity = {};
  for (const key in interpretations) {
      clarity[key] = (dominantInterpretation === key) ? stability / 100 : 0;
  }

  // Layered Drawing
  drawNoise(ctx, width, height, noiseLevel);
  // Draw each interpretation based on its clarity
  for (const key in interpretations) {
      if (key === 'A') drawInterpretationA(ctx, width, height, clarity[key]);
      if (key === 'B') drawInterpretationB(ctx, width, height, clarity[key]);
      if (key === 'C') drawInterpretationC(ctx, width, height, clarity[key]);
      // Add more interpretation drawing functions here as needed
  }

  // Optionally draw the tuned signal with low opacity if not dominant
  // This part might need adjustment based on desired visual style
  // if (!dominantInterpretation) {
  //   drawSignal(tuningState.frequency, tuningState.amplitude, '#00ff00', tuningState.phase); // Example: Draw tuned signal
  // }
}

// Helper function to calculate stability for a given interpretation
function calculateInterpretationStability(currentTuning, interpretation) {
    let score = 0;
    const { frequency, amplitude, phase, filterStrength } = currentTuning;
    const { targetFrequencyRange, phaseAlignment, filterRequirement, tuningDifficulty } = interpretation;

    // Frequency match (simplified)
    if (Array.isArray(targetFrequencyRange)) {
        if (frequency >= targetFrequencyRange[0] && frequency <= targetFrequencyRange[1]) {
            score += 30; // Base score for being in range
            // Add more score based on how close to the center of a narrow band
            if (targetFrequencyRange[1] - targetFrequencyRange[0] < 20) { // Example: Narrow band
                 const center = (targetFrequencyRange[0] + targetFrequencyRange[1]) / 2;
                 score += (1 - Math.abs(frequency - center) / (targetFrequencyRange[1] - center)) * 20;
            }
        }
    } else if (typeof targetFrequencyRange === 'string') {
        // Handle conceptual ranges like "Very Broad, Low Frequency"
        if (targetFrequencyRange === "Very Broad, Low Frequency" && frequency < 50) score += 40;
        // Add other conceptual range checks
    }


    // Amplitude match (simplified)
    // Assuming ideal amplitude ranges based on conceptual descriptions
    if (interpretation.id === 'A' && amplitude >= 40 && amplitude <= 60) score += 20;
    if (interpretation.id === 'B' && amplitude >= 60 && amplitude <= 80) score += 20;
    if (interpretation.id === 'C' && amplitude >= 20 && amplitude <= 40) score += 20;


    // Phase alignment (simplified)
    if (phaseAlignment === 'Critical') {
        const phaseDiff = Math.abs(phase - 0); // Assuming ideal phase is 0 or 360
        score += (1 - Math.min(1, phaseDiff / 180)) * 30; // Higher score for closer phase
    } else if (phaseAlignment === 'Less critical than A, but still influences clarity.') {
         const phaseDiff = Math.abs(phase - 0);
         score += (1 - Math.min(1, phaseDiff / 180)) * 15; // Less impact than critical
    }


    // Filter requirement (simplified)
    if (filterRequirement === 'High' && filterStrength > 70) score += 30;
    else if (filterRequirement === 'Moderate' && filterStrength > 40 && filterStrength < 80) score += 20;
    else if (filterRequirement === 'Low' && filterStrength < 30) score += 10;


    // Adjust score based on difficulty (conceptual - might need refinement)
    if (tuningDifficulty === 'High') score *= 0.8; // Make it harder to get high stability
    else if (tuningDifficulty === 'Low') score *= 1.2; // Make it easier

    // Add some randomness for erratic behavior (Interpretation B)
    if (interpretation.id === 'B') {
        score += (Math.random() - 0.5) * 10; // Add random fluctuation
    }


    // Clamp score between 0 and 100
    return Math.max(0, Math.min(100, score));
}


// Accept challengeConfig as a prop
function SignalTuningInterface({ advanceNarrative, challengeConfig }) {
  const canvasRef = useRef(null); // Create a ref for the canvas
  const contextRef = useRef(null); // Create a ref for the canvas context
  const animationFrameId = useRef(null); // Ref for the animation frame ID

  // State for tuning parameters (example: frequency and amplitude)
  const [tuningFrequency, setTuningFrequency] = useState(50); // Example initial value
  const [tuningAmplitude, setTuningAmplitude] = useState(50); // Example initial value
  const [stability, setStability] = useState(0); // State for tuning stability
  const [isTuned, setIsTuned] = useState(false); // State to track if signal is successfully tuned
  const [tuningPhase, setTuningPhase] = useState(0); // State for tuning phase
  const [tuningFilterStrength, setTuningFilterStrength] = useState(0); // State for tuning filter strength
  const [dominantInterpretation, setDominantInterpretation] = useState(null); // State for the dominant signal interpretation

  // State for the target signal properties (example: a simple sine wave)
  // These will now come from challengeConfig
  // const [targetFrequency, setTargetFrequency] = useState(60); // Example target frequency
  // const [targetAmplitude, setTargetAmplitude] = useState(40); // Example target amplitude

  // Integrate the audio hook
  const { audioContext, initializeAudio, isAudioInitialized } = useSignalAudio();
  const oscillatorRef = useRef(null); // Ref for the oscillator node
  const gainNodeRef = useRef(null); // Ref for the gain node

  // Integrate Zustand store actions
  const { updateGameState, saveGameStateToServer } = useGameStore();

  // Effect for setting up the canvas and drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return; // Exit if canvas or context is not available
    }

    // Ensure challengeConfig and interpretations are available
    if (!challengeConfig || !challengeConfig.interpretations) {
        console.warn("SignalTuningInterface: challengeConfig or interpretations not available.");
        return; // Exit if no challenge config
    }

    const interpretations = challengeConfig.interpretations; // Get interpretations from config

    contextRef.current = context; // Store the context

    // Set canvas dimensions
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const draw = () => {
      // --- Signal Simulation and Tuning Logic ---
      // In a real implementation, the target signal might change over time
      // and the tuning logic would be more complex.

      // --- Stability Calculation for each interpretation ---
      let maxStability = 0;
      let currentDominantInterpretation = null;

      const currentTuning = {
        frequency: tuningFrequency,
        amplitude: tuningAmplitude,
        phase: tuningPhase,
        filterStrength: tuningFilterStrength,
      };

      // Calculate stability for each interpretation using the helper function
      for (const interpretation of interpretations) {
           const interpretationStability = calculateInterpretationStability(currentTuning, interpretation);

           if (interpretationStability > maxStability) {
             maxStability = interpretationStability;
             currentDominantInterpretation = interpretation.id;
           }
      }


      setStability(maxStability); // Update overall stability state
      setDominantInterpretation(currentDominantInterpretation); // Update dominant interpretation state

      // --- Drawing Logic ---
      // Use the new renderSignalDisplay function, passing interpretations
      renderSignalDisplay(context, canvas, currentTuning, currentDominantInterpretation, maxStability, interpretations);


      // --- Audio Integration ---
      if (audioContext && audioContext.state === 'running') {
        if (!oscillatorRef.current) {
          // Setup oscillator and gain node if they don't exist
          oscillatorRef.current = audioContext.createOscillator();
          gainNodeRef.current = audioContext.createGain();

          oscillatorRef.current.connect(gainNodeRef.current);
          gainNodeRef.current.connect(audioContext.destination);

          oscillatorRef.current.start(); // Start the oscillator
        }

        // Update oscillator frequency based on dominant interpretation's target frequency range
        if (currentDominantInterpretation) {
          const targetInterpretation = interpretations.find(int => int.id === currentDominantInterpretation);
          if (targetInterpretation && Array.isArray(targetInterpretation.targetFrequencyRange)) {
             // Use the lower bound of the frequency range as the base frequency for audio
             oscillatorRef.current.frequency.setValueAtTime(targetInterpretation.targetFrequencyRange[0] * 10, audioContext.currentTime); // Adjust frequency scaling
             // TODO: Implement more complex audio logic based on audioCueLogic
          } else {
             // Default audio frequency if no dominant interpretation or target frequency range
             oscillatorRef.current.frequency.setValueAtTime(tuningFrequency * 10, audioContext.currentTime); // Adjust frequency scaling
          }
        } else {
             // Default audio frequency if no dominant interpretation
             oscillatorRef.current.frequency.setValueAtTime(tuningFrequency * 10, audioContext.currentTime); // Adjust frequency scaling
        }


        // Update gain based on overall stability (higher stability = louder sound)
        gainNodeRef.current.gain.setValueAtTime(maxStability / 100 * 0.5, audioContext.currentTime); // Scale stability to gain (max 0.5)
      }


      // Request next frame
      animationFrameId.current = requestAnimationFrame(draw);
    };

    // Start the drawing loop
    draw();

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId.current); // Cancel animation frame
      // Stop and disconnect audio nodes on unmount
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
    };
  }, [tuningFrequency, tuningAmplitude, tuningPhase, tuningFilterStrength, dominantInterpretation, stability, audioContext, challengeConfig]); // Redraw/update when tuning, challengeConfig, or audioContext changes

  // Placeholder function for triggerWitnessCue
  const triggerWitnessCue = () => {
    console.log("Witness cue triggered (placeholder)");
    // TODO: Implement actual Witness cue logic
  };

  // Effect to handle narrative progression when stability is high
  useEffect(() => {
    // Ensure challengeConfig and dominantInterpretation are available
    if (!challengeConfig || !dominantInterpretation) {
        return;
    }

    const interpretations = challengeConfig.interpretations;
    const currentInterpretation = interpretations.find(int => int.id === dominantInterpretation);

    // Check if the dominant interpretation's stability is above the challenge threshold
    if (currentInterpretation && stability >= challengeConfig.stabilityLockThreshold * 100 && !isTuned) { // Multiply threshold by 100 as stability is 0-100
      setIsTuned(true); // Mark as tuned to prevent re-triggering
      console.log(`Signal tuned to: ${currentInterpretation.id}`);

      // Update game state based on the locked interpretation
      updateGameState(prevState => {
        const newHiddenPoints = { ...prevState.hiddenPointScores };
        for (const key in currentInterpretation.hiddenPointImpact) { // Corrected property name
          newHiddenPoints[key] = (newHiddenPoints[key] || 0) + currentInterpretation.hiddenPointImpact[key];
        }

        const newVisibleIndicators = { ...prevState.visibleIndicatorValues };
        for (const key in currentInterpretation.visibleIndicatorImpact) { // Corrected property name
           // Assuming visible indicators are numbers that need to be adjusted
          newVisibleIndicators[key] = (newVisibleIndicators[key] || 0) + currentInterpretation.visibleIndicatorImpact[key];
        }

        return {
          decisionHistory: { ...prevState.decisionHistory, signalTuned: dominantInterpretation },
          hiddenPointScores: newHiddenPoints,
          visibleIndicatorValues: newVisibleIndicators,
        };
      });

      // Save game state
      saveGameStateToServer();

      // Trigger Witness cue if enabled for this challenge and dominant interpretation is B
      if (challengeConfig.witnessCueTriggerEnabled && dominantInterpretation === 'B') {
        triggerWitnessCue(); // Call the Witness cue function
      }

      advanceNarrative(dominantInterpretation); // Call the narrative advancement function
    }
  }, [stability, dominantInterpretation, isTuned, updateGameState, saveGameStateToServer, triggerWitnessCue, advanceNarrative, challengeConfig]); // Add challengeConfig to dependency array

  // TODO: Add visual feedback for proximity to each interpretation (waveform clarity, audio tones, spectrum analyzer)
  // This will likely involve modifying the 'draw' function and potentially the useSignalAudio hook.

  return (
    <div className={styles.container}>
      <h2>Signal Tuning Interface</h2>
      <div className={styles.displayArea}>
        <canvas ref={canvasRef}></canvas> {/* Add the canvas element */}
      </div>

      {/* Stability Gauge */}
      <div className={styles.stabilityGaugeContainer}>
          <div className={styles.stabilityGaugeLabel}>Signal Stability</div>
          <div className={styles.stabilityGaugeBarBackground}>
              <div
                  className={`${styles.stabilityGaugeBarFill} ${
                      dominantInterpretation && challengeConfig?.stabilityLockThreshold && stability > challengeConfig.stabilityLockThreshold * 100 * 0.9 && stability < challengeConfig.stabilityLockThreshold * 100
                          ? styles.nearingThreshold
                          : ''
                  }`}
                  style={{ width: `${Math.min(stability, 100)}%` }} // Fill based on stability (0-100)
              ></div>
              {/* Optional: Mark the threshold */}
              {challengeConfig?.stabilityLockThreshold && (
                <div
                    className={styles.stabilityGaugeThresholdMarker}
                    style={{ left: `${challengeConfig.stabilityLockThreshold * 100}%` }} // Multiply threshold by 100
                ></div>
              )}
          </div>
          {/* Numeric display */}
          <div className={styles.stabilityGaugeValue}>
              {stability.toFixed(1)}%
          </div>
      </div>


      <div className={styles.controls}>
        {/* Frequency Control */}
        <div className={styles.controlGroup}>
          <label htmlFor="tuningFrequency">Frequency:</label>
          <input
            type="range"
            id="tuningFrequency"
            min="0"
            max="300" // Increased max frequency for broader range
            value={tuningFrequency}
            onChange={(e) => {
              if (!isAudioInitialized) {
                initializeAudio();
              }
              setTuningFrequency(parseInt(e.target.value));
            }}
          />
          <span>{tuningFrequency}</span>
        </div>

        {/* Amplitude Control */}
        <div className={styles.controlGroup}>
          <label htmlFor="tuningAmplitude">Amplitude:</label>
          <input
            type="range"
            id="tuningAmplitude"
            min="0"
            max="100"
            value={tuningAmplitude}
            onChange={(e) => {
              if (!isAudioInitialized) {
                initializeAudio();
              }
              setTuningAmplitude(parseInt(e.target.value));
            }}
          />
          <span>{tuningAmplitude}</span>
        </div>

        {/* Stability Display */}
        <div className={styles.controlGroup}>
          <p>Stability:</p>
          <span>{stability.toFixed(1)}%</span>
        </div>

        {/* Phase Control */}
        <div className={styles.controlGroup}>
          <label htmlFor="tuningPhase">Phase:</label>
          <input
            type="range"
            id="tuningPhase"
            min="0"
            max="360"
            value={tuningPhase}
            onChange={(e) => {
              if (!isAudioInitialized) {
                initializeAudio();
              }
              setTuningPhase(parseInt(e.target.value));
            }}
          />
          <span>{tuningPhase}°</span>
        </div>

        {/* Filter Strength Control */}
        <div className={styles.controlGroup}>
          <label htmlFor="tuningFilterStrength">Filter Strength:</label>
          <input
            type="range"
            id="tuningFilterStrength"
            min="0"
            max="100"
            value={tuningFilterStrength}
            onChange={(e) => {
              if (!isAudioInitialized) {
                initializeAudio();
              }
              setTuningFilterStrength(parseInt(e.target.value));
            }}
          />
          <span>{tuningFilterStrength}%</span>
        </div>

        {/* More control groups will be added */}
      </div>
    </div>
  );
}

export default SignalTuningInterface;