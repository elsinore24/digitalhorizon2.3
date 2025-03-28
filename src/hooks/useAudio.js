import { useContext, useCallback } from 'react'
import { AudioContext } from '../contexts/AudioContext'

export default function useAudio() {
  // Always use the context at the top level
  const context = useContext(AudioContext)
  
  // IMPORTANT: Don't use early returns before all hooks are defined
  // This is usually the cause of the React Error #300
  
  // Wrap the context methods in useCallback to ensure stable references
  const playNarration = useCallback((dialogueId) => {
    if (context && context.playNarration) {
      context.playNarration(dialogueId)
    }
  }, [context])
  
  const getAudioInstance = useCallback(() => {
    if (context && context.getAudioInstance) {
      return context.getAudioInstance()
    }
    return null
  }, [context])
  
  const getAnalyzerData = useCallback(() => {
    if (context && context.getAnalyzerData) {
      return context.getAnalyzerData()
    }
    return new Float32Array(0)
  }, [context])
  
  // Return a consistent object shape every time
  return {
    isPlaying: context ? context.isPlaying : false,
    currentTrack: context ? context.currentTrack : null,
    currentDialogue: context ? context.currentDialogue : null,
    playNarration,
    getAudioInstance,
    getAnalyzerData,
    analyzer: context ? context.analyzer : null
  }
}
