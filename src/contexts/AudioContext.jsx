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
      return analyzerRef.current.getValue();
    }
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
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context created successfully');
      } catch (err) {
        console.error('Failed to create audio context:', err);
      }
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
      }
      
      // Create media stream source if it doesn't exist
      if (!mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current = audioContextRef.current.createMediaElementSource(audioElementRef.current);
        mediaStreamSourceRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContextRef.current.destination);
      }
      
      console.log('Audio analyzer connected successfully');
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
        audioElement.muted = false;
        audioElement.autoplay = false;
      }
      
      document.body.appendChild(audioElement);
      audioElementRef.current = audioElement;
      
      // Create a silent audio element specifically for iOS audio unlock
      if (isIOS) {
        console.log('[iOS Audio Unlock] Creating silent audio element')
        const silentAudio = document.createElement('audio')
        silentAudio.id = 'ios-audio-unlock'
        silentAudio.src = '/audio/utils/silent.mp3'
        silentAudio.loop = false
        silentAudio.preload = 'auto'
        silentAudio.playsinline = true
        silentAudio.muted = false
        silentAudio.style.display = 'none'
        document.body.appendChild(silentAudio)
      }
      
      // Resume audio context on user interaction (required by browsers)
      const resumeAudioContext = () => {
        console.log('User interaction detected, resuming audio context')
        
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            console.log('AudioContext resumed successfully')
            
            // For iOS, we need to unlock audio capabilities
            if (isIOS && !audioInitialized) {
              console.log('[iOS Audio Unlock] Initializing audio on iOS')
              
              // Play the silent audio to unlock iOS audio
              const unlockAudio = () => {
                const silentAudio = document.getElementById('ios-audio-unlock')
                if (silentAudio) {
                  console.log('[iOS Audio Unlock] Playing silent audio to unlock iOS audio')
                  
                  // Play the silent audio
                silentAudio.play()
                    .then(() => {
                      console.log('[iOS Audio Unlock] Silent audio played successfully')
                      setAudioInitialized(true)
                      setIOSAudioUnlocked(true)
                      
                      // Also play a short oscillator sound to ensure Web Audio API is unlocked
                      const oscillator = audioContextRef.current.createOscillator()
                      oscillator.frequency.value = 1
                      oscillator.connect(audioContextRef.current.destination)
                      oscillator.start(0)
                      oscillator.stop(0.001)
                      
                      console.log('[iOS Audio Unlock] iOS audio initialized')
                    })
                    .catch(err => {
                      console.error('[iOS Audio Unlock] Failed to play silent audio:', err)
                      
                      // Fall back to oscillator method
                      console.log('[iOS Audio Unlock] Falling back to oscillator method')
                      const oscillator = audioContextRef.current.createOscillator()
                      oscillator.frequency.value = 1
                      oscillator.connect(audioContextRef.current.destination)
                      oscillator.start(0)
                      oscillator.stop(0.001)
                      setAudioInitialized(true)
                    })
                } else {
                  console.error('[iOS Audio Unlock] Silent audio element not found')
                  
                  // Fall back to oscillator method
                  const oscillator = audioContextRef.current.createOscillator()
                  oscillator.frequency.value = 1
                  oscillator.connect(audioContextRef.current.destination)
                  oscillator.start(0)
                  oscillator.stop(0.001)
                  setAudioInitialized(true)
                  console.log('[iOS Audio Unlock] iOS audio initialized with oscillator')
                }
              }
              
              unlockAudio()
            }
          }).catch(err => {
            console.error('Failed to resume AudioContext:', err)
          })
        }
      }
      
      document.addEventListener('click', resumeAudioContext)
      document.addEventListener('touchstart', resumeAudioContext)
      document.addEventListener('keydown', resumeAudioContext)
    }
    
    return () => {
      // Clean up
      if (mediaStreamSourceRef.current) {
        try {
          mediaStreamSourceRef.current.disconnect()
        } catch (e) {
          // Ignore disconnection errors
        }
      }
      
      if (audioElementRef.current && audioElementRef.current.parentNode) {
        audioElementRef.current.parentNode.removeChild(audioElementRef.current)
      }
      
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }, [])

  // Play audio using HTML5 Audio element
  const playAudioWithElement = useCallback((url, dialogueId, dialogue) => {
    if (!audioElementRef.current) return false
    
    try {
      audioElementRef.current.src = url
      audioElementRef.current.onloadeddata = () => {
        console.log('Audio loaded:', dialogueId)
        setCurrentDialogue(dialogue)
        
        // Connect analyzer to the audio element
        connectAnalyzerToAudio()
        
        // Play the audio
        audioElementRef.current.play()
          .then(() => {
            console.log('Audio playing:', dialogueId)
            setIsPlaying(true)
            setCurrentTrack(dialogueId)
          })
          .catch(err => {
            console.error('Error playing audio:', err)
            return false
          })
      }
      
      audioElementRef.current.onended = () => {
        console.log('Audio ended:', dialogueId)
        setIsPlaying(false)
        setCurrentDialogue(null)
      }
      
      audioElementRef.current.onerror = (err) => {
        console.error('Audio error:', err)
        return false
      }
      
      return true
    } catch (err) {
      console.error('Failed to play audio with element:', err)
      return false
    }
  }, [])

  // Play audio using Tone.js for analyzer and HTML5 Audio for sound on iOS
  const playAudioWithTone = useCallback((url, dialogueId, dialogue) => {
    try {
      console.log('[iOS Hybrid] Starting playback for:', dialogueId)
      console.log('[iOS Hybrid] Audio URL:', url)
      
      // Create a hidden audio element specifically for iOS playback
      const iosAudioElement = document.createElement('audio')
      iosAudioElement.src = url
      iosAudioElement.crossOrigin = 'anonymous'
      iosAudioElement.preload = 'auto'
      iosAudioElement.controls = false
      iosAudioElement.playsinline = true
      iosAudioElement.style.display = 'none'
      document.body.appendChild(iosAudioElement)
      
      console.log('[iOS Hybrid] Created HTML5 Audio element for sound playback')
      
      // Make sure Tone.js is started (required for iOS)
      if (Tone.context.state !== 'running') {
        console.log('[iOS Hybrid] Starting Tone.js context')
        Tone.start()
      }
      
      // Wait for user interaction to ensure Tone.js context is running
      const startTone = async () => {
        try {
          // Ensure Tone.js context is running
          await Tone.start()
          console.log('[iOS Hybrid] Tone.js context started successfully')
          
          // Create a player directly with URL (for analyzer only)
          console.log('[iOS Hybrid] Creating Tone.js player with URL:', url)
          const player = new Tone.Player({
            url: url,
            autostart: false,
            loop: false,
            volume: -100, // Set volume to minimum since we're using HTML5 Audio for sound
            onload: () => {
              console.log('[iOS Hybrid] Tone.js player loaded successfully')
              setCurrentDialogue(dialogue)
              
              // Create an analyzer with default settings
              console.log('[iOS Hybrid] Creating analyzer')
              const toneAnalyzer = new Tone.Analyser('fft', 256)
              
              // Connect the player to the analyzer
              console.log('[iOS Hybrid] Connecting player to analyzer')
              player.connect(toneAnalyzer)
              
              // Store the analyzer in our ref
              analyzerRef.current = toneAnalyzer
              
              // Log analyzer state before playback
              console.log('[iOS Hybrid] Analyzer created, initial values:', toneAnalyzer.getValue().slice(0, 5))
              
              // Start HTML5 Audio playback
              console.log('[iOS Hybrid] Starting HTML5 Audio playback')
              iosAudioElement.play()
                .then(() => {
                  console.log('[iOS Hybrid] HTML5 Audio playing successfully')
                  
                  // Start Tone.js player for analyzer data
                  player.start()
                  console.log('[iOS Hybrid] Tone.js player started for analyzer data')
                  
                  setIsPlaying(true)
                  setCurrentTrack(dialogueId)
                })
                .catch(err => {
                  console.error('[iOS Hybrid] HTML5 Audio play error:', err)
                  // Try to play Tone.js with sound as fallback
                  console.log('[iOS Hybrid] Falling back to Tone.js for sound')
                  player.volume.value = 0 // Reset volume
                  player.start()
                  setIsPlaying(true)
                  setCurrentTrack(dialogueId)
                })
              
              // Set up stop handlers
              iosAudioElement.onended = () => {
                console.log('[iOS Hybrid] HTML5 Audio ended')
                player.stop()
                cleanup()
              }
              
              player.onstop = () => {
                console.log('[iOS Hybrid] Tone.js player stopped')
                if (iosAudioElement.paused || iosAudioElement.ended) {
                  cleanup()
                } else {
                  iosAudioElement.pause()
                  cleanup()
                }
              }
              
              // Cleanup function
              const cleanup = () => {
                console.log('[iOS Hybrid] Audio ended:', dialogueId)
                setIsPlaying(false)
                setCurrentDialogue(null)
                
                // Remove the audio element
                if (iosAudioElement && iosAudioElement.parentNode) {
                  iosAudioElement.parentNode.removeChild(iosAudioElement)
                }
              }
              
              // Store the player
              audioRef.current = player
            },
            onerror: (err) => {
              console.error('[iOS Hybrid] Tone.js player error:', err)
              // Try HTML5 Audio alone
              console.log('[iOS Hybrid] Trying HTML5 Audio alone')
              iosAudioElement.play()
                .then(() => {
                  console.log('[iOS Hybrid] HTML5 Audio playing successfully')
                  setIsPlaying(true)
                  setCurrentTrack(dialogueId)
                })
                .catch(audioErr => {
                  console.error('[iOS Hybrid] HTML5 Audio play error:', audioErr)
                  // Clean up
                  if (iosAudioElement && iosAudioElement.parentNode) {
                    iosAudioElement.parentNode.removeChild(iosAudioElement)
                  }
                })
            }
          })
        } catch (err) {
          console.error('[iOS Hybrid] Error starting Tone.js:', err)
          // Try HTML5 Audio alone
          console.log('[iOS Hybrid] Trying HTML5 Audio alone after Tone.js error')
          iosAudioElement.play()
            .then(() => {
              console.log('[iOS Hybrid] HTML5 Audio playing successfully')
              setIsPlaying(true)
              setCurrentTrack(dialogueId)
            })
            .catch(audioErr => {
              console.error('[iOS Hybrid] HTML5 Audio play error:', audioErr)
              // Clean up
              if (iosAudioElement && iosAudioElement.parentNode) {
                iosAudioElement.parentNode.removeChild(iosAudioElement)
              }
            })
        }
      }
      
      // Start Tone.js
      startTone()
      
      return true
    } catch (err) {
      console.error('[iOS Hybrid] Failed to play audio:', err)
      return false
    }
  }, [])
  
  // Main function to play narration audio
  const playNarration = useCallback(async (dialogueId) => {
    try {
      // Get dialogue data
      const dialogue = dialogueData[dialogueId]
      if (!dialogue) {
        console.warn(`Dialogue ID "${dialogueId}" not found`)
        return
      }

      console.log('Creating new audio instance for:', dialogueId)
      
      // Always use local audio files to avoid CORS issues
      const localUrl = getAudioUrl(`${dialogueId}.mp3`)
      console.log('Using local audio URL to avoid CORS:', localUrl)

      // For iOS, ensure audio is unlocked before playing
      if (isIOS) {
        console.log('[iOS] Preparing for iOS playback')
        
        // Play silent audio first to unlock iOS audio
        const playSilentAudio = () => {
          return new Promise((resolve) => {
            const silentAudio = document.getElementById('ios-audio-unlock')
            if (silentAudio) {
              console.log('[iOS] Playing silent audio to unlock iOS audio')
              
              // Clone the silent audio element to ensure it can be played again
              const silentClone = silentAudio.cloneNode(true)
              silentClone.onended = () => {
                console.log('[iOS] Silent audio ended, proceeding with actual audio')
                document.body.removeChild(silentClone)
                resolve()
              }
              
              silentClone.onerror = () => {
                console.error('[iOS] Silent audio error, proceeding anyway')
                if (silentClone.parentNode) {
                  document.body.removeChild(silentClone)
                }
                resolve()
              }
              
              // Add to DOM and play
              document.body.appendChild(silentClone)
              
              silentClone.play()
                .then(() => {
                  console.log('[iOS] Silent audio playing')
                })
                .catch(err => {
                  console.error('[iOS] Failed to play silent audio:', err)
                  if (silentClone.parentNode) {
                    document.body.removeChild(silentClone)
                  }
                  resolve() // Continue anyway
                })
              
              // Set a timeout in case onended doesn't fire
              setTimeout(() => {
                console.log('[iOS] Silent audio timeout, proceeding anyway')
                if (silentClone.parentNode) {
                  document.body.removeChild(silentClone)
                }
                resolve()
              }, 500)
            } else {
              console.warn('[iOS] Silent audio element not found, proceeding anyway')
              resolve()
            }
          })
        }
        
        // Play silent audio first, then the actual audio
        await playSilentAudio()
        console.log('[iOS] Using Tone.js for iOS playback')
        playAudioWithTone(localUrl, dialogueId, dialogue)
      } else {
        // For non-iOS, continue using the existing approach
        console.log('[Desktop] Using standard Web Audio API')
        // Try to play using the audio element first
        const elementSuccess = playAudioWithElement(localUrl, dialogueId, dialogue)
        
        // If audio element fails, use Tone.js as fallback
        if (!elementSuccess) {
          playAudioWithTone(localUrl, dialogueId, dialogue)
        }
      }
    } catch (err) {
      console.error('Failed to set up narration:', err)
    }
  }, [])
  
  // Function to stop playback
  const stopNarration = useCallback(() => {
    setIsPlaying(false)
  }, [])
  
  // Function to handle end of narration
  const handleNarrationEnd = useCallback(() => {
    setIsPlaying(false)
    setCurrentDialogue(null)
  }, [])

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
  )
}
