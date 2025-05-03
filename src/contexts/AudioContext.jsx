import { createContext, useState, useRef, useCallback, useEffect } from 'react'
import dialogueData from '../data/dialogue.json'
import * as Tone from 'tone'

// Rename to avoid conflict with browser's AudioContext
const AudioPlayerContext = createContext(null)

// Export the context
export { AudioPlayerContext as AudioContext }

// Modified to always return local URL to avoid CORS issues
// const getAudioUrl = (filename) => {
//   // Always use local audio files to avoid CORS issues
//   return `/audio/narration/${filename}`
// }

export function AudioProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [currentDialogue, setCurrentDialogue] = useState(null)
  const audioRef = useRef(null) // Refers to Tone.Player or HTML5 element depending on context
  const [isMuted, setIsMuted] = useState(false) // Add mute state
  const [isIOS, setIsIOS] = useState(false)
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false) // Add state for tracking audio unlock status

  // Audio-related refs
  const audioContextRef = useRef(null)
  // --- Refs for CURRENT playback instance ---
  const currentAudioElementRef = useRef(null); // Current audio element being played
  const currentSourceNodeRef = useRef(null); // Current source node connected to the audio graph
  const currentEndedCallbackRef = useRef(null); // To store the callback from NarrativeReader
  const currentErrorCallbackRef = useRef(null); // For error reporting
  
  const analyzerRef = useRef(null)
  const masterGainNodeRef = useRef(null); // Add ref for master gain
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [pendingPlayback, setPendingPlayback] = useState(null); // State for deferred playback { url, dialogueId, dialogue, isTone }
  
  // State for tracking audio state before data perception toggle
  const [wasPlayingBeforeToggle, setWasPlayingBeforeToggle] = useState(false);
  const [audioPositionBeforeToggle, setAudioPositionBeforeToggle] = useState(0);
  
  // Check if we're on iOS and get version
  const [iOSVersion, setIOSVersion] = useState(0);
  const [isNewerIOS, setIsNewerIOS] = useState(false);

  useEffect(() => {
    const iOSDetected = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOSDetected);
    console.log('iOS device detected:', iOSDetected);
    if (iOSDetected) {
      const versionMatch = navigator.userAgent.match(/OS (\d+)_/i);
      const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;
      setIOSVersion(version);
      setIsNewerIOS(version >= 15);
      console.log(`iOS Version: ${version}, Is Newer iOS (>=15): ${version >= 15}`);
    }
  }, [])

  const getAudioInstance = useCallback(() => {
    return currentAudioElementRef.current || audioRef.current;
  }, [])
  
  // Method to get analyzer data for visualization
  const getAnalyzerData = useCallback(() => {
    if (analyzerRef.current) {
      try {
        // Try Tone.js style analyzer first
        if (typeof analyzerRef.current.getValue === 'function') {
          return analyzerRef.current.getValue();
        }
        
        // Try Web Audio API analyzer
        if (typeof analyzerRef.current.getByteFrequencyData === 'function') {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(dataArray);
          
          // Convert to Float32Array to maintain consistent return type
          const floatArray = new Float32Array(dataArray.length);
          for (let i = 0; i < dataArray.length; i++) {
            // Convert from 0-255 to -100-0 dB range (Tone.js format)
            floatArray[i] = -100 + (dataArray[i] / 255) * 100;
          }
          return floatArray;
        }
      } catch (err) {
        console.error('Error getting analyzer data:', err);
      }
    }
    
    // Return empty array as fallback
    return new Float32Array(0);
  }, [])

  // Track if iOS audio has been unlocked
  const [iOSAudioUnlocked, setIOSAudioUnlocked] = useState(false)
  
  // Function to resume audio context and unlock audio on iOS
  const resumeContextAndUnlock = useCallback(async () => {
    if (!audioContextRef.current) {
      console.warn("[AudioContext] Context not available for resume/unlock.");
      return Promise.reject("Audio context not initialized.");
    }

    let resumePromise = Promise.resolve();
    if (audioContextRef.current.state === 'suspended') {
      console.log('[AudioContext] Attempting to resume context from interaction...');
      resumePromise = audioContextRef.current.resume().then(() => {
        console.log('[AudioContext] Context successfully resumed via resume(). State:', audioContextRef.current.state);
      }).catch(err => {
        console.error('[AudioContext] Error resuming context:', err);
        throw err; // Re-throw to signal failure
      });
    }

    // Wait for resume() to potentially complete
    await resumePromise;

    // Check state *after* attempting resume
    if (audioContextRef.current.state !== 'running') {
       console.warn('[AudioContext] Context is not running after resume attempt. State:', audioContextRef.current.state);
    }

    // --- Play silent audio ---
    console.log('[AudioContext] Attempting to play silent audio for unlocking...');
    const silentPlayer = new Audio('/audio/effects/silence.wav'); // Path to your silent file
    silentPlayer.setAttribute('playsinline', ''); // Good practice for iOS
    silentPlayer.volume = 0.0001; // Effectively silent but not zero, sometimes helps

    try {
      await silentPlayer.play();
      console.log('[AudioContext] Silent audio played successfully. Audio should be unlocked.');
      setIsAudioUnlocked(true);
      setIOSAudioUnlocked(true);
    } catch (error) {
      console.error('[AudioContext] Error playing silent audio:', error);
      // Check if context is running, we might still be okay
      if (audioContextRef.current.state === 'running') {
         console.warn('[AudioContext] Silent play failed, but context is running. Proceeding cautiously.');
         setIsAudioUnlocked(true);
         setIOSAudioUnlocked(true);
      } else {
         throw error; // Re-throw if context isn't running AND silent play failed
      }
    }
  }, []);
  
  // Initialize audio context and audio element
  const initAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      try {
        // Use a singleton pattern to ensure we only create one audio context
        if (!window.globalAudioContext) {
          window.globalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
          console.log('Global audio context created successfully');
        }
        
        // Use the global audio context
        audioContextRef.current = window.globalAudioContext;
        console.log('Using global audio context');

        // Create and connect Master Gain Node if it doesn't exist
        if (audioContextRef.current && !masterGainNodeRef.current) {
          masterGainNodeRef.current = audioContextRef.current.createGain();
          masterGainNodeRef.current.gain.value = isMuted ? 0 : 1; // Set initial gain based on state
          masterGainNodeRef.current.connect(audioContextRef.current.destination);
          console.log('Master Gain Node created and connected during init.');
        }

        // Resume the context if it's suspended
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume()
            .then(() => {
               console.log('Audio context resumed during initialization');
               // Ensure gain node exists after resume as well
               if (audioContextRef.current && !masterGainNodeRef.current) {
                 masterGainNodeRef.current = audioContextRef.current.createGain();
                 masterGainNodeRef.current.gain.value = isMuted ? 0 : 1;
                 masterGainNodeRef.current.connect(audioContextRef.current.destination);
                 console.log('Master Gain Node created post-resume.');
               }
            })
            .catch(err => console.error('Failed to resume audio context:', err));
        }
      } catch (err) {
        console.error('Failed to create audio context:', err);
      }
    }
  }, []); // isMuted is handled via ref access, not as a dependency
  
  // Helper function for oscillator-based unlocking
  const tryOscillatorUnlock = useCallback(() => {
    try {
      const oscillator = audioContextRef.current.createOscillator();
      oscillator.frequency.value = 1;
      oscillator.connect(audioContextRef.current.destination);
      oscillator.start(0);
      oscillator.stop(0.001);
      setAudioInitialized(true);
      console.log('[iOS Audio Unlock] iOS audio initialized with oscillator');
    } catch (err) {
      console.error('[iOS Audio Unlock] Failed oscillator method:', err);
    }
  }, []);

  // --- 1. Dedicated Cleanup Function ---
  const cleanupCurrentAudio = useCallback(() => {
    console.log('[AudioContext] cleanupCurrentAudio called.');
    const element = currentAudioElementRef.current;
    const sourceNode = currentSourceNodeRef.current;

    if (element) {
      console.log('[AudioContext] Pausing and removing listeners from previous element.');
      element.pause();
      // Remove all listeners added dynamically
      element.removeEventListener('canplay', handleCanPlay);
      element.removeEventListener('ended', handleEnded);
      element.removeEventListener('error', handleError);
      element.src = ''; // Clear src
      element.removeAttribute('src');
      element.load(); // Attempt to force release
      currentAudioElementRef.current = null;
    } else {
      console.log('[AudioContext] No previous audio element found for cleanup.');
    }

    if (sourceNode) {
      try {
        console.log('[AudioContext] Disconnecting previous source node.');
        sourceNode.disconnect();
      } catch (e) {
        console.warn('[AudioContext] Error disconnecting previous source node:', e);
      }
      currentSourceNodeRef.current = null;
    } else {
      console.log('[AudioContext] No previous source node found for cleanup.');
    }

    // Clear callbacks
    currentEndedCallbackRef.current = null;
    currentErrorCallbackRef.current = null;
    console.log('[AudioContext] Current audio instance cleanup complete.');
  }, []);

  // --- Event Handlers (defined once, referenced later) ---
  const handleCanPlay = useCallback(() => {
    const element = currentAudioElementRef.current;
    const context = audioContextRef.current;
    const gainNode = masterGainNodeRef.current;

    if (!element || !context || !gainNode || currentSourceNodeRef.current) {
      console.warn('[AudioContext] handleCanPlay: Aborting - missing refs or source node already exists.');
      return;
    }
    console.log(`[AudioContext] 'canplay' event for ${element.src}. Creating and connecting source node.`);

    try {
      const sourceNode = context.createMediaElementSource(element);
      currentSourceNodeRef.current = sourceNode; // Store ref

      // Connect graph: Source -> (Analyser?) -> Gain -> Destination
      let currentNode = sourceNode;
      if (analyzerRef.current) {
        currentNode.connect(analyzerRef.current);
        currentNode = analyzerRef.current;
      }
      currentNode.connect(gainNode);
      gainNode.connect(context.destination); // Ensure gain is connected

      console.log(`[AudioContext] Source node created and connected. Attempting play for ${element.src}`); // Modified logging
      const playPromise = element.play();

      if (playPromise !== undefined) { // Added check for promise existence
          playPromise.then(_ => {
              console.log(`[AudioContext] Playback started successfully for ${element.src}`); // Modified logging
              setIsPlaying(true); // Set isPlaying to true when playback starts
          }).catch(error => {
              console.error(`[AudioContext] Playback FAILED for ${element.src}:`, error); // Modified logging
              // *** THIS IS LIKELY WHERE THE iOS ERROR WILL APPEAR ***
              // Clean up or signal error state if needed
              if (currentErrorCallbackRef.current) { // Use the ref
                  currentErrorCallbackRef.current(error); // Trigger the error callback
              }
              // Maybe call cleanup here?
              cleanupCurrentAudio(); // Call cleanup on failure
          });
       } else {
            console.warn("[AudioContext] audioElement.play() did not return a promise. Playback might not have started."); // Added logging
            // Older browser? Unlikely, but good to know.
       }
     } catch (error) {
       console.error('[AudioContext] Error creating/connecting source node:', error);
       handleError(error); // Treat node creation failure as an error
     }
   }, [cleanupCurrentAudio, currentErrorCallbackRef]); // Added dependencies

  const handleEnded = useCallback(() => {
    const elementSrc = currentAudioElementRef.current?.src || 'unknown';
    console.log(`[AudioContext] 'ended' event for ${elementSrc}.`);
    // Call the callback passed from NarrativeReader
    if (currentEndedCallbackRef.current) {
      console.log('[AudioContext] Calling onEnded callback.');
      currentEndedCallbackRef.current();
    } else {
      console.warn('[AudioContext] onEnded callback is null!');
    }
    setIsPlaying(false);
    cleanupCurrentAudio(); // Clean up after ending
  }, [cleanupCurrentAudio]);

  const handleError = useCallback((eventOrError) => {
    const element = currentAudioElementRef.current;
    const errorDetails = element?.error || eventOrError;
    console.error(`[AudioContext] 'error' event for ${element?.src || 'unknown'}:`, errorDetails);
    // Call an error callback if provided
    if (currentErrorCallbackRef.current) {
      currentErrorCallbackRef.current(errorDetails);
    }
    setIsPlaying(false);
    cleanupCurrentAudio(); // Clean up on error
  }, [cleanupCurrentAudio]);

  // --- Main Playback Function ---
  const playNarrativeAudio = useCallback((filePath, onEnded, onError) => { // Accept callbacks
    if (!audioContextRef.current || !masterGainNodeRef.current) {
      console.error('[AudioContext] Cannot play: Audio context or master gain not ready.');
      onError?.(new Error("Audio context not ready")); // Notify caller
      return;
    }
    console.log(`[AudioContext] playNarrativeAudio called for: ${filePath}`);

    // 1. Cleanup previous instance *before* creating new one
    cleanupCurrentAudio();

    // 2. Store callbacks
    currentEndedCallbackRef.current = onEnded;
    currentErrorCallbackRef.current = onError;

    // 3. Create NEW audio element
    console.log('[AudioContext] Creating new HTMLAudioElement.');
    const newAudioElement = document.createElement('audio');
    newAudioElement.preload = 'auto';
    // Optional: Add attributes like crossOrigin if needed
    newAudioElement.crossOrigin = "anonymous";

    // For iOS Safari, we need to set these attributes
    if (isIOS) {
      newAudioElement.controls = true;
      newAudioElement.playsinline = true;
      newAudioElement.setAttribute('webkit-playsinline', 'true');
      newAudioElement.muted = false;
      newAudioElement.autoplay = false;
    }

    // Store reference to the new element
    currentAudioElementRef.current = newAudioElement;
    audioRef.current = newAudioElement; // Ensure getAudioInstance returns the correct element

    // 4. Add event listeners (using the stable handler references)
    console.log('[AudioContext] Adding listeners to new element.');
    newAudioElement.addEventListener('canplay', handleCanPlay, { once: true }); // Use once: true for canplay
    newAudioElement.addEventListener('ended', handleEnded, { once: true });
    newAudioElement.addEventListener('error', handleError, { once: true });

    // 5. Set src and load
    console.log(`[AudioContext] Setting src to ${filePath} and calling load() on new element.`);
    newAudioElement.src = filePath;
    newAudioElement.load();

  }, [cleanupCurrentAudio, handleCanPlay, handleEnded, handleError, isIOS]);
  
  // Initialize the audio context when the component mounts
  useEffect(() => {
    // Initialize audio context
    initAudioContext();
    
    // Set up audio element for capturing
    if (typeof window !== 'undefined') {
      // Create a silent audio element specifically for iOS audio unlock
      if (isIOS) {
        console.log('[iOS Audio Unlock] Creating silent audio element');
        const silentAudio = document.createElement('audio');
        silentAudio.id = 'ios-audio-unlock';
        // Try using a data URI if the file doesn't exist
        silentAudio.src = '/audio/utils/silence.wav';
        silentAudio.volume = 0.01; // Set to minimum volume
        silentAudio.loop = false;
        silentAudio.preload = 'auto';
        silentAudio.playsinline = true;
        silentAudio.setAttribute('webkit-playsinline', 'true'); // Added webkit-playsinline
        silentAudio.muted = false;
        silentAudio.style.display = 'none';
        document.body.appendChild(silentAudio);
      }
      
      // Resume audio context on user interaction (required by browsers)
      const resumeAudioContext = () => {
        console.log('User interaction detected, resuming audio context');
        
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          console.log('[AudioContext] Attempting to resume context from interaction...'); // Added logging
          audioContextRef.current.resume().then(() => {
            console.log('[AudioContext] Context successfully resumed via resume(). State:', audioContextRef.current.state); // Modified logging
            // Potentially set a state flag here like setIsContextDefinitelyRunning(true)
            
            // For iOS, we need to unlock audio capabilities
            if (isIOS && !audioInitialized) {
              console.log('[iOS Audio Unlock] Initializing audio on iOS');
              
              // Play the silent audio to unlock iOS audio
              // Enhanced unlockAudio function
              const unlockAudio = () => {
                const silentAudio = document.getElementById('ios-audio-unlock');
                if (silentAudio && audioContextRef.current) {
                  console.log('[iOS Audio Unlock] Attempting multiple unlock methods...');
                  
                  // Play multiple times with different methods
                  Promise.all([
                    // Method 1: Play the silent audio
                    silentAudio.play().catch(err => console.warn('[iOS Audio Unlock] Silent audio play method failed:', err)),
                    
                    // Method 2: Use an oscillator
                    new Promise(resolve => {
                      try {
                        const oscillator = audioContextRef.current.createOscillator();
                        oscillator.frequency.value = 1;
                        oscillator.connect(audioContextRef.current.destination);
                        oscillator.start(0);
                        oscillator.stop(audioContextRef.current.currentTime + 0.001); // Use context time
                        resolve();
                      } catch (e) {
                        console.warn('[iOS Audio Unlock] Oscillator method failed:', e);
                        resolve(); // Resolve even if failed
                      }
                    }),
                    
                    // Method 3: Use a buffer source
                    new Promise(resolve => {
                      try {
                        const buffer = audioContextRef.current.createBuffer(1, 1, 22050); // Minimal buffer
                        const source = audioContextRef.current.createBufferSource();
                        source.buffer = buffer;
                        source.connect(audioContextRef.current.destination);
                        source.start(0);
                        resolve();
                      } catch (e) {
                        console.warn('[iOS Audio Unlock] Buffer source method failed:', e);
                        resolve(); // Resolve even if failed
                      }
                    })
                  ])
                  .then(() => {
                    console.log('[iOS Audio Unlock] Multiple unlock methods attempted.');
                    // Check context state *after* attempts
                    if (audioContextRef.current.state === 'running') {
                       console.log('[iOS Audio Unlock] AudioContext is now running.');
                       setAudioInitialized(true);
                       setIOSAudioUnlocked(true);
                    } else {
                       console.warn('[iOS Audio Unlock] AudioContext still not running after unlock attempts.');
                       // Optionally try resuming again or rely on statechange listener
                       audioContextRef.current.resume().catch(e => console.error("Final resume attempt failed", e));
                    }

                    // Check for pending playback immediately regardless of final state,
                    // as the statechange listener might handle it if still suspended.
                    if (pendingPlayback) {
                      console.log('[iOS Audio Unlock] Processing pending playback immediately after unlock attempt.');
                      // Use the ref to call the handler, passing current context and pending state
                      handleContextStateChangeRef.current(audioContextRef.current, pendingPlayback);
                    }
                  })
                  .catch(err => {
                    // This catch might not be reached if individual promises handle errors
                    console.error('[iOS Audio Unlock] Error during Promise.all for unlock methods:', err);
                  });
                } else {
                   console.error('[iOS Audio Unlock] Silent audio element or AudioContext not found for unlock.');
                   // Fallback or alternative strategy if needed
                   tryOscillatorUnlock(); // Attempt original fallback
                }
              };
              
              unlockAudio();
            }
          }).catch(err => {
            console.error('Failed to resume AudioContext:', err);
          });
        }
      };
      
      document.addEventListener('click', resumeAudioContext);
      document.addEventListener('touchstart', resumeAudioContext);
      document.addEventListener('keydown', resumeAudioContext);
    }
    
    return () => {
      // Only clean up resources, but don't close the global audio context
      
      // Clean up current audio
      cleanupCurrentAudio();
      
      // Don't close the audio context since we're using a global singleton
      // Just clear our reference to it
      if (audioContextRef.current) {
        console.log('Clearing audio context reference during cleanup');
        // We don't close the context, just clear our reference
        audioContextRef.current = null;
      }
    };
  }, [isIOS, cleanupCurrentAudio, initAudioContext, tryOscillatorUnlock]); 

  // --- Other functions (pause, resume, etc.) need adaptation ---
  const pauseAudio = useCallback(() => {
    if (currentAudioElementRef.current) {
      currentAudioElementRef.current.pause();
      console.log('[AudioContext] Paused current audio element.');
      setIsPlaying(false);
    }
  }, []);

  const resumeAudio = useCallback(() => {
    if (currentAudioElementRef.current && currentAudioElementRef.current.paused) {
      const playPromise = currentAudioElementRef.current.play();
      if (playPromise) {
        playPromise.then(() => {
          console.log('[AudioContext] Resumed current audio element.');
          setIsPlaying(true);
        }).catch(err => {
          console.error('[AudioContext] Resume failed:', err);
        });
      }
    }
  }, []);

  // Function to play audio file (wrapper for playNarrativeAudio for backward compatibility)
  const playAudioFile = useCallback((filePath, onComplete) => {
    console.log('[AudioContext] playAudioFile called (might be for non-narrative audio):', filePath);
    return playNarrativeAudio(filePath, onComplete);
  }, [playNarrativeAudio]);

  // Create a stable reference for the context state change handler
  const handleContextStateChangeRef = useRef((context, pendingPlayback) => {
    console.log(`[handleContextStateChangeRef] Context state changed to: ${context.state}, pendingPlayback: ${pendingPlayback ? 'Yes' : 'No'}`); // Added logging
    if (context.state === 'running' && pendingPlayback) {
      console.log('[handleContextStateChangeRef] Audio context is running, attempting pending playback:', pendingPlayback.dialogueId || pendingPlayback.url); // Modified logging
      // Call playNarrativeAudio with the pending playback info
      playNarrativeAudio(pendingPlayback.url, pendingPlayback.onEnded, pendingPlayback.onError);
      // Clear the pending playback state
      setPendingPlayback(null);
    }
  });
  
  // Effect to handle pending playback when context resumes
  useEffect(() => {
    const context = audioContextRef.current;
    if (!context) return;

    const handleContextStateChange = () => {
      handleContextStateChangeRef.current(context, pendingPlayback);
    };

    context.addEventListener('statechange', handleContextStateChange);

    // Initial check in case the context is already running when this effect mounts
    handleContextStateChange();

    return () => {
      context.removeEventListener('statechange', handleContextStateChange);
    };
  }, [pendingPlayback]); // Only depend on pendingPlayback

  // Create a stable reference for preloadAudioFile
  const preloadAudioFileRef = useRef((filePath) => {
    if (!filePath) return;

    initAudioContext(); // Ensure context is initialized

    // For iOS, create a special preload mechanism
    if (isIOS) {
      console.log('[iOS Preload] Preloading audio:', filePath);
      // Create a temporary audio element for preloading
      const preloadElement = document.createElement('audio');
      preloadElement.id = `preload-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`; // Unique ID
      preloadElement.src = `/${filePath}`;
      preloadElement.preload = 'auto'; // Important for loading
      preloadElement.style.display = 'none';
      document.body.appendChild(preloadElement);

      preloadElement.load(); // Explicitly call load

      // Optional: Add listeners to check loading status
      preloadElement.oncanplaythrough = () => {
        console.log(`[iOS Preload] Can play through: ${filePath}`);
        // Optionally remove the element after load? Or keep for faster play?
        // if (preloadElement.parentNode) {
        //   preloadElement.parentNode.removeChild(preloadElement);
        // }
      };
      preloadElement.onerror = (e) => {
        console.error(`[iOS Preload] Error preloading ${filePath}:`, e);
        if (preloadElement.parentNode) {
          preloadElement.parentNode.removeChild(preloadElement);
        }
      };
    }
  });

  // Wrapper function for preloadAudioFile
  const preloadAudioFile = useCallback((filePath) => {
    preloadAudioFileRef.current(filePath);
  }, []); // No dependencies needed since we're using refs
  
  // Function to stop playback
  const stopNarration = useCallback(() => {
    setIsPlaying(false);
    cleanupCurrentAudio();
  }, [cleanupCurrentAudio]);
  
  // Function to handle end of narration
  const handleNarrationEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentDialogue(null);
    cleanupCurrentAudio();
  }, [cleanupCurrentAudio]);

  // Function to toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted(prevMuted => {
      const newMuted = !prevMuted;
      // Control mute via the Master Gain Node
      if (masterGainNodeRef.current && audioContextRef.current) {
        // Use setValueAtTime and linearRampToValueAtTime for smooth transition
        const now = audioContextRef.current.currentTime;
        masterGainNodeRef.current.gain.cancelScheduledValues(now); // Cancel any previous ramps
        masterGainNodeRef.current.gain.setValueAtTime(masterGainNodeRef.current.gain.value, now); // Start from current value
        masterGainNodeRef.current.gain.linearRampToValueAtTime(
          newMuted ? 0 : 1, // Target value (0 for mute, 1 for unmute)
          now + 0.05 // Ramp duration (e.g., 50ms)
        );
        console.log(`Master gain node ramp initiated to ${newMuted ? 0 : 1}`);
      } else {
        console.warn('Master Gain Node or Audio Context not available for toggleMute.');
      }
      return newMuted;
    });
  }, []); // Dependencies: isMuted state is implicitly handled by setIsMuted setter. Refs don't need to be deps.

  // Functions to store and restore audio state for data perception toggle
  const storeAudioStateBeforeToggle = useCallback(() => {
    // Store current audio state
    const currentAudio = currentAudioElementRef.current;
    if (currentAudio) {
      setWasPlayingBeforeToggle(isPlaying);
      setAudioPositionBeforeToggle(currentAudio.currentTime || 0);
      console.log('[AudioContext] Stored audio state:', {
        wasPlaying: isPlaying,
        position: currentAudio.currentTime || 0
      });
    }
  }, [isPlaying]);

  const restoreAudioStateAfterToggle = useCallback(() => {
    // Restore audio state
    const currentAudio = currentAudioElementRef.current;
    console.log('[AudioContext] Restoring audio state:', {
      wasPlaying: wasPlayingBeforeToggle,
      position: audioPositionBeforeToggle
    });
    
    if (currentAudio && wasPlayingBeforeToggle) {
      // Set the current time if available
      if (typeof currentAudio.currentTime === 'number' && audioPositionBeforeToggle > 0) {
        currentAudio.currentTime = audioPositionBeforeToggle;
      }
      
      // Resume playback if it was playing before
      resumeAudio(); // Use the existing resumeAudio function
    }
  }, [wasPlayingBeforeToggle, audioPositionBeforeToggle, resumeAudio]);

  const providerValue = {
    // playNarration, // Removed as the function is commented out
    stopNarration,
    handleNarrationEnd,
    getAudioInstance,
    getAnalyzerData,
    isPlaying,
    currentTrack,
    currentDialogue,
    isIOS,
    analyzer: analyzerRef.current,
    isMuted, // Expose mute state
    toggleMute, // Expose toggle function
    playAudioFile, // Expose playAudioFile (if still needed for non-narrative audio)
    playNarrativeAudio, // Expose new function for narrative audio
    pauseAudio, // Expose pause function
    resumeAudio, // Expose resume function
    storeAudioStateBeforeToggle, // Expose new function
    restoreAudioStateAfterToggle, // Expose new function
    cleanupCurrentAudio, // Expose the cleanup function for external use if needed
    resumeContextAndUnlock, // Expose the new function for iOS audio unlock
    isAudioUnlocked // Expose the audio unlock state
  };

  return (
    <AudioPlayerContext.Provider value={providerValue}>
      {children}
    </AudioPlayerContext.Provider>
  );
}
