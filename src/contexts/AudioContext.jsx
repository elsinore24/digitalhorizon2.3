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

  // Play audio using Tone.js for iOS
  const playAudioWithTone = useCallback((url, dialogueId, dialogue) => {
    try {
      console.log('Using Tone.js for iOS playback:', dialogueId)
      
      // Make sure Tone.js is started (required for iOS)
      if (Tone.context.state !== 'running') {
        console.log('Starting Tone.js context')
        Tone.start()
      }
      
      // Create a buffer to load the audio
      const buffer = new Tone.Buffer(url, () => {
        console.log('Audio buffer loaded (Tone.js):', dialogueId)
        
        try {
          // Create a player with the loaded buffer
          const player = new Tone.Player(buffer).toDestination()
          
          // Create an analyzer
          const toneAnalyzer = new Tone.Analyser('fft', 256)
          
          // Connect the player to the analyzer
          player.connect(toneAnalyzer)
          
          // Store the analyzer in our global analyzer variable
          analyzer = toneAnalyzer
          
          // Set up stop handler
          player.onstop = () => {
            console.log('Audio ended (Tone.js):', dialogueId)
            setIsPlaying(false)
            setCurrentDialogue(null)
          }
          
          // Start playback
          player.start()
          console.log('Audio playing (Tone.js):', dialogueId)
          setIsPlaying(true)
          setCurrentTrack(dialogueId)
          setCurrentDialogue(dialogue)
          
          // Store the player
          audioRef.current = player
        } catch (err) {
          console.error('Error playing loaded buffer with Tone.js:', err)
          // Fall back to Howler
          console.log('Falling back to Howler due to Tone.js error')
          playAudioWithHowler(url, dialogueId, dialogue)
        }
      }, (err) => {
        // Buffer loading error
        console.error('Error loading audio buffer with Tone.js:', err)
        // Fall back to Howler
        console.log('Falling back to Howler due to Tone.js buffer loading error')
        playAudioWithHowler(url, dialogueId, dialogue)
      })
      
      return true
    } catch (err) {
      console.error('Failed to play audio with Tone.js:', err)
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

      // For iOS, use Howler.js which has better iOS compatibility
      if (isIOS) {
        console.log('Using Howler for iOS playback')
        playAudioWithHowler(localUrl, dialogueId, dialogue)
      } else {
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
  }, [playAudioWithElement, playAudioWithHowler])
  
  // Function to get analyzer data for visualizer
  const getAnalyzerData = useCallback(() => {
    if (!analyzer) return null
    
    try {
      let dataArray, bufferLength
      
      // Check if we're using a Tone.js analyzer (for iOS)
      if (analyzer.getValue && typeof analyzer.getValue === 'function') {
        // This is a Tone.js analyzer
        console.log('Getting data from Tone.js analyzer')
        
        // Get the FFT data from Tone.js analyzer
        const values = analyzer.getValue()
        
        // Convert to Uint8Array for compatibility with visualizer
        bufferLength = values.length
        dataArray = new Uint8Array(bufferLength)
        
        // Tone.js returns values in range -100 to 0 (dB), convert to 0-255 range
        for (let i = 0; i < bufferLength; i++) {
          // Convert from dB (-100 to 0) to 0-255 range
          // -100dB maps to 0, 0dB maps to 255
          const normalized = (values[i] + 100) / 100 // Now 0 to 1
          dataArray[i] = Math.floor(normalized * 255)
        }
      } else {
        // Standard Web Audio API analyzer
        bufferLength = analyzer.frequencyBinCount
        dataArray = new Uint8Array(bufferLength)
        analyzer.getByteFrequencyData(dataArray)
      }
      
      // Check if we have real audio data
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      
      // If no real data is available but audio is playing, create simulated data
      if (sum === 0 && isPlaying) {
        console.log('No audio data detected despite audio playing')
        
        // For iOS, create more realistic audio visualization data
        if (isIOS) {
          // Use a combination of sine waves to create a more realistic audio pattern
          // This simulates frequency data that responds to time, creating a more
          // natural-looking visualization without being too random or too uniform
          
          const time = Date.now() / 1000; // Current time in seconds for animation
          
          // Create a base pattern that changes over time
          for (let i = 0; i < bufferLength; i++) {
            // Normalized position in the array (0 to 1)
            const normalizedIndex = i / bufferLength;
            
            // Create a frequency distribution that's higher in the bass/mid range (left side)
            // and lower in the high range (right side) - typical for most audio
            const frequencyFactor = Math.max(0, 1 - normalizedIndex * 1.5);
            
            // Add time-based variation
            const timeVariation = Math.sin(time * 2 + normalizedIndex * 5) * 0.5 + 0.5;
            
            // Add some randomness to make it look more natural
            const randomness = Math.random() * 0.3;
            
            // Combine factors and scale to appropriate range
            dataArray[i] = Math.floor((frequencyFactor * 0.7 + timeVariation * 0.2 + randomness * 0.1) * 70);
          }
          
          // Add some peaks to simulate beats
          const beatIntensity = (Math.sin(time * 1.5) * 0.5 + 0.5) * 40;
          for (let i = 0; i < 10; i++) {
            // Add peaks in the bass/mid range
            const peakIndex = Math.floor(Math.random() * bufferLength * 0.5);
            dataArray[peakIndex] = Math.min(255, dataArray[peakIndex] + beatIntensity);
          }
        } else {
          // For non-iOS, use the original random data approach
          for (let i = 0; i < bufferLength; i++) {
            // Random values between 5 and 30 (very low but visible)
            dataArray[i] = Math.floor(Math.random() * 25) + 5;
          }
        }
      }
      
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
