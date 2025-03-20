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

// Initialize Web Audio API context with direct audio capture
const initAudioContext = () => {
  if (!analyzer) {
    try {
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
      mediaStreamSource = audioContext.createMediaElementSource(audioElement)
      
      // Connect the source to the analyzer and then to the destination
      mediaStreamSource.connect(analyzer)
      analyzer.connect(audioContext.destination)
      
      console.log('Directly connected analyzer to audio element')
      return true
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
      // Create a hidden audio element for capturing
      audioElement = document.createElement('audio')
      audioElement.id = 'audio-visualizer-source'
      audioElement.crossOrigin = 'anonymous' // Add this to help with CORS
      audioElement.style.display = 'none'
      document.body.appendChild(audioElement)
      
      // Resume audio context on user interaction (required by browsers)
      const resumeAudioContext = () => {
        if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume()
        }
        
        // Remove event listeners after first interaction
        document.removeEventListener('click', resumeAudioContext)
        document.removeEventListener('touchstart', resumeAudioContext)
        document.removeEventListener('keydown', resumeAudioContext)
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
      const audio = new Howl({
        src: [url],
        html5: true,
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
        }
      })

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

      // Try to play using the audio element first
      const elementSuccess = playAudioWithElement(localUrl, dialogueId, dialogue)
      
      // If audio element fails, fall back to Howler
      if (!elementSuccess) {
        playAudioWithHowler(localUrl, dialogueId, dialogue)
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
      
      // Generate synthetic data if no real data is available
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      
      if (sum === 0 && isPlaying) {
        console.log('No audio data detected despite audio playing')
        
        // Create synthetic data based on time for visualization
        const time = Date.now() / 1000
        for (let i = 0; i < bufferLength; i++) {
          // Base amplitude decreases as frequency (i) increases
          const baseAmplitude = 200 - (i / bufferLength) * 100
          
          // Different oscillation speeds for different frequency bands
          const oscillationSpeed = 1.5 + (i / bufferLength) * 3
          
          // Phase shift based on position to create wave-like motion
          const phaseShift = i * 0.7
          
          // Add some randomness for more natural look
          const noise = 10 * Math.sin(time * 10 + i * 20)
          
          // Combine multiple oscillations with different frequencies
          let value = baseAmplitude * (
            0.6 * Math.sin(time * oscillationSpeed + phaseShift) +
            0.3 * Math.sin(time * oscillationSpeed * 1.7 + phaseShift * 1.3) +
            0.1 * Math.sin(time * oscillationSpeed * 3.1 + phaseShift * 0.5)
          ) + noise
          
          // Ensure value is positive and within range
          value = Math.abs(value)
          value = Math.min(255, Math.max(0, value))
          
          dataArray[i] = value
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
