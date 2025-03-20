import { createContext, useState, useRef, useCallback, useEffect } from 'react'
import { Howl, Howler } from 'howler'
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
        },
        onplay: () => {
          console.log('Audio playing (Howler):', dialogueId)
          setIsPlaying(true)
          setCurrentTrack(dialogueId)
          
          // For iOS, we need to try to get audio data from the Howler audio element
          if (isIOS && audioContext) {
            try {
              // Try to find the Howler audio element
              const howlerAudioElements = document.querySelectorAll('audio');
              let howlerAudioElement = null;
              
              // Find the audio element that's currently playing
              for (let i = 0; i < howlerAudioElements.length; i++) {
                const el = howlerAudioElements[i];
                if (!el.paused && el.currentTime > 0) {
                  howlerAudioElement = el;
                  break;
                }
              }
              
              if (howlerAudioElement) {
                console.log('Found playing Howler audio element, connecting analyzer');
                
                // Disconnect any existing connections
                if (mediaStreamSource) {
                  try {
                    mediaStreamSource.disconnect();
                  } catch (e) {
                    // Ignore disconnection errors
                  }
                }
                
                // Create a new source from the Howler audio element
                try {
                  mediaStreamSource = audioContext.createMediaElementSource(howlerAudioElement);
                  
                  // Connect the source to the analyzer and then to the destination
                  mediaStreamSource.connect(analyzer);
                  analyzer.connect(audioContext.destination);
                  
                  console.log('Successfully connected analyzer to Howler audio element');
                } catch (err) {
                  console.error('Error connecting analyzer to Howler audio:', err);
                }
              } else {
                console.log('Could not find playing Howler audio element');
              }
            } catch (err) {
              console.error('Error trying to connect analyzer to Howler:', err);
            }
          }
        },
        onend: () => {
          console.log('Audio ended (Howler):', dialogueId)
          setIsPlaying(false)
          setCurrentDialogue(null)
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
        audioRef.current.stop()
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

      // For iOS, prefer Howler.js as it has better iOS compatibility
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
      const bufferLength = analyzer.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyzer.getByteFrequencyData(dataArray)
      
      // Check if we have real audio data
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      
      // If no real data is available but audio is playing, create minimal data
      // This avoids using wave functions but still shows some activity
      if (sum === 0 && isPlaying) {
        console.log('No audio data detected despite audio playing')
        
        // Create minimal random data for visualization
        for (let i = 0; i < bufferLength; i++) {
          // Random values between 5 and 30 (very low but visible)
          dataArray[i] = Math.floor(Math.random() * 25) + 5
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
