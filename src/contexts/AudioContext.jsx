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

      audio.play()
      audioRef.current = audio

    } catch (err) {
      console.error('Failed to play audio:', err)
    }
  }, [])

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
