import { createContext, useState, useRef, useCallback, useEffect } from 'react'
import dialogueData from '../data/dialogue.json'

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

  // Check if we're on iOS
  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)
    console.log('iOS device detected:', isIOS)
  }, [])

  const getAudioInstance = useCallback(() => {
    return audioRef.current
  }, [])

  // Simple function to play narration - this is now just a state manager
  // The actual audio playback is handled by WaveSurfer in the AudioVisualizer component
  const playNarration = useCallback((dialogueId) => {
    try {
      const dialogue = dialogueData[dialogueId]
      if (!dialogue) {
        console.warn(`Dialogue ID "${dialogueId}" not found`)
        return
      }

      console.log('Setting up narration for:', dialogueId)
      
      // Set state for the current track and dialogue
      setCurrentTrack(dialogueId)
      setCurrentDialogue(dialogue)
      setIsPlaying(true)
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
      isPlaying,
      currentTrack,
      currentDialogue,
      isIOS
    }}>
      {children}
    </AudioContext.Provider>
  )
}
