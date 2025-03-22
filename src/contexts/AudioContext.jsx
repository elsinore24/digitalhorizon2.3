import { createContext, useState, useRef, useCallback, useEffect } from 'react'
import { Howl, Howler } from 'howler'
import * as Tone from 'tone'
import dialogueData from '../data/dialogue.json'
import { supabase } from '../config/supabase'

export const AudioContext = createContext(null)

// Create our own Web Audio API context and analyzer
let audioContext = null
let analyzer = null
let mediaStreamSource = null
let audioElement = null
let audioStream = null
let isIOS = false

// Initialize Web Audio API context with direct audio capture
const initAudioContext = () => {
  if (!analyzer) {
    try {
      // Check if we're on iOS
      isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
      console.log('iOS device detected:', isIOS)
      
      // Create our own audio context
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Create analyzer node
      analyzer = audioContext.createAnalyser()
      analyzer.fftSize = 256
      analyzer.smoothingTimeConstant = 0.8
      
      console.log('Successfully created audio analyzer')
      
      // We'll connect the analyzer to the audio source when audio starts playing
    } catch (err) {
      console.error('Error initializing audio analyzer:', err)
      analyzer = null
    }
  }
  return { analyzer }
}

// Function to connect analyzer to audio output
const connectAnalyzerToAudio = () => {
  if (!analyzer || !audioContext) return false
  
  try {
    // Create a MediaElementAudioSourceNode if we have an audio element
    if (audioElement) {
      // Disconnect any existing connections
      if (mediaStreamSource) {
        try {
          mediaStreamSource.disconnect()
        } catch (e) {
          // Ignore disconnection errors
        }
      }
      
      // Create a new source from the audio element
      try {
        mediaStreamSource = audioContext.createMediaElementSource(audioElement)
        
        // Connect the source to the analyzer and then to the destination
        mediaStreamSource.connect(analyzer)
        analyzer.connect(audioContext.destination)
        
        console.log('Directly connected analyzer to audio element')
        return true
      } catch (err) {
        console.error('Error creating media element source:', err)
        
        // On iOS, we might not be able to connect the analyzer
        // In this case, we'll just use the audio element directly
        if (isIOS) {
          console.log('iOS detected, using audio element without analyzer')
          return true
        }
        return false
      }
    }
    
    return false
  } catch (err) {
    console.error('Error connecting analyzer to audio:', err)
    return false
  }
}

const AUDIO_BUCKET = 'narration-audio'

// Modified to always return local URL to avoid CORS issues
const getAudioUrl = (filename) => {
  // Always use local audio files to avoid CORS issues
  return `/audio/narration/${filename}`
}

export function AudioProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [currentDialogue, setCurrentDialogue] = useState(null)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const audioRef = useRef(null)

  const getAudioInstance = useCallback(() => {
    return audioRef.current
  }, [])

  // Initialize the audio context when the component mounts
  useEffect(() => {
    // Initialize audio context
    initAudioContext()
    
    // Set up audio element for capturing
    if (typeof window !== 'undefined') {
      // Check if we're on iOS
      isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
      console.log('iOS device detected:', isIOS)
      
      // Create a hidden audio element for capturing
      audioElement = document.createElement('audio')
      audioElement.id = 'audio-visualizer-source'
      audioElement.crossOrigin = 'anonymous' // Add this to help with CORS
      audioElement.style.display = 'none'
      audioElement.preload = 'auto'
      
      // For iOS Safari, we need to set these attributes
      if (isIOS) {
        audioElement.controls = true
        audioElement.playsinline = true
        audioElement.muted = false
        audioElement.autoplay = false
      }
      
      document.body.appendChild(audioElement)
      
      // Resume audio context on user interaction (required by browsers)
      const resumeAudioContext = () => {
        console.log('User interaction detected, resuming audio context')
        
        if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            console.log('AudioContext resumed successfully')
            
            // For iOS, we need to unlock audio capabilities
            if (isIOS && !audioInitialized) {
              console.log('Initializing audio on iOS')
              
              // Play a short silent sound to unlock audio
              const unlockAudio = () => {
                const oscillator = audioContext.createOscillator()
                oscillator.frequency.value = 1
                oscillator.connect(audioContext.destination)
                oscillator.start(0)
                oscillator.stop(0.001)
                setAudioInitialized(true)
                console.log('iOS audio initialized')
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
      if (mediaStreamSource) {
        try {
          mediaStreamSource.disconnect()
        } catch (e) {
          // Ignore disconnection errors
        }
      }
      
      if (audioElement && audioElement.parentNode) {
        audioElement.parentNode.removeChild(audioElement)
      }
      
      if (audioContext) {
        try {
          audioContext.close()
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }, [])

  // Play audio using HTML5 Audio element
  const playAudioWithElement = useCallback((url, dialogueId, dialogue) => {
    if (!audioElement) return false
    
    try {
      audioElement.src = url
      audioElement.onloadeddata = () => {
        console.log('Audio loaded:', dialogueId)
        setCurrentDialogue(dialogue)
        
        // Connect analyzer to the audio element
        connectAnalyzerToAudio()
        
        // Play the audio
        audioElement.play()
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
      
      audioElement.onended = () => {
        console.log('Audio ended:', dialogueId)
        setIsPlaying(false)
        setCurrentDialogue(null)
      }
      
      audioElement.onerror = (err) => {
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
              
              // Store the analyzer in our global analyzer variable
              analyzer = toneAnalyzer
              
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
  
  // Play audio using Howler as fallback
  const playAudioWithHowler = useCallback((url, dialogueId, dialogue) => {
    try {
      // Special configuration for iOS
      const howlerOptions = {
        src: [url],
        html5: true, // Force HTML5 Audio for better iOS compatibility
        preload: true,
        format: ['mp3'],
        onload: () => {
          console.log('Audio loaded (Howler):', dialogueId)
          setCurrentDialogue(dialogue)
          
          // For iOS, we need to ensure the audio context is resumed
          if (isIOS && audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
              console.log('AudioContext resumed on load')
            }).catch(err => {
              console.error('Failed to resume AudioContext on load:', err)
            })
          }
        },
        onplay: () => {
          console.log('Audio playing (Howler):', dialogueId)
          
          // Set playing state with a slight delay to ensure it's registered
          // This helps with iOS detection issues
          setTimeout(() => {
            setIsPlaying(true)
            setCurrentTrack(dialogueId)
            console.log('Set isPlaying to true')
            
            // Force a state update to trigger visualizer
            if (isIOS) {
              // Create a small oscillation to ensure audio context is active
              try {
                if (audioContext && audioContext.state === 'suspended') {
                  audioContext.resume().then(() => {
                    console.log('AudioContext resumed on play')
                  })
                }
              } catch (err) {
                console.error('Error resuming audio context:', err)
              }
            }
          }, 100)
        },
        onend: () => {
          console.log('Audio ended (Howler):', dialogueId)
          
          // Clear playing state with a slight delay to ensure proper cleanup
          setTimeout(() => {
            setIsPlaying(false)
            setCurrentDialogue(null)
            console.log('Set isPlaying to false')
          }, 100)
        },
        onloaderror: (id, err) => {
          console.error('Audio load error (Howler):', dialogueId, err)
        },
        onplayerror: (id, err) => {
          console.error('Audio play error (Howler):', dialogueId, err)
          
          // On iOS, try to recover from play errors
          if (isIOS) {
            console.log('Attempting to recover from iOS play error')
            
            // Force unlock audio context
            if (audioContext && audioContext.state === 'suspended') {
              audioContext.resume().then(() => {
                console.log('Retrying audio playback after resume')
                
                // Try playing again
                const audio = new Howl(howlerOptions)
                audio.play()
                audioRef.current = audio
              })
            }
          }
        }
      }

      const audio = new Howl(howlerOptions)
      audio.play()
      audioRef.current = audio
      return true
    } catch (err) {
      console.error('Failed to play audio with Howler:', err)
      return false
    }
  }, [])

  const playNarration = useCallback(async (dialogueId) => {
    try {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
      }
      
      if (audioRef.current) {
        if (typeof audioRef.current.stop === 'function') {
          audioRef.current.stop()
        } else if (typeof audioRef.current.dispose === 'function') {
          // Tone.js players need to be disposed
          audioRef.current.dispose()
        }
      }

      const dialogue = dialogueData[dialogueId]
      if (!dialogue) {
        console.warn(`Dialogue ID "${dialogueId}" not found`)
        return
      }

      console.log('Creating new audio instance for:', dialogueId)
      
      // Always use local audio files to avoid CORS issues
      const localUrl = getAudioUrl(`${dialogueId}.mp3`)
      console.log('Using local audio URL to avoid CORS:', localUrl)

      // For iOS, use Tone.js which has better iOS compatibility and analyzer support
      if (isIOS) {
        console.log('[iOS] Using Tone.js exclusively for iOS playback')
        playAudioWithTone(localUrl, dialogueId, dialogue)
      } else {
        // For non-iOS, continue using the existing approach
        console.log('[Desktop] Using standard Web Audio API')
        // Try to play using the audio element first
        const elementSuccess = playAudioWithElement(localUrl, dialogueId, dialogue)
        
        // If audio element fails, fall back to Howler
        if (!elementSuccess) {
          playAudioWithHowler(localUrl, dialogueId, dialogue)
        }
      }
    } catch (err) {
      console.error('Failed to play audio:', err)
    }
  }, [playAudioWithElement, playAudioWithHowler, playAudioWithTone])
  
  // Function to get analyzer data for visualizer
  const getAnalyzerData = useCallback(() => {
    if (!analyzer) return null
    
    try {
      let dataArray, bufferLength
      
      // Check if we're using a Tone.js analyzer (for iOS)
      if (analyzer.getValue && typeof analyzer.getValue === 'function') {
        // This is a Tone.js analyzer
        console.log('[iOS Tone.js Analyzer] Getting data from Tone.js analyzer')
        
        // Get the FFT data from Tone.js analyzer
        const values = analyzer.getValue()
        
        // Log the first few values to debug
        console.log('[iOS Tone.js Analyzer] Raw analyzer values (first 5):', values.slice(0, 5))
        
        // Convert to Uint8Array for compatibility with visualizer
        bufferLength = values.length
        dataArray = new Uint8Array(bufferLength)
        
        // Tone.js returns values in range -100 to 0 (dB), convert to 0-255 range
        // But we need to handle the case where there's no sound
        let hasSound = false
        let maxValue = -100
        
        // Log the full analyzer values for debugging (first 20 values)
        if (isIOS) {
          console.log('[iOS Tone.js Analyzer] Full analyzer values (first 20):', 
            Array.from(values.slice(0, 20)).map(v => v.toFixed(2)).join(', '));
        }
        
        for (let i = 0; i < bufferLength; i++) {
          // Track the maximum value for debugging
          if (values[i] > maxValue) {
            maxValue = values[i]
          }
          
          // Check if there's any significant audio data
          if (values[i] > -95) { // -95dB is a lower threshold to capture quieter sounds
            hasSound = true
          }
        }
        
        console.log('[iOS Tone.js Analyzer] Max analyzer value:', maxValue.toFixed(2), 'Has sound:', hasSound)
        
        if (hasSound) {
          // Implement a fixed noise gate threshold for background noise
          // Based on observed values, background noise is typically around -80 to -90 dB
          // Set a threshold that balances filtering noise while preserving real audio
          const noiseGateThreshold = -70; // Only allow signals stronger than -70dB
          
          console.log('[iOS Tone.js Analyzer] Using fixed noise gate threshold:', noiseGateThreshold, 'dB');
          
          for (let i = 0; i < bufferLength; i++) {
            // Apply noise gate - if value is below threshold, set to minimum (-100dB)
            const gatedValue = values[i] > noiseGateThreshold ? values[i] : -100;
            
            // Convert from dB (-100 to 0) to 0-255 range
            // -100dB maps to 0, 0dB maps to 255
            const normalized = (gatedValue + 100) / 100; // Now 0 to 1
            dataArray[i] = Math.floor(normalized * 255);
          }
          
          // Log the effect of the noise gate
          console.log('[iOS Tone.js Analyzer] After noise gate (first 5):', Array.from(dataArray.slice(0, 5)));
        } else {
          // If there's no sound, set all values to 0
          dataArray.fill(0);
        }
        
        // Log the converted values for debugging
        console.log('Converted values (first 5):', Array.from(dataArray.slice(0, 5)))
      } else {
        // Standard Web Audio API analyzer
        bufferLength = analyzer.frequencyBinCount
        dataArray = new Uint8Array(bufferLength)
        analyzer.getByteFrequencyData(dataArray)
      }
      
      // Return the real audio data without any simulation
      return {
        dataArray,
        bufferLength
      }
    } catch (err) {
      console.error('Error getting analyzer data:', err)
      return null
    }
  }, [isPlaying])

  return (
    <AudioContext.Provider value={{
      playNarration,
      getAudioInstance,
      isPlaying,
      currentTrack,
      currentDialogue,
      getAnalyzerData, // Expose the analyzer data
      analyzer // Expose the analyzer directly if needed
    }}>
      {children}
    </AudioContext.Provider>
  )
}
