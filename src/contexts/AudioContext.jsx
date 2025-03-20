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

const getAudioUrl = (filename) => {
  const { data } = supabase
    .storage
    .from(AUDIO_BUCKET)
    .getPublicUrl(filename)
  
  return data.publicUrl
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

  // Fallback function to handle CORS errors by using a local audio file
  const playLocalAudio = useCallback((dialogueId, dialogue) => {
    console.log('Attempting to play local audio as fallback for:', dialogueId)
    
    try {
      // Try to use a local audio file from the public directory
      const localUrl = `/audio/narration/${dialogueId}.mp3`
      console.log('Local audio URL:', localUrl)
      
      // Update the audio element source
      if (audioElement) {
        audioElement.src = localUrl
        audioElement.onloadeddata = () => {
          console.log('Local audio loaded:', dialogueId)
          setCurrentDialogue(dialogue)
          
          // Connect analyzer to the audio element
          connectAnalyzerToAudio()
          
          // Play the audio
          audioElement.play()
            .then(() => {
              console.log('Local audio playing:', dialogueId)
              setIsPlaying(true)
              setCurrentTrack(dialogueId)
            })
            .catch(err => {
              console.error('Error playing local audio:', err)
            })
        }
        
        audioElement.onended = () => {
          console.log('Local audio ended:', dialogueId)
          setIsPlaying(false)
          setCurrentDialogue(null)
        }
        
        audioElement.onerror = (err) => {
          console.error('Local audio error:', err)
        }
      } else {
        // Fallback to Howler if audio element is not available
        const audio = new Howl({
          src: [localUrl],
          html5: true,
          preload: true,
          onload: () => {
            console.log('Local audio loaded (Howler):', dialogueId)
            setCurrentDialogue(dialogue)
          },
          onplay: () => {
            console.log('Local audio playing (Howler):', dialogueId)
            setIsPlaying(true)
            setCurrentTrack(dialogueId)
          },
          onend: () => {
            console.log('Local audio ended (Howler):', dialogueId)
            setIsPlaying(false)
            setCurrentDialogue(null)
          },
          onloaderror: (id, err) => {
            console.error('Local audio load error (Howler):', dialogueId, err)
          }
        })
        
        audio.play()
        audioRef.current = audio
      }
    } catch (err) {
      console.error('Failed to play local audio:', err)
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
      
      const audioUrl = getAudioUrl(`${dialogueId}.mp3`)
      console.log('Audio URL:', audioUrl)

      // Try to play using the audio element first
      if (audioElement) {
        audioElement.src = audioUrl
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
              // Try the local fallback if there's an error
              playLocalAudio(dialogueId, dialogue)
            })
        }
        
        audioElement.onended = () => {
          console.log('Audio ended:', dialogueId)
          setIsPlaying(false)
          setCurrentDialogue(null)
        }
        
        audioElement.onerror = (err) => {
          console.error('Audio error:', err)
          // Try the local fallback if there's an error
          playLocalAudio(dialogueId, dialogue)
        }
      } else {
        // Fallback to Howler if audio element is not available
        const audio = new Howl({
          src: [audioUrl],
          html5: true,
          preload: true,
          format: ['mp3'],
          xhr: {
            method: 'GET',
            headers: {
              'Origin': window.location.origin,
              'Range': 'bytes=0-',
            },
            withCredentials: false
          },
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
            // Try the local fallback if there's an error
            playLocalAudio(dialogueId, dialogue)
          },
          onplayerror: (id, err) => {
            console.error('Audio play error (Howler):', dialogueId, err)
            // Try the local fallback if there's an error
            playLocalAudio(dialogueId, dialogue)
          }
        })

        audio.play()
        audioRef.current = audio
      }
    } catch (err) {
      console.error('Failed to play audio:', err)
      // Try the local fallback if there's an exception
      playLocalAudio(dialogueId, dialogue)
    }
  }, [playLocalAudio])
  
  // Function to get analyzer data for visualizer
  const getAnalyzerData = useCallback(() => {
    if (!analyzer) return null
    
    try {
      const bufferLength = analyzer.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyzer.getByteFrequencyData(dataArray)
      
      // Debug: Check if we're getting any data
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      
      if (sum === 0 && isPlaying) {
        console.log('No audio data detected despite audio playing')
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
