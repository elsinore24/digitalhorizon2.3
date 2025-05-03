import { useContext, useCallback, useRef, useEffect } from 'react'
import { AudioContext } from '../contexts/AudioContext' // This import is now correctly using the renamed context

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
    playAudioFile: context?.playAudioFile,
    playNarrativeAudio: context?.playNarrativeAudio, // Add playNarrativeAudio from context
    storeAudioStateBeforeToggle: context?.storeAudioStateBeforeToggle,
    restoreAudioStateAfterToggle: context?.restoreAudioStateAfterToggle,
    stopNarration: context?.stopNarration, // Add stopNarration from context
    resumeContextAndUnlock: context?.resumeContextAndUnlock // Add resumeContextAndUnlock from context
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
      playAudioFile: context?.playAudioFile,
      playNarrativeAudio: context?.playNarrativeAudio, // Add playNarrativeAudio from context
      storeAudioStateBeforeToggle: context?.storeAudioStateBeforeToggle,
      restoreAudioStateAfterToggle: context?.restoreAudioStateAfterToggle,
      stopNarration: context?.stopNarration, // Add stopNarration to the effect update
      resumeContextAndUnlock: context?.resumeContextAndUnlock // Add resumeContextAndUnlock to the effect update
    };
  }, [
    context?.playNarration,
    context?.getAudioInstance,
    context?.toggleMute,
    context?.pauseAudio,
    context?.resumeAudio,
    context?.getAnalyzerData,
    context?.playAudioFile,
    context?.playNarrativeAudio, // Add playNarrativeAudio to dependencies
    context?.storeAudioStateBeforeToggle,
    context?.restoreAudioStateAfterToggle,
    context?.stopNarration, // Add stopNarration to dependencies
    context?.resumeContextAndUnlock // Add resumeContextAndUnlock to dependencies
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

  const playAudioFile = useCallback((filePath, onComplete) => {
    if (contextFunctionsRef.current.playAudioFile) {
      contextFunctionsRef.current.playAudioFile(filePath, onComplete);
    }
  }, []);
  
  // Add playNarrativeAudio function
  const playNarrativeAudio = useCallback((filePath, onComplete) => {
    if (contextFunctionsRef.current.playNarrativeAudio) {
      contextFunctionsRef.current.playNarrativeAudio(filePath, onComplete);
    }
  }, []);
  
  const storeAudioStateBeforeToggle = useCallback(() => {
    if (contextFunctionsRef.current.storeAudioStateBeforeToggle) {
      contextFunctionsRef.current.storeAudioStateBeforeToggle();
    }
  }, []);
  
  const restoreAudioStateAfterToggle = useCallback(() => {
    if (contextFunctionsRef.current.restoreAudioStateAfterToggle) {
      contextFunctionsRef.current.restoreAudioStateAfterToggle();
    }
  }, []);

  // Add stopAudio function (wrapping stopNarration from context)
  const stopAudio = useCallback(() => {
    if (contextFunctionsRef.current.stopNarration) {
      contextFunctionsRef.current.stopNarration();
    }
  }, []);
  
  // Add resumeContextAndUnlock function
  const resumeContextAndUnlock = useCallback(async () => {
    if (contextFunctionsRef.current.resumeContextAndUnlock) {
      return contextFunctionsRef.current.resumeContextAndUnlock();
    }
    return Promise.reject("resumeContextAndUnlock function not available");
  }, []);

  // Return a consistent object shape every time
  return {
    isPlaying: context ? context.isPlaying : false,
    currentTrack: context ? context.currentTrack : null,
    currentDialogue: context ? context.currentDialogue : null,
    isAudioUnlocked: context ? context.isAudioUnlocked : false, // Expose isAudioUnlocked state
    playNarration,
    getAudioInstance,
    getAnalyzerData,
    analyzer: context ? context.analyzer : null,
    isMuted: context ? context.isMuted : false,
    toggleMute,
    playAudioFile,
    playNarrativeAudio, // Include playNarrativeAudio in the returned object
    pauseAudio,
    resumeAudio,
    storeAudioStateBeforeToggle,
    restoreAudioStateAfterToggle,
    stopAudio, // Include stopAudio in the returned object
    resumeContextAndUnlock // Include resumeContextAndUnlock in the returned object
  }
}
