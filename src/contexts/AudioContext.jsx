import { createContext, useState, useRef, useCallback } from 'react'
import { Howl } from 'howler'
import dialogueData from '../data/dialogue.json'
import { supabase } from '../config/supabase'

export const AudioContext = createContext(null)

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

  return (
    <AudioContext.Provider value={{
      playNarration,
      getAudioInstance,
      isPlaying,
      currentTrack,
      currentDialogue
    }}>
      {children}
    </AudioContext.Provider>
  )
}
