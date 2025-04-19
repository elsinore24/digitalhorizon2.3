import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAudio from '../../hooks/useAudio';
import styles from './NarrativeReader.module.scss';

const NarrativeReader = ({
  narrativeId,
  dataPerceptionMode,
  backgroundImageUrl = "/front_pic/moon.png", // Default background
  onComplete,
}) => {
  const [narrativeData, setNarrativeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const {
    playAudioFile,
    pauseAudio,
    resumeAudio,
    isPlaying,
    getAudioInstance
  } = useAudio();
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true); // Renamed state
  const [imageVisible, setImageVisible] = useState(false);
  const audioInstanceRef = useRef(null); // Ref to store the audio instance
  const playPauseButtonRef = useRef(null); // Ref for the play/pause button
  const initialPlayTriggeredRef = useRef(false); // Ref to track if initial play was triggered

  const textContainerRef = useRef(null);
  const [totalScrollableHeight, setTotalScrollableHeight] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Effect to fetch narrative data and start audio
  useEffect(() => {
    // Reset state when narrativeId changes or is null
    setNarrativeData(null);
    setIsPausedByUser(false); // Reset pause state
    setImageVisible(false); // Reset image visibility
    setTotalScrollableHeight(0); // Reset scroll height
    setAudioDuration(0); // Reset audio duration

    if (!narrativeId) {
      // If there's an active audio instance from a previous narrative, stop it
      if (audioInstanceRef.current && typeof audioInstanceRef.current.pause === 'function') {
         audioInstanceRef.current.pause();
         audioInstanceRef.current.src = ''; // Detach source
         audioInstanceRef.current = null;
      }
      // Consider calling a stop function from useAudio if available/needed
      return;
    }

    const fetchNarrative = async () => {
      setIsLoading(true);
      setError(null);
      setNarrativeData(null); // Clear previous data
      setIsPausedByUser(false); // Ensure not paused when new narrative starts

      try {
        // Assuming narratives are in /public/narratives/
        const response = await fetch(`/narratives/${narrativeId}.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setNarrativeData(data);

        if (data.audio) {
           console.log('[NarrativeReader] Narrative fetched, loading audio:', data.audio);
           playAudioFile(data.audio);
        } else {
          console.warn(`Narrative ${narrativeId} is missing the 'audio' property in its JSON data.`);
        }

      } catch (e) {
        console.error("[NarrativeReader] CATCH BLOCK: Failed to fetch narrative:", e); // Add specific log
        setError(`Failed to load narrative: ${narrativeId}. Error: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNarrative();
  }, [narrativeId, playAudioFile]);

  // Effect to calculate total scrollable height after narrative data is loaded and rendered
  useEffect(() => {
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
              audioInstance.off(eventName, handleAudioEnd);
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

  // Effect for JavaScript-based auto-scrolling
  useEffect(() => {
    const textContainer = textContainerRef.current;
    const audioInstance = getAudioInstance(); // Get the current audio instance

    // Only proceed if we have the necessary elements, audio is playing, and auto-scroll is enabled
    if (textContainer && audioInstance && isPlaying && !isPausedByUser && isAutoScrollEnabled && totalScrollableHeight > 0 && audioDuration > 0) {

      let animationFrameId;
      let lastScrollTime = 0;

      const scrollText = (timestamp) => {
        // Calculate current scroll position based on audio progress
        const currentTime = audioInstance.seek ? audioInstance.seek() : audioInstance.currentTime;
        const progress = Math.min(1, Math.max(0, currentTime / audioDuration)); // Clamp between 0-1
        const targetScrollTop = totalScrollableHeight * progress;

        // Only update scroll position if audio time has changed significantly (>50ms)
        if (timestamp - lastScrollTime > 50) {
          textContainer.scrollTop = targetScrollTop;
          lastScrollTime = timestamp;

          console.debug('[NarrativeReader] Auto-scroll update:', {
            timestamp,
            currentTime,
            audioDuration,
            progress,
            targetScrollTop,
            actualScrollTop: textContainer.scrollTop,
            scrollHeight: textContainer.scrollHeight,
            clientHeight: textContainer.clientHeight,
            totalScrollableHeight
          });
        }

        // Continue the loop if audio is still playing and auto-scroll is enabled
        if (isPlaying && !isPausedByUser && isAutoScrollEnabled) {
          animationFrameId = requestAnimationFrame(scrollText);
        }
      };

      console.log('[NarrativeReader] Starting JavaScript auto-scroll animation.');
      // Start the animation loop
      animationFrameId = requestAnimationFrame(scrollText);

      // Cleanup function to stop the animation loop
      return () => {
        console.log('[NarrativeReader] Stopping JavaScript auto-scroll animation.');
        cancelAnimationFrame(animationFrameId);
      };
    } else {
       // If conditions are not met, ensure scroll position is reset if auto-scroll was just disabled
       if (textContainer && !isAutoScrollEnabled) {
          textContainer.scrollTop = 0;
          console.log('[NarrativeReader] Auto-scroll disabled, resetting scroll position.');
       }
    }

    // Dependencies: Re-run this effect if these values change
  }, [isPlaying, isPausedByUser, isAutoScrollEnabled, totalScrollableHeight, audioDuration, textContainerRef, getAudioInstance]);


  // Effect to trigger image fade-in
  useEffect(() => {
    if (narrativeData) { // Only trigger if narrative data is loaded
      const timer = setTimeout(() => {
        setImageVisible(true);
      }, 100); // Short delay to ensure rendering before transition starts
      return () => clearTimeout(timer); // Cleanup on unmount or narrative change
    } else {
      setImageVisible(false); // Reset if narrative is cleared
    }
  }, [narrativeData]); // Depend on narrativeData

  // Effect to programmatically click Play/Pause on initial iOS load
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    // Trigger only once on iOS when narrative data is loaded and button ref exists
    if (isIOS && narrativeData && playPauseButtonRef.current && !initialPlayTriggeredRef.current) {
      console.log('[NarrativeReader] iOS detected, narrative loaded. Attempting programmatic click on Play/Pause.');

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
  }, [narrativeData]); // Depend only on narrativeData to trigger after load

  // Reset the trigger flag if the narrative changes
  useEffect(() => {
    initialPlayTriggeredRef.current = false;
  }, [narrativeId]);

  // Effect for handling narrative completion
  useEffect(() => {
    const audioInstance = getAudioInstance(); // Use getAudioInstance to get the current instance
    // Check if onComplete is actually a function before proceeding
    if (!audioInstance || !narrativeData || typeof onComplete !== 'function') {
      return; // Exit if no audio, data, or valid callback
    }

    const handleAudioEnd = () => {
      console.log('[NarrativeReader] Audio ended. Calling onComplete.');
      onComplete();
    };

    // Howler uses 'end', HTMLAudioElement uses 'ended'
    const eventName = 'end'; // Assuming useAudio provides a Howler instance or similar event emitter

    // Ensure addEventListener/removeEventListener exist on the instance
    if (typeof audioInstance.addEventListener === 'function' && typeof audioInstance.removeEventListener === 'function') {
       audioInstance.addEventListener(eventName, handleAudioEnd);
    } else if (typeof audioInstance.on === 'function' && typeof audioInstance.off === 'function') {
       // Handle cases where it might use .on/.off (like Howler v2)
       audioInstance.on(eventName, handleAudioEnd);
    } else {
       console.warn('[NarrativeReader] Audio instance does not support standard event listeners (addEventListener/on). Cannot track end.');
       return; // Cannot proceed without event listeners
    }

    return () => {
      if (audioInstance) {
        if (typeof audioInstance.removeEventListener === 'function') {
           audioInstance.removeEventListener(eventName, handleAudioEnd);
        } else if (typeof audioInstance.off === 'function') {
           audioInstance.off(eventName, handleAudioEnd);
        }
      }
    };
    // Re-run if audio instance changes, narrative changes, or callback changes
  }, [narrativeData, onComplete, getAudioInstance]);

  // Handler for the Play/Pause button
  const handlePlayPause = () => {
    if (isPlaying && !isPausedByUser) {
      pauseAudio();
      setIsPausedByUser(true);
    } else {
      resumeAudio();
      setIsPausedByUser(false);
    }
  };

  // Handler for the Auto Scroll toggle (Renamed)
  const handleToggleAutoScroll = () => {
    setIsAutoScrollEnabled(prev => !prev); // Updated state
  };

  // Manual scroll test function
  const handleManualScrollTest = () => {
    if (textContainerRef.current) {
      const container = textContainerRef.current;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const scrollableHeight = scrollHeight - clientHeight;
      
      // Scroll to bottom then back to top
      container.scrollTop = scrollableHeight;
      setTimeout(() => {
        container.scrollTop = 0;
      }, 1000);
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
        {narrativeData && (
          <div className={`${styles.lunarImageContainer} ${imageVisible ? styles.fadeInActive : ''}`}>
            <img src={backgroundImageUrl} alt="Narrative background" className={styles.lunarImage} />
          </div>
        )}

        {/* Narrative Box */}
        {narrativeData && (
          <div className={styles.narrativeBox}>

            {/* Arrow Buttons - Removed */}

            <div
              className={styles.narrativeText}
              ref={textContainerRef}
              // Removed onScroll handler
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

              {/* Manual Scroll Test Button */}
              <button onClick={handleManualScrollTest}>
                Test Scroll
              </button>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default NarrativeReader;
