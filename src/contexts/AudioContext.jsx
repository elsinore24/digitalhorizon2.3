import { createContext, useState, useRef, useCallback, useEffect } from 'react'
import { Howl, Howler } from 'howler'
import dialogueData from '../data/dialogue.json'
import { supabase } from '../config/supabase'

export const AudioContext = createContext(null)

// Create Web Audio API context and analyzer
let analyzer = null

// Initialize Web Audio API context and connect to Howler
const initAudioContext = () => {
  if (!analyzer && window.Howler) {
    // Get Howler's audio context
    const audioCtx = Howler.ctx
    
    // Create analyzer node
    analyzer = audioCtx.createAnalyser()
    analyzer.fftSize = 256
    analyzer.smoothingTimeConstant = 0.8
    
    // Connect Howler's masterGain to our analyzer
    if (Howler.masterGain) {
      // Connect analyzer between masterGain and destination
      Howler.masterGain.disconnect()
      Howler.masterGain.connect(analyzer)
      analyzer.connect(audioCtx.destination)
      
      console.log('Successfully connected analyzer to Howler audio context')
    } else {
      console.error('Could not access Howler.masterGain')
    }
  }
  return { analyzer }
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

  // Fallback function to handle CORS errors by using a local audio file
  const playLocalAudio = useCallback((dialogueId, dialogue) => {
    console.log('Attempting to play local audio as fallback for:', dialogueId)
    
    try {
      // Try to use a local audio file from the public directory
      const localUrl = `/audio/narration/${dialogueId}.mp3`
      console.log('Local audio URL:', localUrl)
      
      const audio = new Howl({
        src: [localUrl],
        html5: true,
        preload: true,
        onload: () => {
          console.log('Local audio loaded:', dialogueId)
          setCurrentDialogue(dialogue)
        },
        onplay: () => {
          console.log('Local audio playing:', dialogueId)
          setIsPlaying(true)
          setCurrentTrack(dialogueId)
        },
        onend: () => {
          console.log('Local audio ended:', dialogueId)
          setIsPlaying(false)
          setCurrentDialogue(null)
        },
        onloaderror: (id, err) => {
          console.error('Local audio load error:', dialogueId, err)
        }
      })
      
      audio.play()
      audioRef.current = audio
    } catch (err) {
      console.error('Failed to play local audio:', err)
    }
  }, [])

  const playNarration = useCallback(async (dialogueId) => {
    try {
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
          console.log('Audio loaded:', dialogueId)
          setCurrentDialogue(dialogue)
        },
        onplay: () => {
          console.log('Audio playing:', dialogueId)
          setIsPlaying(true)
          setCurrentTrack(dialogueId)
        },
        onend: () => {
          console.log('Audio ended:', dialogueId)
          setIsPlaying(false)
          setCurrentDialogue(null)
        },
        onloaderror: (id, err) => {
          console.error('Audio load error:', dialogueId, err)
        },
        onplayerror: (id, err) => {
          console.error('Audio play error:', dialogueId, err)
        }
      })

      // Add error handlers to catch CORS issues
      audio.once('loaderror', (id, err) => {
        console.error('Audio load error (possibly CORS):', dialogueId, err)
        // Try the local fallback if there's an error
        playLocalAudio(dialogueId, dialogue)
      })

      audio.play()
      audioRef.current = audio

    } catch (err) {
      console.error('Failed to play audio:', err)
      // Try the local fallback if there's an exception
      playLocalAudio(dialogueId, dialogue)
    }
  }, [playLocalAudio])

  // Initialize the audio context when the component mounts
  useEffect(() => {
    const { analyzer: newAnalyzer } = initAudioContext()
    
    return () => {
      // Clean up if needed
      if (analyzer && Howler.ctx && Howler.masterGain) {
        try {
          // Reconnect Howler's masterGain directly to destination
          Howler.masterGain.disconnect()
          Howler.masterGain.connect(Howler.ctx.destination)
          console.log('Cleaned up audio analyzer connections')
        } catch (err) {
          console.error('Error cleaning up audio connections:', err)
        }
      }
    }
  }, [])
  
  // Function to get analyzer data for visualizer
  const getAnalyzerData = useCallback(() => {
    if (!analyzer) return null
    
    const bufferLength = analyzer.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyzer.getByteFrequencyData(dataArray)
    
    return {
      dataArray,
      bufferLength
    }
  }, [])

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
