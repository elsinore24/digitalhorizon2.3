import { createContext, useState, useRef, useCallback, useEffect } from 'react'
import dialogueData from '../data/dialogue.json'
import * as Tone from 'tone'

export const AudioContext = createContext(null)

// Modified to always return local URL to avoid CORS issues
const getAudioUrl = (filename) => {
  // Always use local audio files to avoid CORS issues
  return `/audio/narration/${filename}`
}

export function AudioProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [currentDialogue, setCurrentDialogue] = useState(null)
  const audioRef = useRef(null)
  const [isIOS, setIsIOS] = useState(false)

  // Audio-related refs
  const audioContextRef = useRef(null)
  const audioElementRef = useRef(null)
  const analyzerRef = useRef(null)
  const mediaStreamSourceRef = useRef(null)
  const [audioInitialized, setAudioInitialized] = useState(false)
  
  // Check if we're on iOS
  useEffect(() => {
    const iOSDetected = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(iOSDetected)
    console.log('iOS device detected:', iOSDetected)
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
        
        // Resume the context if it's suspended
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume()
            .then(() => console.log('Audio context resumed during initialization'))
            .catch(err => console.error('Failed to resume audio context:', err));
        }
      } catch (err) {
        console.error('Failed to create audio context:', err);
      }
    }
  }, []);
  
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
  
  // Connect analyzer to audio element
  const connectAnalyzerToAudio = useCallback(() => {
    if (!audioElementRef.current || !audioContextRef.current) return;
    
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
        mediaStreamSourceRef.current = audioContextRef.current.createMediaElementSource(audioElementRef.current);
        console.log('Created new media element source');
        
        // Connect the media source to the analyzer and destination
        mediaStreamSourceRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContextRef.current.destination);
        console.log('Audio analyzer connected successfully');
      } catch (sourceErr) {
        // If we get an error about the element already being connected, that's actually okay
        if (sourceErr.message && sourceErr.message.includes('already connected')) {
          console.log('Audio element already connected to a node, which is fine');
          
          // Make sure analyzer is connected to destination
          try {
            analyzerRef.current.connect(audioContextRef.current.destination);
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
              const unlockAudio = () => {
                const silentAudio = document.getElementById('ios-audio-unlock');
                if (silentAudio) {
                  console.log('[iOS Audio Unlock] Playing silent audio to unlock iOS audio');
                  
                  // Try to play the silent audio
                  try {
                    silentAudio.play()
                      .then(() => {
                        console.log('[iOS Audio Unlock] Silent audio played successfully');
                        setAudioInitialized(true);
                        setIOSAudioUnlocked(true);
                        
                        // Also play a short oscillator sound to ensure Web Audio API is unlocked
                        const oscillator = audioContextRef.current.createOscillator();
                        oscillator.frequency.value = 1;
                        oscillator.connect(audioContextRef.current.destination);
                        oscillator.start(0);
                        oscillator.stop(0.001);
                        
                        console.log('[iOS Audio Unlock] iOS audio initialized');
                      })
                      .catch(err => {
                        console.error('[iOS Audio Unlock] Failed to play silent audio:', err);
                        
                        // Fall back to oscillator method
                        console.log('[iOS Audio Unlock] Falling back to oscillator method');
                        tryOscillatorUnlock();
                      });
                  } catch (e) {
                    console.error('[iOS Audio Unlock] Exception playing silent audio:', e);
                    // Fall back to oscillator method
                    tryOscillatorUnlock();
                  }
                } else {
                  console.error('[iOS Audio Unlock] Silent audio element not found');
                  
                  // Fall back to oscillator method
                  tryOscillatorUnlock();
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
  }, [isIOS]);

  // Play audio using HTML5 Audio element
  const playAudioWithElement = useCallback((url, dialogueId, dialogue) => {
    if (!audioElementRef.current) return false;
    
    try {
      audioElementRef.current.src = url;
      audioElementRef.current.onloadeddata = () => {
        console.log('Audio loaded:', dialogueId);
        setCurrentDialogue(dialogue);
        
        // Connect analyzer to the audio element
        connectAnalyzerToAudio();
        
        // Play the audio
        audioElementRef.current.play()
          .then(() => {
            console.log('Audio playing:', dialogueId);
            setIsPlaying(true);
            setCurrentTrack(dialogueId);
          })
          .catch(err => {
            console.error('Error playing audio:', err);
            return false;
          });
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
  }, [connectAnalyzerToAudio]);

  // Play audio using Tone.js for analyzer and HTML5 Audio for sound on iOS
  const playAudioWithTone = useCallback((url, dialogueId, dialogue) => {
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
            analyzerRef.current.connect(audioContextRef.current.destination);
            console.log('[iOS Web Audio] Connected iosAudioElement to analyzer');
            
          } catch (sourceErr) {
             // Handle potential "already connected" errors gracefully
             if (sourceErr.message && sourceErr.message.includes('already connected')) {
               console.log('[iOS Web Audio] iosAudioElement already connected to a node.');
               // Ensure analyzer is connected to destination anyway
               try {
                 analyzerRef.current.connect(audioContextRef.current.destination);
               } catch (connectErr) { /* Ignore */ }
             } else {
               throw sourceErr; // Re-throw other errors
             }
          }
          
          // Set current dialogue info
          setCurrentDialogue(dialogue);

          // Start HTML5 Audio playback
          console.log('[iOS Web Audio] Starting HTML5 Audio playback');
          iosAudioElement.play()
            .then(() => {
              console.log('[iOS Web Audio] HTML5 Audio playing successfully');
              setIsPlaying(true);
              setCurrentTrack(dialogueId);
            })
            .catch(err => {
              console.error('[iOS Web Audio] HTML5 Audio play error:', err);
              // Attempt cleanup even on play error
              cleanup();
            });

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
  }, []);
  
  // Main function to play narration audio
  const playNarration = useCallback(async (dialogueId) => {
    try {
      // Get dialogue data
      const dialogue = dialogueData[dialogueId];
      if (!dialogue) {
        console.warn(`Dialogue ID "${dialogueId}" not found`);
        return;
      }

      console.log('Creating new audio instance for:', dialogueId);
      
      // Always use local audio files to avoid CORS issues
      const localUrl = getAudioUrl(`${dialogueId}.mp3`);
      console.log('Using local audio URL to avoid CORS:', localUrl);

      // For iOS, ensure audio is unlocked before playing
      if (isIOS) {
        console.log('[iOS] Preparing for iOS playback');
        
        // Play silent audio first to unlock iOS audio
        const playSilentAudio = () => {
          return new Promise((resolve) => {
            const silentAudio = document.getElementById('ios-audio-unlock');
            if (silentAudio) {
              console.log('[iOS] Playing silent audio to unlock iOS audio');
              
              // Set up event handlers
              const onEnded = () => {
                console.log('[iOS] Silent audio ended, proceeding with actual audio');
                silentAudio.removeEventListener('ended', onEnded);
                silentAudio.removeEventListener('error', onError);
                resolve();
              };
              
              const onError = (error) => {
                console.error('[iOS] Silent audio error, proceeding anyway', error);
                silentAudio.removeEventListener('ended', onEnded);
                silentAudio.removeEventListener('error', onError);
                resolve();
              };
              
              // Add event listeners
              silentAudio.addEventListener('ended', onEnded);
              silentAudio.addEventListener('error', onError);
              
              // Reset the audio element to ensure it can be played again
              silentAudio.currentTime = 0;
              
              // Play the audio
              silentAudio.play()
                .then(() => {
                  console.log('[iOS] Silent audio playing');
                })
                .catch(err => {
                  console.error('[iOS] Failed to play silent audio:', err);
                  silentAudio.removeEventListener('ended', onEnded);
                  silentAudio.removeEventListener('error', onError);
                  resolve(); // Continue anyway
                });
              
              // Set a timeout in case onended doesn't fire
              setTimeout(() => {
                console.log('[iOS] Silent audio timeout, proceeding anyway');
                silentAudio.removeEventListener('ended', onEnded);
                silentAudio.removeEventListener('error', onError);
                resolve();
              }, 500);
            } else {
              console.warn('[iOS] Silent audio element not found, proceeding anyway');
              resolve();
            }
          });
        };
        
        // Play silent audio first, then the actual audio
        await playSilentAudio();
        console.log('[iOS] Using Tone.js for iOS playback');
        playAudioWithTone(localUrl, dialogueId, dialogue);
      } else {
        // For non-iOS, continue using the existing approach
        console.log('[Desktop] Using standard Web Audio API');
        // Try to play using the audio element first
        const elementSuccess = playAudioWithElement(localUrl, dialogueId, dialogue);
        
        // If audio element fails, use Tone.js as fallback
        if (!elementSuccess) {
          playAudioWithTone(localUrl, dialogueId, dialogue);
        }
      }
    } catch (err) {
      console.error('Failed to set up narration:', err);
    }
  }, [isIOS, playAudioWithElement, playAudioWithTone]);
  
  // Function to stop playback
  const stopNarration = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
  // Function to handle end of narration
  const handleNarrationEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentDialogue(null);
  }, []);

  return (
    <AudioContext.Provider value={{
      playNarration,
      stopNarration,
      handleNarrationEnd,
      getAudioInstance,
      getAnalyzerData,
      isPlaying,
      currentTrack,
      currentDialogue,
      isIOS,
      analyzer: analyzerRef.current
    }}>
      {children}
    </AudioContext.Provider>
  );
}
