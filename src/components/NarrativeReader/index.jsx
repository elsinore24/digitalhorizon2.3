import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import useAudio from '../../hooks/useAudio';
import useAutoScroll from '../../hooks/useAutoScroll';
import styles from './NarrativeReader.module.scss';

import { useGameStore } from '../../store/useGameStore'; // Import useGameStore as a named import

// Remove narrativeId and onComplete props, use dataPerceptionMode
const NarrativeReader = ({
  dataPerceptionMode,
  narrativeToLoad, // Accept the new prop
}) => {
  // Access currentNodeId, updateGameState, and setActiveTuningChallenge from Zustand store
  const { currentNodeId, updateGameState, setActiveTuningChallenge } = useGameStore(state => ({
    currentNodeId: state.gameState.currentNodeId,
    updateGameState: state.updateGameState,
    setActiveTuningChallenge: state.setActiveTuningChallenge,
  }));

  const [narrativeData, setNarrativeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const {
    playAudioFile,
    playNarrativeAudio, // Use the new function
    pauseAudio,
    resumeAudio,
    isPlaying,
    getAudioInstance,
    stopAudio // Add stopAudio from useAudio
  } = useAudio();
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [imageVisible, setImageVisible] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const audioInstanceRef = useRef(null);
  const currentAudioInstanceRef = useRef(null); // Ref to store the current audio instance
  const playPauseButtonRef = useRef(null);
  const initialPlayTriggeredRef = useRef(false);
  const textContainerRef = useRef(null);
  const [totalScrollableHeight, setTotalScrollableHeight] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState(null); // New state for current image
  const isNarrativeAudioPlayingRef = useRef(false); // Ref to track if narrative audio is playing


  // Callback for image synchronization during auto-scroll
  const syncImageWithScroll = useCallback((currentTime, progress) => {
    if (narrativeData && narrativeData.pages) {
      let activePage = null;
      for (let i = narrativeData.pages.length - 1; i >= 0; i--) {
        const page = narrativeData.pages[i];
        if (page.timestamp <= currentTime) {
          activePage = page;
          break;
        }
      }

      // Update image if the active page has an image and it's different
      // Use a functional update to avoid needing currentImageUrl in dependencies
      if (activePage && activePage.imageUrl) {
        setCurrentImageUrl(prevImageUrl => {
          if (prevImageUrl !== activePage.imageUrl) {
            return activePage.imageUrl;
          }
          return prevImageUrl; // No change needed
        });
      } else if (!activePage) {
          // If no page is active (before the first timestamp), clear the image
          setCurrentImageUrl(null);
      }
    }
  }, [narrativeData, setCurrentImageUrl]); // Dependencies for the callback


  const {
    scrollProgress,
    isScrolling,
    updateScrollPosition,
    handleManualScroll,
    resumeAutoScroll
  } = useAutoScroll({
    scrollRef: textContainerRef,
    audioInstance: getAudioInstance(),
    isPlaying,
    isPausedByUser,
    isAutoScrollEnabled,
    totalScrollableHeight,
    audioDuration,
    onScrollFrame: syncImageWithScroll // Pass the image sync callback
  });

  // Create a ref to track the current narrative
  const currentNarrativeRef = useRef(null);

  // Effect to fetch narrative data and start audio based on narrativeToLoad prop
  useEffect(() => {
    console.log('[NarrativeReader useEffect] Triggered. narrativeToLoad:', narrativeToLoad); // Update log

    // Only attempt to fetch if narrativeToLoad is provided
    if (!narrativeToLoad) {
      // Reset state if narrativeToLoad becomes null (e.g., when component unmounts or phase changes)
      setNarrativeData(null);
      setIsPausedByUser(false); // Reset pause state
      setImageVisible(false); // Reset image visibility
      setTotalScrollableHeight(0); // Reset scroll height
      setAudioDuration(0); // Reset audio duration
      setCurrentImageUrl(null); // Reset current image

      // If there's an active audio instance from a previous narrative, stop it
      if (audioInstanceRef.current && typeof audioInstanceRef.current.pause === 'function') {
         audioInstanceRef.current.pause();
         audioInstanceRef.current.src = ''; // Detach source
         audioInstanceRef.current = null;
       }
      // Use stopAudio from useAudio hook if available/needed
      stopAudio();
      isNarrativeAudioPlayingRef.current = false; // Ensure ref is false
      currentNarrativeRef.current = null; // Reset current narrative ref
      return;
    }

    // Skip if we're already loading this narrative
    if (currentNarrativeRef.current === narrativeToLoad && narrativeData) {
      console.log('[NarrativeReader] Skipping duplicate fetch for:', narrativeToLoad);
      return;
    }
    
    // Update current narrative ref
    currentNarrativeRef.current = narrativeToLoad;

    // Reset state when narrativeToLoad changes
    setIsPausedByUser(false); // Reset pause state
    setImageVisible(false); // Reset image visibility
    setTotalScrollableHeight(0); // Reset scroll height
    setAudioDuration(0); // Reset audio duration
    setCurrentImageUrl(null); // Reset current image
    isNarrativeAudioPlayingRef.current = false; // Reset ref


    const fetchNarrative = async () => {
      setIsLoading(true);
      setError(null);
      setNarrativeData(null); // Clear previous data
      setIsPausedByUser(false); // Ensure not paused when new narrative starts
      setCurrentImageUrl(null); // Clear image before fetching new data


      try {
        // Assuming narratives are in /public/narratives/ and named after narrativeToLoad
        const response = await fetch(`/narratives/${narrativeToLoad}.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setNarrativeData(data);

        // Check if the loaded narrative data corresponds to a tuning challenge
        if (data.requiresTuning && data.challengeConfig) {
            // Stop any currently playing audio before starting the challenge
            stopAudio();
            // Set the active tuning challenge in the game store
            setActiveTuningChallenge(data.challengeConfig);
            console.log("Setting active tuning challenge:", data.challengeConfig);
            isNarrativeAudioPlayingRef.current = false; // Ensure ref is false for challenges
            // Do NOT proceed with audio playback or narrative display here
            return;
        } else {
            // If not a tuning challenge, ensure activeTuningChallenge is null
            setActiveTuningChallenge(null);
        }


        // Set initial image from the first page if available
        if (data.pages && data.pages.length > 0 && data.pages[0].imageUrl) {
            setCurrentImageUrl(data.pages[0].imageUrl);
        } else {
            // Optionally set a default image if the first page has none
            // setCurrentImageUrl("/front_pic/default.png");
        }


        if (data.audio) {
           console.log('[NarrativeReader] Narrative fetched, loading audio:', data.audio);
           console.log('[NarrativeReader] Before playAudioFile - isPlaying:', isPlaying, 'isPausedByUser:', isPausedByUser);
           // Define the completion callback
           const handleAudioCompletion = () => {
             console.log('[NarrativeReader] Audio playback finished (callback). Checking for next narrative node.');
             isNarrativeAudioPlayingRef.current = false; // Set ref to false on completion

             // Get the latest state using get() from Zustand
             const state = useGameStore.getState();
             const currentGameState = state.gameState;

             // Determine the next node ID based on the 'next' property in the narrative data
             const nextNodeId = data?.next; // Use 'data' from the fetch scope

             if (!nextNodeId) {
                 console.warn(`[NarrativeReader] Narrative node ${currentGameState.currentNodeId} has no 'next' property. Narrative ends here.`);
                 // Optionally handle narrative ending (e.g., show credits, return to main menu)
                 return; // Stop narrative progression
             }

             console.log(`[NarrativeReader] Advancing to next node: ${nextNodeId}`);

             // Update currentNodeId in Zustand
             updateGameState({ currentNodeId: nextNodeId });
           };

           // Ensure isPausedByUser is false immediately before playing
           setIsPausedByUser(false);
           console.log('[NarrativeReader] Before playAudioFile - isPlaying:', isPlaying, 'isPausedByUser:', isPausedByUser);
           // Play the narrative audio file and pass the completion callback
           playNarrativeAudio(data.audio, handleAudioCompletion);
           console.log('[NarrativeReader] After playNarrativeAudio - isPlaying:', isPlaying, 'isPausedByUser:', isPausedByUser);
           isNarrativeAudioPlayingRef.current = true; // Set ref to true when playback is initiated
         } else {
           console.warn(`Narrative ${narrativeToLoad} is missing the 'audio' property in its JSON data.`);
           isNarrativeAudioPlayingRef.current = false; // Set ref to false if no audio
           // If there's no audio, immediately trigger narrative advancement if 'next' exists
           if (data?.next) {
              console.log('[NarrativeReader] No audio, immediately advancing to next node:', data.next);
              updateGameState({ currentNodeId: data.next });
           } else {
              console.warn(`[NarrativeReader] Narrative node ${narrativeToLoad} has no audio and no 'next' property. Narrative ends here.`);
           }
         }

      } catch (e) {
        console.error("[NarrativeReader] CATCH BLOCK: Failed to fetch narrative:", e); // Add specific log
        setError(`Failed to load narrative: ${narrativeToLoad}. Error: ${e.message}`);
        isNarrativeAudioPlayingRef.current = false; // Ensure ref is false on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchNarrative();
  }, [narrativeToLoad, playNarrativeAudio, stopAudio, setActiveTuningChallenge, updateGameState]); // Removed isPlaying and isPausedByUser from dependencies


  // Effect to calculate total scrollable height after narrative data is loaded and rendered
  useLayoutEffect(() => { // Changed to useLayoutEffect
    if (narrativeData && textContainerRef.current) {
      // Ensure content is rendered before calculating
      const calculateHeight = () => {
        const scrollHeight = textContainerRef.current.scrollHeight;
        const clientHeight = textContainerRef.current.clientHeight;
        const calculatedTotalScrollableHeight = scrollHeight - clientHeight;
        setTotalScrollableHeight(calculatedTotalScrollableHeight);
        console.log('[NarrativeReader] Calculated totalScrollableHeight:', calculatedTotalScrollableHeight);
      };

      // Use a small timeout to ensure DOM is updated after data render
      const timer = setTimeout(calculateHeight, 50);
      return () => clearTimeout(timer);
    }
  }, [narrativeData]); // Recalculate when narrative data changes

  // Effect to get audio duration
  useEffect(() => {
    const audioInstance = getAudioInstance();
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const getDuration = (instance) => {
      if (!instance) return null; // Add check for null instance

      // Check if duration property exists and is a valid number
      if (typeof instance.duration === 'number' && instance.duration > 0 && isFinite(instance.duration)) {
        return instance.duration;
      }

      // Check if duration method exists and returns a valid number
      if (typeof instance.duration === 'function') {
        const funcDuration = instance.duration();
        if (typeof funcDuration === 'number' && funcDuration > 0 && isFinite(funcDuration)) {
          return funcDuration;
        }
      }
      // If neither is found or valid, return null
      return null;
    };

    if (audioInstance) {
      const handleLoadedMetadata = () => {
        // Check if component is still mounted before updating state
        if (isMounted) {
          const loadedDuration = getDuration(audioInstance);
          if (loadedDuration !== null) {
            setAudioDuration(loadedDuration);
            console.log('[NarrativeReader] Audio duration available after loadedmetadata:', loadedDuration);
          } else {
             console.warn('[NarrativeReader] Audio duration from loadedmetadata is invalid or not available.');
          }
        }
      };

      // Check if duration is already available (e.g., if audio was cached)
      const initialDuration = getDuration(audioInstance);
      if (initialDuration !== null) {
         if (isMounted) {
            setAudioDuration(initialDuration);
            console.log('[NarrativeReader] Audio duration available immediately:', initialDuration);
         }
      } else {
          // If not immediately available, listen for 'loadedmetadata' or 'load'
          console.warn('[NarrativeReader] Audio duration not immediately available. Adding listener.');
          // Use 'loadedmetadata' for HTMLAudioElement, 'load' for Howler.js
          // Determine the correct event name based on the instance type
          const eventName = typeof audioInstance.duration === 'function' ? 'load' : 'loadedmetadata';
          // Ensure the instance has the addEventListener method before using it
          if (typeof audioInstance.addEventListener === 'function') {
             audioInstance.addEventListener(eventName, handleLoadedMetadata);
          } else if (typeof audioInstance.on === 'function') {
             // Handle cases where it might use .on/.off (like Howler v2)
             audioInstance.on(eventName, handleLoadedMetadata);
          } else {
             console.warn('[NarrativeReader] Audio instance does not support standard event listeners (addEventListener/on). Cannot track loadedmetadata.');
          }


          // Cleanup listener
          return () => {
            isMounted = false; // Set flag to false on cleanup
            if (typeof audioInstance.removeEventListener === 'function') {
               audioInstance.removeEventListener(eventName, handleLoadedMetadata);
            } else if (typeof audioInstance.off === 'function') {
               audioInstance.off(eventName, handleLoadedMetadata); // Fixed: Changed handleAudioEnd to handleLoadedMetadata
            }
          };
      }

      // Cleanup function for the case where duration was immediately available
      return () => {
        isMounted = false;
      };

    }

    // Cleanup if audioInstance is null
    return () => {
      isMounted = false;
    };

  }, [getAudioInstance, narrativeData]); // Depend on getAudioInstance and narrativeData


  // Effect to show/hide scroll indicator
  useEffect(() => {
    if (isAutoScrollEnabled && isScrolling) {
      setShowScrollIndicator(true);
      const timer = setTimeout(() => setShowScrollIndicator(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowScrollIndicator(false);
    }
  }, [isAutoScrollEnabled, isScrolling]);


  // Effect to trigger image fade-in (now controlled by currentImageUrl)
  useEffect(() => {
    if (currentImageUrl) { // Only trigger if there's a current image URL
      const timer = setTimeout(() => {
        setImageVisible(true);
      }, 100); // Short delay to ensure rendering before transition starts
      return () => clearTimeout(timer); // Cleanup on unmount or image change
    } else {
      setImageVisible(false); // Reset if image is cleared
    }
  }, [currentImageUrl]); // Depend on currentImageUrl


  // Effect to programmatically click Play/Pause on initial iOS load to resume audio context if needed
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    // Access audioContext from the AudioContext directly
    const audioContext = getAudioInstance()?.context;

    // Trigger only once on iOS when narrative data is loaded, button ref exists,
    // AND audio context is suspended.
    // Also ensure isPlaying is false before attempting to click
    if (isIOS && narrativeData && playPauseButtonRef.current && !initialPlayTriggeredRef.current && audioContext && audioContext.state === 'suspended' && !isPlaying) {
      console.log('[NarrativeReader] iOS detected, narrative loaded, and audio context suspended. Attempting programmatic click on Play/Pause to resume.');

      // Set flag immediately to prevent re-triggering
      initialPlayTriggeredRef.current = true;

      // Use a short timeout to ensure the button is fully rendered and interactive
      const clickTimeout = setTimeout(() => {
        if (playPauseButtonRef.current) {
          console.log('[NarrativeReader] Triggering click on Play/Pause button ref.');
          playPauseButtonRef.current.click(); // Simulate click
        } else {
          console.warn('[NarrativeReader] Play/Pause button ref was null during timeout.');
        }
      }, 100); // 100ms delay, adjust if needed

      return () => clearTimeout(clickTimeout); // Cleanup timeout
    }
    // Removed the erroneous else block here
  }, [narrativeData, isPlaying, getAudioInstance]); // Depend on narrativeData, isPlaying, and getAudioInstance

  // Reset the trigger flag if the narrative changes (based on narrativeToLoad)
  useEffect(() => {
    initialPlayTriggeredRef.current = false;
  }, [narrativeToLoad]); // Depend on narrativeToLoad

  // Ref to track if narrative advancement is pending to prevent double triggers
  const narrativeAdvancementPendingRef = useRef(false);

  // Effect to handle narrative completion based on audio 'ended' event
  useEffect(() => {
    const audioInstance = getAudioInstance();
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const handleAudioEnded = () => {
      if (isMounted) {
        console.log('[NarrativeReader] Audio "ended" event triggered. Checking for next narrative node.');

        // Set the pending flag to true immediately
        narrativeAdvancementPendingRef.current = true;

        // Get the latest state using get() from Zustand
        const state = useGameStore.getState();
        const currentGameState = state.gameState;

        // Determine the next node ID based on the 'next' property in the narrative data
        const nextNodeId = narrativeData?.next;

        if (!nextNodeId) {
            console.warn(`[NarrativeReader] Narrative node ${currentGameState.currentNodeId} has no 'next' property. Narrative ends here.`);
            // Optionally handle narrative ending (e.g., show credits, return to main menu)
            narrativeAdvancementPendingRef.current = false; // Reset flag if narrative ends
            return; // Stop narrative progression
        }

        console.log(`[NarrativeReader] Advancing to next node: ${nextNodeId}`);

        // Update currentNodeId in Zustand
        updateGameState({ currentNodeId: nextNodeId });

        // Reset the pending flag after a short delay to allow state update to propagate
        setTimeout(() => {
          narrativeAdvancementPendingRef.current = false;
        }, 500); // Adjust delay as needed
      }
    };

    if (audioInstance && typeof audioInstance.addEventListener === 'function') {
      audioInstance.addEventListener('ended', handleAudioEnded);

      return () => {
        isMounted = false;
        audioInstance.removeEventListener('ended', handleAudioEnded);
      };
    } else if (audioInstance && typeof audioInstance.on === 'function') {
       // Handle cases where it might use .on/.off (like Howler v2)
       audioInstance.on('end', handleAudioEnded); // Howler.js uses 'end' event

       return () => {
         isMounted = false;
         audioInstance.off('end', handleAudioEnded);
       };
    } else if (audioInstance) {
       console.warn('[NarrativeReader] Audio instance does not support standard event listeners (addEventListener/on). Cannot track "ended" event for narrative completion.');
       
       // Since we can't use event listeners, set up a polling mechanism to check audio position
       const checkInterval = 1000; // Check every second
       const intervalId = setInterval(() => {
         if (!audioInstance) return;
         
         const currentTime = audioInstance.currentTime || 0;
         const duration = audioInstance.duration || 0;
         
         // If we're near the end of the audio (within 0.5 seconds)
         if (duration > 0 && currentTime > 0 && (duration - currentTime) < 0.5) {
           handleAudioEnded();
           clearInterval(intervalId);
         }
       }, checkInterval);
       
       return () => {
         clearInterval(intervalId);
         isMounted = false;
       };
    }

    // Cleanup if audioInstance is null
    return () => {
      isMounted = false;
    };

  }, [getAudioInstance, narrativeData, updateGameState]); // Depend on getAudioInstance, narrativeData, and updateGameState


  // Handler for the Play/Pause button
  const handlePlayPause = (event) => {
    event.stopPropagation(); // Stop event propagation
    if (isPlaying && !isPausedByUser) {
      pauseAudio();
      setIsPausedByUser(true);
    } else {
      resumeAudio();
      setIsPausedByUser(false); // Set isPausedByUser to false when resuming
    }
  };

  // Effect to update isPausedByUser based on isPlaying
  useEffect(() => {
    if (isPlaying) {
      setIsPausedByUser(false);
    }
  }, [isPlaying]);

  // Handler for the Auto Scroll toggle with momentum effect
  const handleToggleAutoScroll = () => {
    const newState = !isAutoScrollEnabled;
    setIsAutoScrollEnabled(newState);

    if (newState && textContainerRef.current) {
      // When enabling, smoothly scroll to current audio position
      const audioInstance = getAudioInstance();
      if (audioInstance) {
        const currentTime = audioInstance.seek ? audioInstance.seek() : audioInstance.currentTime;
        const progress = Math.min(1, Math.max(0, currentTime / audioDuration));
        const targetScrollTop = totalScrollableHeight * progress;

        // Smooth scroll with easing
        textContainerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }
  };


  if (isLoading) {
    return <div className={styles.loading}>Loading Narrative...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!narrativeData) {
    return null; // Or some placeholder if needed when no narrative is active
  }

  // Safely access page data and text (still using pages structure for content)
  const pagesExist = narrativeData && Array.isArray(narrativeData.pages) && narrativeData.pages.length > 0;

  return (
    <div
      className={`${styles.narrativeContainer} ${dataPerceptionMode ? styles.hidden : ''}`} // Conditionally add hidden class
    >
      {/* Use a Fragment to return multiple elements */}
      <>
        {/* Image Container - Now outside narrativeBox */}
        {/* Render image only if currentImageUrl is set */}
        {currentImageUrl && (
          <div className={`${styles.lunarImageContainer} ${imageVisible ? styles.fadeInActive : ''}`}>
            <img src={currentImageUrl} alt="Narrative background" className={styles.lunarImage} /> {/* Use currentImageUrl */}
          </div>
        )}

        {/* Narrative Box */}
        {narrativeData && (
          <div className={styles.narrativeBox}>

            {/* Arrow Buttons - Removed */}

            <div
              className={styles.narrativeText}
              ref={textContainerRef}
              onScroll={handleManualScroll}
            >
              {/* Render all page text sequentially */}
              {pagesExist && narrativeData.pages.map((page, i) => (
                <div key={i} className={styles.pageContent}>
                  {page.text}
                </div>
              ))}
            </div>
            <div className={styles.navigation}>
              {/* Play/Pause Button with Ref */}
              {narrativeData && ( // Render when narrative is loaded
                 <button ref={playPauseButtonRef} onClick={handlePlayPause}>
                   {isPausedByUser ? 'Resume' : 'Pause'}
                 </button>
              )}

              {/* Auto Scroll Toggle */}
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={isAutoScrollEnabled} // Updated state
                  onChange={handleToggleAutoScroll} // Updated handler
                />
                Auto Scroll {/* Updated label text */}
              </label>
              {/* Scroll Indicator */}
              <div className={`${styles.scrollIndicator} ${showScrollIndicator ? styles.visible : ''}`}>
                Auto-scrolling...
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default NarrativeReader;
