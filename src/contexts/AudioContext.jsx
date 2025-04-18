import { createContext, useState, useRef, useCallback, useEffect } from 'react'
import dialogueData from '../data/dialogue.json'
import * as Tone from 'tone'

export const AudioContext = createContext(null)

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

  // Audio-related refs
  const audioContextRef = useRef(null)
  const audioElementRef = useRef(null)
  const analyzerRef = useRef(null)
  const mediaStreamSourceRef = useRef(null)
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
    return audioRef.current
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
  
  // Connect analyzer to audio element - use a stable reference with useRef
  // This function doesn't depend on any state, only refs, so it doesn't need to be recreated
  const connectAnalyzerToAudioRef = useRef((audioElement) => {
    if (!audioElement || !audioContextRef.current) return;
    
    try {
      // Create analyzer if it doesn't exist
      if (!analyzerRef.current) {
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256;
        analyzerRef.current.smoothingTimeConstant = 0.8; // Add smoothing for better visualization
      }
      
      // Handle media stream source connection
      try {
        // If we already have a media source, try to disconnect it first to avoid errors
        if (mediaStreamSourceRef.current) {
          try {
            mediaStreamSourceRef.current.disconnect();
            console.log('Disconnected existing media source');
          } catch (disconnectErr) {
            console.log('Media source might already be disconnected:', disconnectErr.message);
          }
        }
        
        // Create a new media stream source
        mediaStreamSourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
        console.log('Created new media element source');
        
        // Connect the media source to the analyzer and destination
        mediaStreamSourceRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(masterGainNodeRef.current); // Connect analyzer to gain node
        console.log('Audio analyzer connected successfully');
      } catch (sourceErr) {
        // If we get an error about the element already being connected, that's actually okay
        if (sourceErr.message && sourceErr.message.includes('already connected')) {
          console.log('Audio element already connected to a node, which is fine');
          
          // Make sure analyzer is connected to destination
          try {
            analyzerRef.current.connect(masterGainNodeRef.current); // Connect analyzer to gain node
          } catch (connectErr) {
            // Ignore if already connected
            console.log('Analyzer might already be connected to destination');
          }
        } else {
          throw sourceErr; // Re-throw if it's a different error
        }
      }
    } catch (err) {
      console.error('Failed to connect analyzer:', err);
    }
  });
  
  // Wrapper function to maintain API compatibility
  const connectAnalyzerToAudio = useCallback(() => {
    if (audioElementRef.current) {
      connectAnalyzerToAudioRef.current(audioElementRef.current);
    }
  }, []);
  
  // Initialize the audio context when the component mounts
  useEffect(() => {
    // Initialize audio context
    initAudioContext();
    
    // Set up audio element for capturing
    if (typeof window !== 'undefined') {
      // Create a hidden audio element for capturing
      const audioElement = document.createElement('audio');
      audioElement.id = 'audio-visualizer-source';
      audioElement.crossOrigin = 'anonymous'; // Add this to help with CORS
      audioElement.style.display = 'none';
      audioElement.preload = 'auto';
      
      // For iOS Safari, we need to set these attributes
      if (isIOS) {
        audioElement.controls = true;
        audioElement.playsinline = true;
        audioElement.setAttribute('webkit-playsinline', 'true'); // Added webkit-playsinline
        audioElement.muted = false;
        audioElement.autoplay = false;
      }
      
      document.body.appendChild(audioElement);
      audioElementRef.current = audioElement;
      
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
          audioContextRef.current.resume().then(() => {
            console.log('AudioContext resumed successfully');
            
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
      
      // Disconnect media source if it exists
      if (mediaStreamSourceRef.current) {
        try {
          mediaStreamSourceRef.current.disconnect();
          console.log('Media source disconnected during cleanup');
        } catch (e) {
          // Ignore disconnection errors
          console.log('Error disconnecting media source:', e.message);
        }
      }
      
      // Remove audio element from DOM
      if (audioElementRef.current && audioElementRef.current.parentNode) {
        audioElementRef.current.parentNode.removeChild(audioElementRef.current);
        console.log('Audio element removed from DOM during cleanup');
      }
      
      // Don't close the audio context since we're using a global singleton
      // Just clear our reference to it
      if (audioContextRef.current) {
        console.log('Clearing audio context reference during cleanup');
        // We don't close the context, just clear our reference
        audioContextRef.current = null;
      }
    };
  }, [isIOS]); // Only depend on isIOS, other functions are stable refs

  // Effect to handle pending playback when context resumes
  // Play audio using HTML5 Audio element
  // Create stable function references using useRef
  const playAudioWithElementRef = useRef((url, dialogueId, dialogue) => {
    if (!audioElementRef.current) return false;
    
    try {
      audioElementRef.current.src = url;
      audioRef.current = audioElementRef.current; // Ensure getAudioInstance returns the correct element
      audioElementRef.current.onloadeddata = () => {
        console.log('Audio loaded:', dialogueId);
        setCurrentDialogue(dialogue);
        
        // Connect analyzer to the audio element
        connectAnalyzerToAudioRef.current(audioElementRef.current);
        
        // Play the audio only if context is running
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
          audioElementRef.current.play()
            .then(() => {
              console.log('Audio playing:', dialogueId);
              setIsPlaying(true);
              setCurrentTrack(dialogueId);
            })
            .catch(err => {
              console.error('Error playing audio:', err);
              // Consider resetting state here if play fails
            });
        } else {
          console.warn('Audio context not running. Storing playback request.');
          setPendingPlayback({ url, dialogueId, dialogue, isTone: false }); // Store details for later playback
          audioContextRef.current?.resume(); // Attempt to resume context again
          setIsPlaying(false); // Ensure isPlaying is false if context isn't ready
        }
      };
      
      audioElementRef.current.onended = () => {
        console.log('Audio ended:', dialogueId);
        setIsPlaying(false);
        setCurrentDialogue(null);
      };
      
      audioElementRef.current.onerror = (err) => {
        console.error('Audio error:', err);
        return false;
      };
      
      return true;
    } catch (err) {
      console.error('Failed to play audio with element:', err);
      return false;
    }
  });
  
  // Wrapper function to maintain API compatibility
  const playAudioWithElement = useCallback((url, dialogueId, dialogue) => {
    return playAudioWithElementRef.current(url, dialogueId, dialogue);
  }, []);

  // Play audio using Tone.js for analyzer and HTML5 Audio for sound on iOS
  // Create a stable reference with useRef
  const playAudioWithToneRef = useRef((url, dialogueId, dialogue) => {
    try {
      console.log('[iOS Hybrid] Starting playback for:', dialogueId);
      console.log('[iOS Hybrid] Audio URL:', url);
      
      // Create a hidden audio element specifically for iOS playback
      const iosAudioElement = document.createElement('audio');
      iosAudioElement.src = url;
      iosAudioElement.crossOrigin = 'anonymous';
      iosAudioElement.preload = 'auto';
      iosAudioElement.controls = false;
      iosAudioElement.playsinline = true;
      iosAudioElement.setAttribute('webkit-playsinline', 'true'); // Added webkit-playsinline
      iosAudioElement.style.display = 'none';
      document.body.appendChild(iosAudioElement);
      
      console.log('[iOS Hybrid] Created HTML5 Audio element for sound playback');
      
      // Make sure Tone.js is started (required for iOS)
      if (Tone.context.state !== 'running') {
        console.log('[iOS Hybrid] Starting Tone.js context');
        Tone.start();
      }
      
      // Wait for user interaction to ensure Tone.js context is running
      // Renamed from startTone as we no longer primarily use Tone here for iOS analysis
      const startPlaybackAndAnalysis = async () => {
        let iosSourceNode = null; // To store the source node for cleanup

        try {
          // Ensure AudioContext is running (Tone.start() also resumes the underlying context)
          if (audioContextRef.current && audioContextRef.current.state !== 'running') {
             await audioContextRef.current.resume();
             console.log('[iOS Web Audio] AudioContext resumed successfully');
          } else if (!audioContextRef.current) {
             console.error('[iOS Web Audio] AudioContext not available!');
             return; // Cannot proceed without context
          }

          // Ensure Web Audio API analyzer exists
          if (!analyzerRef.current) {
            analyzerRef.current = audioContextRef.current.createAnalyser();
            analyzerRef.current.fftSize = 256;
            analyzerRef.current.smoothingTimeConstant = 0.8;
            console.log('[iOS Web Audio] Created Web Audio analyzer');
          }

          // Create MediaElementSource from the iosAudioElement
          try {
            console.log('[iOS Web Audio] Creating MediaElementSource for iosAudioElement');
            iosSourceNode = audioContextRef.current.createMediaElementSource(iosAudioElement);
            
            // Connect source -> analyzer -> destination
            iosSourceNode.connect(analyzerRef.current);
            analyzerRef.current.connect(masterGainNodeRef.current); // Connect analyzer to gain node
            console.log('[iOS Web Audio] Connected iosAudioElement to analyzer');
            
          } catch (sourceErr) {
             // Handle potential "already connected" errors gracefully
             if (sourceErr.message && sourceErr.message.includes('already connected')) {
               console.log('[iOS Web Audio] iosAudioElement already connected to a node.');
               // Ensure analyzer is connected to destination anyway
               try {
                 analyzerRef.current.connect(masterGainNodeRef.current); // Connect analyzer to gain node
               } catch (connectErr) { /* Ignore */ }
             } else {
               throw sourceErr; // Re-throw other errors
             }
          }
          
          // Set current dialogue info
          setCurrentDialogue(dialogue);

          // Initial mute state is handled by the masterGainNodeRef, no need to set on element

          // --- MODIFICATION START: Prevent automatic play on iOS ---
          console.log('[iOS Web Audio] Setup complete. Audio loaded but NOT starting automatically.');
          // We will rely on user interaction (programmatic click or fallback button) to start playback.
          // Set state to indicate loading is done, but not playing yet.
          setIsPlaying(false); // Explicitly set to false initially
          setCurrentTrack(dialogueId); // Set track ID so fallback button condition might be met
          
          // Store details in case context wasn't running and needs pending playback later
          if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
             console.warn('[iOS Web Audio] Audio context not running during setup. Storing playback request.');
             setPendingPlayback({ url, dialogueId, dialogue, isTone: true });
             audioContextRef.current?.resume();
          }
          // --- MODIFICATION END ---

          // Set up stop handler for the HTML5 element
          iosAudioElement.onended = () => {
            console.log('[iOS Web Audio] HTML5 Audio ended');
            cleanup();
          };

          // Cleanup function
          const cleanup = () => {
            console.log('[iOS Web Audio] Cleanup:', dialogueId);
            setIsPlaying(false);
            setCurrentDialogue(null);

            // Disconnect the source node
            if (iosSourceNode) {
              try {
                iosSourceNode.disconnect();
                console.log('[iOS Web Audio] Disconnected source node');
              } catch (disconnectErr) {
                 console.error('[iOS Web Audio] Error disconnecting source node:', disconnectErr);
              }
            }
            
            // Remove the audio element
            if (iosAudioElement && iosAudioElement.parentNode) {
              iosAudioElement.parentNode.removeChild(iosAudioElement);
              console.log('[iOS Web Audio] Removed iosAudioElement');
            }
          };

          // Store the HTML5 element in audioRef for potential external control (if needed)
          // Note: This replaces the Tone.Player previously stored here
          audioRef.current = iosAudioElement;

        // End of the inner try block within startPlaybackAndAnalysis
        } catch (err) {
          // Catch errors during context/analyzer/source setup or playback initiation
          console.error('[iOS Web Audio] Error during setup or playback start:', err);
          // Attempt cleanup if iosAudioElement exists
          if (iosAudioElement && iosAudioElement.parentNode) {
             iosAudioElement.parentNode.removeChild(iosAudioElement);
          }
          // We might want to reset state here too if needed
          setIsPlaying(false);
          setCurrentDialogue(null);
        }
      }; // End of startPlaybackAndAnalysis function definition
      
      // Start Tone.js
      startPlaybackAndAnalysis(); // Call the renamed function
      
      return true;
    } catch (err) {
      console.error('[iOS Hybrid] Failed to play audio:', err);
      return false;
    }
  });
  
  // Wrapper function to maintain API compatibility
  const playAudioWithTone = useCallback((url, dialogueId, dialogue) => {
    return playAudioWithToneRef.current(url, dialogueId, dialogue);
  }, []);

  // Create a stable reference for the context state change handler
  const handleContextStateChangeRef = useRef((context, pendingPlayback) => {
    if (context.state === 'running' && pendingPlayback) {
      console.log('Audio context is running, attempting pending playback:', pendingPlayback.dialogueId || pendingPlayback.url);
      // Call the appropriate playback function based on the stored flag
      if (pendingPlayback.isTone) {
        playAudioWithToneRef.current(pendingPlayback.url, pendingPlayback.dialogueId, pendingPlayback.dialogue);
      } else {
        playAudioWithElementRef.current(pendingPlayback.url, pendingPlayback.dialogueId, pendingPlayback.dialogue);
      }
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

  
  // // Main function to play narration audio (Now handled by NarrativeReader calling playAudioFile)
  // const playNarration = useCallback(async (dialogueId) => {
  //   try {
  //     // Get dialogue data
  //     const dialogue = dialogueData[dialogueId];
  //     if (!dialogue) {
  //       console.warn(`Dialogue ID "${dialogueId}" not found`);
  //       return;
  //     }
  //
  //     console.log('Creating new audio instance for:', dialogueId);
  //
  //     // Always use local audio files to avoid CORS issues
  //     // const localUrl = getAudioUrl(`${dialogueId}.mp3`); // getAudioUrl is now commented out
  //     // console.log('Using local audio URL to avoid CORS:', localUrl);
  //
  //     // For iOS, ensure audio is unlocked before playing
  //     if (isIOS) {
  //       console.log('[iOS] Preparing for iOS playback');
  //
  //       // Play silent audio first to unlock iOS audio
  //       const playSilentAudio = () => {
  //         return new Promise((resolve) => {
  //           const silentAudio = document.getElementById('ios-audio-unlock');
  //           if (silentAudio) {
  //             console.log('[iOS] Playing silent audio to unlock iOS audio');
  //
  //             // Set up event handlers
  //             const onEnded = () => {
  //               console.log('[iOS] Silent audio ended, proceeding with actual audio');
  //               silentAudio.removeEventListener('ended', onEnded);
  //               silentAudio.removeEventListener('error', onError);
  //               resolve();
  //             };
  //
  //             const onError = (error) => {
  //               console.error('[iOS] Silent audio error, proceeding anyway', error);
  //               silentAudio.removeEventListener('ended', onEnded);
  //               silentAudio.removeEventListener('error', onError);
  //               resolve();
  //             };
  //
  //             // Add event listeners
  //             silentAudio.addEventListener('ended', onEnded);
  //             silentAudio.addEventListener('error', onError);
  //
  //             // Reset the audio element to ensure it can be played again
  //             silentAudio.currentTime = 0;
  //
  //             // Play the audio
  //             silentAudio.play()
  //               .then(() => {
  //                 console.log('[iOS] Silent audio playing');
  //               })
  //               .catch(err => {
  //                 console.error('[iOS] Failed to play silent audio:', err);
  //                 silentAudio.removeEventListener('ended', onEnded);
  //                 silentAudio.removeEventListener('error', onError);
  //                 resolve(); // Continue anyway
  //               });
  //
  //             // Set a timeout in case onended doesn't fire
  //             setTimeout(() => {
  //               console.log('[iOS] Silent audio timeout, proceeding anyway');
  //               silentAudio.removeEventListener('ended', onEnded);
  //               silentAudio.removeEventListener('error', onError);
  //               resolve();
  //             }, 500);
  //           } else {
  //             console.warn('[iOS] Silent audio element not found, proceeding anyway');
  //             resolve();
  //           }
  //         });
  //       };
  //
  //       // Play silent audio first, then the actual audio
  //       await playSilentAudio();
  //       console.log('[iOS] Using Tone.js for iOS playback');
  //       // playAudioWithTone(localUrl, dialogueId, dialogue); // Need to get URL differently now
  //     } else {
  //       // For non-iOS, continue using the existing approach
  //       console.log('[Desktop] Using standard Web Audio API');
  //       // Try to play using the audio element first
  //       // const elementSuccess = playAudioWithElement(localUrl, dialogueId, dialogue); // Need to get URL differently now
  //
  //       // If audio element fails, use Tone.js as fallback
  //       // if (!elementSuccess) {
  //       //   playAudioWithTone(localUrl, dialogueId, dialogue); // Need to get URL differently now
  //       // }
  //     }
  //   } catch (err) {
  //     console.error('Failed to set up narration:', err);
  //   }
  // }, [isIOS, playAudioWithElement, playAudioWithTone]);

  // Create a stable reference for playAudioFile
  const playAudioFileRef = useRef(async (filePath) => {
    if (!filePath) {
      return;
    }

    initAudioContext(); // Ensure context is initialized and try resuming if suspended
    let url;
    // Check if filePath is a data URI
    if (filePath.startsWith('data:audio/')) {
      url = filePath; // Use the data URI directly
    } else {
      url = `/${filePath}`; // Construct URL assuming filePath is relative to public root
    }

    // Placeholder info - might not be needed if playback functions don't rely on it
    const tempDialogueInfo = { speaker: '', text: '' };

    try {
      // --- Stop Previous Audio ---
      // Check the audioRef which might hold an iOS specific element from playAudioWithTone
      if (audioRef.current && typeof audioRef.current.pause === 'function' && !audioRef.current.paused) {
        audioRef.current.pause();
        // Check if it's the iOS specific element created by playAudioWithTone and remove it
        if (audioRef.current.id === 'ios-audio-playback-element' && audioRef.current.parentNode) {
             audioRef.current.parentNode.removeChild(audioRef.current);
        }
        audioRef.current = null; // Clear the ref
      }
      // Also check the main audioElementRef used for non-iOS and analysis
      if (audioElementRef.current && !audioElementRef.current.paused) {
         audioElementRef.current.pause();
         audioElementRef.current.src = ''; // Detach source
      }
      // Reset state *after* stopping
      setIsPlaying(false);
      setCurrentTrack(null);
      // Avoid clearing currentDialogue here, let the playback functions handle it
      // setCurrentDialogue(null);
      // --- End Stop Previous Audio ---


      // Determine playback method based on iOS or fallback logic
      const isIOSDevice = isIOS; // Capture current value to avoid closure issues
      if (isIOSDevice) {
        // playAudioWithTone creates its own element and connects analyzer
        playAudioWithToneRef.current(url, filePath, tempDialogueInfo); // Use filePath as ID
      } else {
        // playAudioWithElement uses audioElementRef and calls connectAnalyzerToAudio
        const elementSuccess = playAudioWithElementRef.current(url, filePath, tempDialogueInfo); // Use filePath as ID
        if (!elementSuccess) {
           // Fallback could be added here if needed
        }
      }
    } catch (err) {
      console.error(`[playAudioFile] Error playing file ${filePath}:`, err); // Keep error log
      // Reset state on error
      setIsPlaying(false);
      setCurrentTrack(null);
      setCurrentDialogue(null);
    }
  });
  
  // Wrapper function to maintain API compatibility
  const playAudioFile = useCallback((filePath) => {
    return playAudioFileRef.current(filePath);
  }, []); // No dependencies needed since we're using refs

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

      // Note: The plan suggested adding a touch listener here to play.
      // However, the play logic should remain within playAudioFile triggered
      // by the NarrativeReader after the initial gesture. Preloading just
      // ensures the audio is fetched and potentially decoded.
    }
  });

  // Wrapper function for preloadAudioFile
  const preloadAudioFile = useCallback((filePath) => {
    preloadAudioFileRef.current(filePath);
  }, []); // No dependencies needed since we're using refs

  
  // Function to stop playback
  const stopNarration = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
  // Function to handle end of narration
  const handleNarrationEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentDialogue(null);
  }, []);

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
  // Function to pause the currently playing audio
  // Function to pause the currently playing audio (useCallback removed)
  const pauseAudio = () => {
    // Select the correct audio element based on platform
    const currentAudio = isIOS ? audioRef.current : audioElementRef.current;
    if (currentAudio && typeof currentAudio.pause === 'function' && !currentAudio.paused) {
      try {
        currentAudio.pause();
        setIsPlaying(false); // Update state to reflect pause
        console.log('Audio paused via context function');
      } catch (err) {
        console.error('Error pausing audio:', err);
      }
    }
  };

  // Function to resume the currently paused audio
  // Function to resume the currently paused audio (useCallback removed)
  const resumeAudio = () => {
    // Select the correct audio element based on platform
    const currentAudio = isIOS ? audioRef.current : audioElementRef.current;
    
    console.log('[AudioContext] Attempting to resume audio:', {
      audioExists: !!currentAudio,
      isPaused: currentAudio?.paused,
      hasPlayMethod: typeof currentAudio?.play === 'function'
    });
    
    if (currentAudio && typeof currentAudio.play === 'function' && currentAudio.paused) {
      try {
        // Check if the audio context is suspended and resume it first
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            console.log('[AudioContext] AudioContext resumed, now playing audio');
            currentAudio.play()
              .then(() => {
                setIsPlaying(true);
                console.log('[AudioContext] Audio resumed successfully');
              })
              .catch(err => {
                console.error('[AudioContext] Error playing audio after context resume:', err);
              });
          }).catch(err => {
            console.error('[AudioContext] Error resuming audio context:', err);
          });
        } else {
          // Audio context is already running, play directly
          currentAudio.play()
            .then(() => {
              setIsPlaying(true);
              console.log('[AudioContext] Audio resumed successfully');
            })
            .catch(err => {
              console.error('[AudioContext] Error playing audio:', err);
            });
        }
      } catch (err) {
        console.error('[AudioContext] Error in resumeAudio:', err);
      }
    } else if (currentAudio && !currentAudio.paused) {
      console.log('[AudioContext] Audio is already playing, no need to resume');
    } else {
      console.warn('[AudioContext] Cannot resume audio: No valid audio element found or play method missing');
    }
  };

  // Functions to store and restore audio state for data perception toggle
  const storeAudioStateBeforeToggle = useCallback(() => {
    // Store current audio state
    const currentAudio = isIOS ? audioRef.current : audioElementRef.current;
    if (currentAudio) {
      setWasPlayingBeforeToggle(isPlaying);
      setAudioPositionBeforeToggle(currentAudio.currentTime || 0);
      console.log('[AudioContext] Stored audio state:', {
        wasPlaying: isPlaying,
        position: currentAudio.currentTime || 0
      });
    }
  }, [isPlaying, isIOS]);

  const restoreAudioStateAfterToggle = useCallback(() => {
    // Restore audio state
    const currentAudio = isIOS ? audioRef.current : audioElementRef.current;
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
  }, [wasPlayingBeforeToggle, audioPositionBeforeToggle, isIOS, resumeAudio]);


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
    playAudioFile, // Expose new function
    pauseAudio, // Expose pause function
    resumeAudio: resumeAudio, // Expose resume function
    storeAudioStateBeforeToggle: storeAudioStateBeforeToggle, // Expose new function
    restoreAudioStateAfterToggle: restoreAudioStateAfterToggle // Expose new function
  };

  return (
    <AudioContext.Provider value={providerValue}>
      {children}
    </AudioContext.Provider>
  );
}
