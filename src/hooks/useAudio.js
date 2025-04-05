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

  // Wrap toggleMute for stable reference (though context itself changes rarely)
  const toggleMute = useCallback(() => {
    if (context && context.toggleMute) {
      context.toggleMute();
    }
  }, [context]);

  // Wrap pauseAudio for stable reference
  const pauseAudio = useCallback(() => {
    if (context && context.pauseAudio) {
      context.pauseAudio();
    }
  }, [context]);

  // Wrap resumeAudio for stable reference
  const resumeAudio = useCallback(() => {
    if (context && context.resumeAudio) {
      context.resumeAudio();
    }
  }, [context]);
  
  const getAnalyzerData = useCallback(() => {
    if (context && context.getAnalyzerData) {
      return context.getAnalyzerData()
    }
    return new Float32Array(0)
  }, [context])

  // Wrap playAudioFile for stable reference
  const playAudioFile = useCallback((filePath) => {
    if (context && context.playAudioFile) {
      context.playAudioFile(filePath);
    }
  }, [context]);
  
  // Return a consistent object shape every time
  return {
    isPlaying: context ? context.isPlaying : false,
    currentTrack: context ? context.currentTrack : null,
    currentDialogue: context ? context.currentDialogue : null,
    playNarration,
    getAudioInstance,
    getAnalyzerData,
    analyzer: context ? context.analyzer : null,
    isMuted: context ? context.isMuted : false, // Add isMuted state
    toggleMute, // Add toggleMute function
    playAudioFile, // Add new function
    pauseAudio, // Add pause function
    resumeAudio // Add resume function
  }
}
