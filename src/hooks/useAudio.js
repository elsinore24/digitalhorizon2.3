import { useContext, useCallback, useRef, useEffect } from 'react'
import { AudioContext } from '../contexts/AudioContext'

export default function useAudio() {
  // Always use the context at the top level
  const context = useContext(AudioContext)
  
  // Use refs to store the context functions to avoid dependency on the entire context object
  const contextFunctionsRef = useRef({
    playNarration: context?.playNarration,
    getAudioInstance: context?.getAudioInstance,
    toggleMute: context?.toggleMute,
    pauseAudio: context?.pauseAudio,
    resumeAudio: context?.resumeAudio,
    getAnalyzerData: context?.getAnalyzerData,
    playAudioFile: context?.playAudioFile
  });
  
  // Update the refs when the context functions change
  useEffect(() => {
    contextFunctionsRef.current = {
      playNarration: context?.playNarration,
      getAudioInstance: context?.getAudioInstance,
      toggleMute: context?.toggleMute,
      pauseAudio: context?.pauseAudio,
      resumeAudio: context?.resumeAudio,
      getAnalyzerData: context?.getAnalyzerData,
      playAudioFile: context?.playAudioFile
    };
  }, [
    context?.playNarration,
    context?.getAudioInstance,
    context?.toggleMute,
    context?.pauseAudio,
    context?.resumeAudio,
    context?.getAnalyzerData,
    context?.playAudioFile
  ]);
  
  // Wrap the context methods in useCallback with empty dependency arrays
  // to ensure stable references that never change
  const playNarration = useCallback((dialogueId) => {
    if (contextFunctionsRef.current.playNarration) {
      contextFunctionsRef.current.playNarration(dialogueId);
    }
  }, []);
  
  const getAudioInstance = useCallback(() => {
    if (contextFunctionsRef.current.getAudioInstance) {
      return contextFunctionsRef.current.getAudioInstance();
    }
    return null;
  }, []);

  const toggleMute = useCallback(() => {
    if (contextFunctionsRef.current.toggleMute) {
      contextFunctionsRef.current.toggleMute();
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (contextFunctionsRef.current.pauseAudio) {
      contextFunctionsRef.current.pauseAudio();
    }
  }, []);

  const resumeAudio = useCallback(() => {
    if (contextFunctionsRef.current.resumeAudio) {
      contextFunctionsRef.current.resumeAudio();
    }
  }, []);
  
  const getAnalyzerData = useCallback(() => {
    if (contextFunctionsRef.current.getAnalyzerData) {
      return contextFunctionsRef.current.getAnalyzerData();
    }
    return new Float32Array(0);
  }, []);

  const playAudioFile = useCallback((filePath) => {
    if (contextFunctionsRef.current.playAudioFile) {
      contextFunctionsRef.current.playAudioFile(filePath);
    }
  }, []);
  
  // Return a consistent object shape every time
  return {
    isPlaying: context ? context.isPlaying : false,
    currentTrack: context ? context.currentTrack : null,
    currentDialogue: context ? context.currentDialogue : null,
    playNarration,
    getAudioInstance,
    getAnalyzerData,
    analyzer: context ? context.analyzer : null,
    isMuted: context ? context.isMuted : false,
    toggleMute,
    playAudioFile,
    pauseAudio,
    resumeAudio
  }
}
