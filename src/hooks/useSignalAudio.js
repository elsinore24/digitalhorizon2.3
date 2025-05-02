import { useRef, useEffect, useCallback } from 'react'; // Import useCallback

function useSignalAudio() {
  const audioContextRef = useRef(null);
  const isInitializedRef = useRef(false); // Track if audio context has been initialized

  // Function to create or resume the AudioContext
  const initializeAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      console.log('AudioContext created');
    }

    // Resume context if it's suspended (e.g., after a user gesture)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('AudioContext resumed');
      });
    }
    isInitializedRef.current = true; // Mark as initialized
  }, []); // No dependencies, this function is stable

  // Effect for cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().then(() => {
          console.log('AudioContext closed on unmount');
          audioContextRef.current = null;
          isInitializedRef.current = false; // Reset initialized state
        });
      }
    };
  }, []); // Empty dependency array means this effect runs only on unmount

  // You can add functions here to create and manage audio nodes (oscillators, gain, etc.)
  // and expose them via the returned object. These functions should check if audioContextRef.current is available.

  return {
    audioContext: audioContextRef.current,
    initializeAudio, // Expose the initialization function
    isAudioInitialized: isInitializedRef.current, // Expose initialization status
    // Add functions for controlling audio playback and parameters here
  };
}

export default useSignalAudio;