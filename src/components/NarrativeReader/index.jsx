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
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScrollHeight, setMaxScrollHeight] = useState(0);

  // Effect to fetch narrative data and start audio
  useEffect(() => {
    // Reset state when narrativeId changes or is null
    setNarrativeData(null);
    // Removed setCurrentPageIndex(0);
    setIsPausedByUser(false); // Reset pause state
    setImageVisible(false); // Reset image visibility

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
        // Trigger audio playback using the narrativeId to construct the correct path
        // The audio files are stored in public/audio/narration/ with the narrativeId as filename
        // Revert: Always try to play audio on fetch (unless it's iOS and handled by handleEnter timeout)
        // We rely on the AudioContext to handle the potential delay/pending state.
        if (data.audio) {
           // The playAudioFile call might be deferred by handleEnter on iOS
           // For non-iOS or subsequent loads, this should play directly.
           // Let AudioContext handle the actual playback logic based on its state.
           // playAudioFile(data.audio); // Removed direct call here, handleEnter handles initial iOS play
           console.log('[NarrativeReader] Narrative fetched, audio path:', data.audio);
           // Always attempt to load the audio file when narrative data is fetched.
           // The actual playback start might be deferred or handled by the programmatic click.
           console.log('[NarrativeReader] Narrative fetched, loading audio:', data.audio);
           playAudioFile(data.audio);
        } else {
          console.warn(`Narrative ${narrativeId} is missing the 'audio' property in its JSON data.`);
        }

        // Removed TODO related to data.audio
        // Removed line: playAudio(data.audio);
      } catch (e) {
        console.error("[NarrativeReader] CATCH BLOCK: Failed to fetch narrative:", e); // Add specific log
        setError(`Failed to load narrative: ${narrativeId}. Error: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNarrative();
  // Re-add playAudioFile dependency since it's used in the effect
  }, [narrativeId, playAudioFile]); // Revert: Remove immediatePlaybackNeeded dependency

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

  // Define handleTimeUpdate using useCallback before the effect
  const handleTimeUpdate = useCallback(() => {
    const audioInstance = audioInstanceRef.current;
    // Check if auto-scroll is enabled and not paused by user
    if (!audioInstance || !narrativeData || !isAutoScrollEnabled || isPausedByUser || !textContainerRef.current) return;

    const currentTime = audioInstance.currentTime;
    const pages = narrativeData.pages;
    const textContainer = textContainerRef.current;

    // Find the current page index based on timestamp
    let currentPageIndex = 0;
    for (let i = 0; i < pages.length; i++) {
      if (currentTime >= pages[i].timestamp) {
        currentPageIndex = i;
      } else {
        break;
      }
    }

    const currentPage = pages[currentPageIndex];
    // Check if audioInstance.duration is a function (Howler) or a property (HTMLAudioElement)
    const audioDuration = typeof audioInstance.duration === 'function' ? audioInstance.duration() : audioInstance.duration;
    const nextPageTimestamp = currentPageIndex < pages.length - 1 ? pages[currentPageIndex + 1].timestamp : audioDuration;
    const segmentDuration = nextPageTimestamp - currentPage.timestamp;
    const timeIntoSegment = currentTime - currentPage.timestamp;

    // Calculate progress within the current audio segment (0 to 1)
    const segmentProgress = segmentDuration > 0 ? Math.min(1, Math.max(0, timeIntoSegment / segmentDuration)) : 0;

    // Calculate the scroll height up to the beginning of the current page
    let scrollHeightBeforeCurrentPage = 0;
    if (textContainer.children) {
      // Note: textContainer.children includes all direct children, which are the pageContent divs
      for (let i = 0; i < currentPageIndex; i++) {
        if (textContainer.children[i]) {
           scrollHeightBeforeCurrentPage += textContainer.children[i].offsetHeight;
        }
      }
    }

    // Calculate the height of the current page's text element
    const currentPageElement = textContainer.children[currentPageIndex];
    const currentPageHeight = currentPageElement ? currentPageElement.offsetHeight : 0;

    // Calculate the target scroll position by interpolating within the current page
    const targetScrollPosition = scrollHeightBeforeCurrentPage + (currentPageHeight * segmentProgress);

    // Ensure we don't scroll past the maximum scrollable height
    const maxScrollHeight = textContainer.scrollHeight - textContainer.clientHeight;
    const finalTargetScrollPosition = Math.min(maxScrollHeight, targetScrollPosition);


    if (textContainer) {
      // Smoothly scroll to the target position
      textContainer.scrollTo({
        top: finalTargetScrollPosition,
        behavior: 'smooth'
      });
      // setScrollPosition(finalTargetScrollPosition); // Optionally update state for UI feedback if needed
    }
  }, [narrativeData, isAutoScrollEnabled, isPausedByUser]); // Dependencies seem correct

  // Effect for handling audio time updates and auto scrolling
  useEffect(() => {
    const audioInstance = getAudioInstance();
    audioInstanceRef.current = audioInstance;

    // Only add listener if audio is playing, narrative data exists, auto-scroll is enabled, and not paused by user
    if (!isPlaying || !narrativeData || !isAutoScrollEnabled || isPausedByUser || !audioInstance) { // Updated state check
      if (audioInstance) {
        audioInstance.removeEventListener('timeupdate', handleTimeUpdate);
      }
      return;
    }

    // Add timeupdate listener for auto-scrolling
    audioInstance.addEventListener('timeupdate', handleTimeUpdate);

    // Cleanup function
    return () => {
      if (audioInstance) {
        audioInstance.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [isPlaying, narrativeData, isAutoScrollEnabled, isPausedByUser, getAudioInstance, handleTimeUpdate]); // Updated dependency


  // Effect for handling narrative completion
  useEffect(() => {
    const audioInstance = audioInstanceRef.current;
    // Check if onComplete is actually a function before proceeding
    if (!audioInstance || !narrativeData || typeof onComplete !== 'function') {
      return; // Exit if no audio, data, or valid callback
    }

    const handleAudioEnd = () => {
      console.log('[NarrativeReader] Audio ended. Calling onComplete.');
      // Removed page index check
      onComplete();
    };

    // Howler uses 'end', HTMLAudioElement uses 'ended'
    // Assuming useAudio provides a Howler instance or similar event emitter
    const eventName = 'end';
    // Ensure addEventListener/removeEventListener exist on the instance
    if (typeof audioInstance.addEventListener === 'function' && typeof audioInstance.removeEventListener === 'function') {
       audioInstance.addEventListener(eventName, handleAudioEnd);
       // console.log(`[NarrativeReader] Added ${eventName} listener.`);
    } else if (typeof audioInstance.on === 'function' && typeof audioInstance.off === 'function') {
       // Handle cases where it might use .on/.off (like Howler v2)
       audioInstance.on(eventName, handleAudioEnd);
       // console.log(`[NarrativeReader] Added ${eventName} listener using .on()`);
    } else {
       console.warn('[NarrativeReader] Audio instance does not support standard event listeners (addEventListener/on). Cannot track end.');
       return; // Cannot proceed without event listeners
    }


    return () => {
      if (audioInstance) {
        // console.log(`[NarrativeReader] Removing ${eventName} listener.`);
        if (typeof audioInstance.removeEventListener === 'function') {
           audioInstance.removeEventListener(eventName, handleAudioEnd);
        } else if (typeof audioInstance.off === 'function') {
           audioInstance.off(eventName, handleAudioEnd);
        }
      }
    };
    // Re-run if audio instance changes, narrative changes, or callback changes
    // Removed currentPageIndex dependency
  }, [narrativeData, onComplete, getAudioInstance]); // Depend on getAudioInstance to get the correct instance

  const handleScroll = (direction) => {
    if (!textContainerRef.current) return;

    const scrollAmount = textContainerRef.current.clientHeight * 0.8;
    const newPosition = direction === 'up'
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(maxScrollHeight, scrollPosition + scrollAmount);

    textContainerRef.current.scrollTo({
      top: newPosition,
      behavior: 'smooth'
    });
    setScrollPosition(newPosition);
  };

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

  // Effect to calculate maxScrollHeight when narrative data or container size changes
  useEffect(() => {
    if (textContainerRef.current) {
      // Calculate the maximum scrollable height
      // scrollHeight is the total height of the content
      // clientHeight is the visible height of the container
      const calculatedMaxScrollHeight = textContainerRef.current.scrollHeight - textContainerRef.current.clientHeight;
      setMaxScrollHeight(calculatedMaxScrollHeight);
    }
  }, [narrativeData]); // Recalculate when narrative data changes

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

            {/* Arrow Buttons */}
            <button
              className={styles.prevArrow}
              onClick={() => handleScroll('up')}
              disabled={scrollPosition <= 0}
            >
              {'<'}
            </button>
            <button
              className={styles.nextArrow}
              onClick={() => handleScroll('down')}
              disabled={scrollPosition >= maxScrollHeight}
            >
              {'>'}
            </button>

            <div
              className={styles.narrativeText}
              ref={textContainerRef}
              onScroll={(e) => setScrollPosition(e.target.scrollTop)}
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
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default NarrativeReader;
