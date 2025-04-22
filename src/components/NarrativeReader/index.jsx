import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import useAudio from '../../hooks/useAudio';
import useAutoScroll from '../../hooks/useAutoScroll';
import styles from './NarrativeReader.module.scss';

const NarrativeReader = ({
  narrativeId,
  dataPerceptionMode,
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

  // Effect to fetch narrative data and start audio
  useEffect(() => {
    // Reset state when narrativeId changes or is null
    setNarrativeData(null);
    setIsPausedByUser(false); // Reset pause state
    setImageVisible(false); // Reset image visibility
    setTotalScrollableHeight(0); // Reset scroll height
    setAudioDuration(0); // Reset audio duration
    setCurrentImageUrl(null); // Reset current image

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
      setCurrentImageUrl(null); // Clear image before fetching new data


      try {
        // Assuming narratives are in /public/narratives/
        const response = await fetch(`/narratives/${narrativeId}.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setNarrativeData(data);

        // Set initial image from the first page if available
        if (data.pages && data.pages.length > 0 && data.pages[0].imageUrl) {
            setCurrentImageUrl(data.pages[0].imageUrl);
        } else {
            // Optionally set a default image if the first page has none
            // setCurrentImageUrl("/front_pic/default.png");
        }


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
              audioInstance.off(eventName, handleAudioEnd); // Note: This should be handleLoadedMetadata, not handleAudioEnd
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
