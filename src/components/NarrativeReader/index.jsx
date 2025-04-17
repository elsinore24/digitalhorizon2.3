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
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
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
  const [isAutoPageTurnEnabled, setIsAutoPageTurnEnabled] = useState(true);
  const [imageVisible, setImageVisible] = useState(false);
  const audioInstanceRef = useRef(null); // Ref to store the audio instance
  const playPauseButtonRef = useRef(null); // Ref for the play/pause button
  const initialPlayTriggeredRef = useRef(false); // Ref to track if initial play was triggered

  // Effect to fetch narrative data and start audio
  useEffect(() => {
    // Reset state when narrativeId changes or is null
    setNarrativeData(null);
    setCurrentPageIndex(0);
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
      setCurrentPageIndex(0); // Reset page index on new narrative load
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
    const audioInstance = audioInstanceRef.current; // Use the ref here
    // Check audioInstance exists before accessing properties
    if (!audioInstance || !narrativeData || !isAutoPageTurnEnabled || isPausedByUser) return;

    const currentTime = audioInstance.currentTime;
    let newPageIndex = 0;

    // Ensure pages exist before iterating
    if (!narrativeData.pages) return;

    // Find the latest page whose timestamp is less than or equal to the current time
    for (let i = narrativeData.pages.length - 1; i >= 0; i--) {
      // Ensure timestamp exists and is a number
      if (typeof narrativeData.pages[i]?.timestamp === 'number' && narrativeData.pages[i].timestamp <= currentTime) {
        newPageIndex = i;
        break;
      }
    }

    // Update the page index if it's different from the current one
    setCurrentPageIndex(prevIndex => {
      if (newPageIndex !== prevIndex) {
        // console.log(`Time: ${currentTime.toFixed(2)}s, Auto-turning to page: ${newPageIndex + 1}`);
        return newPageIndex;
      }
      return prevIndex; // No change needed
    });
  }, [narrativeData, isAutoPageTurnEnabled, isPausedByUser, setCurrentPageIndex]); // Dependencies for useCallback

  // Effect for handling audio time updates and auto page turning
  useEffect(() => {
    const audioInstance = getAudioInstance();
    audioInstanceRef.current = audioInstance;

    if (!isPlaying || !narrativeData || !isAutoPageTurnEnabled || isPausedByUser || !audioInstance) {
      if (audioInstance) {
        audioInstance.removeEventListener('timeupdate', handleTimeUpdate);
      }
      return;
    }

    if (!narrativeData.pages || !narrativeData.pages.every(p => typeof p.timestamp === 'number')) {
      console.warn("Narrative pages are missing timestamps. Auto page turning disabled.");
      // Don't add listener if timestamps are missing
    } else {
      // Add timeupdate listener only if timestamps exist
      audioInstance.addEventListener('timeupdate', handleTimeUpdate);
    }

    // Cleanup function
    return () => {
      if (audioInstance) {
        audioInstance.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [isPlaying, narrativeData, isAutoPageTurnEnabled, isPausedByUser, getAudioInstance, handleTimeUpdate]);


  // Effect for handling narrative completion
  useEffect(() => {
    const audioInstance = audioInstanceRef.current;
    // Check if onComplete is actually a function before proceeding
    if (!audioInstance || !narrativeData || typeof onComplete !== 'function') {
      return; // Exit if no audio, data, or valid callback
    }

    const handleAudioEnd = () => {
      console.log('[NarrativeReader] Audio ended.');
      // Check if we are on the last page when audio ends
      // Use a local variable inside the handler to get the latest index
      const currentIdx = currentPageIndex;
      const isActuallyLastPage = currentIdx === narrativeData.pages.length - 1;

      if (isActuallyLastPage) {
        console.log('[NarrativeReader] Audio ended on last page. Calling onComplete.');
        onComplete();
      } else {
         console.log(`[NarrativeReader] Audio ended, but not on last page (current: ${currentIdx}, total: ${narrativeData.pages.length}).`);
         // Optionally, force navigation to last page here if desired,
         // or let the user navigate manually. For now, just call onComplete if on last page.
      }
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
    // IMPORTANT: Do NOT add currentPageIndex here, as it would re-register the listener on every page turn.
    // The check for the last page happens *inside* the handleAudioEnd callback.
  }, [narrativeData, onComplete, getAudioInstance]); // Depend on getAudioInstance to get the correct instance

  const handleNextPage = () => {
    if (narrativeData && currentPageIndex < narrativeData.pages.length - 1) {
      setCurrentPageIndex(prevIndex => prevIndex + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prevIndex => prevIndex - 1);
    }
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

  // Handler for the Auto Page Turn toggle
  const handleToggleAutoPageTurn = () => {
    setIsAutoPageTurnEnabled(prev => !prev);
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

  // Safely access page data and text
  const pagesExist = narrativeData && Array.isArray(narrativeData.pages) && narrativeData.pages.length > 0;
  const currentPageData = pagesExist && narrativeData.pages[currentPageIndex] ? narrativeData.pages[currentPageIndex] : null;
  const currentPageText = currentPageData ? currentPageData.text : 'Loading page...'; // Provide default text
  const totalPages = pagesExist ? narrativeData.pages.length : 0;
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = pagesExist ? currentPageIndex === totalPages - 1 : true; // Default to true if no pages

  return (
    <div
      className={`${styles.narrativeContainer} ${dataPerceptionMode ? styles.hidden : ''}`} // Conditionally add hidden class
    >
      {/* Use a Fragment to return multiple elements */}
      <>
        {/* NEW: Image Container */}
        {narrativeData && ( // Only show image container if there's a narrative
          <div className={`${styles.lunarImageContainer} ${imageVisible ? styles.fadeInActive : ''}`}>
            <img src={backgroundImageUrl} alt="Narrative background" className={styles.lunarImage} />
          </div>
        )}

        {/* Existing Narrative Box */}
        {narrativeData && ( // Conditionally render narrative box as well
          <div className={styles.narrativeBox}>
            {/* Add Arrow Buttons */}
            <button className={styles.prevArrow} onClick={handlePrevPage} disabled={isFirstPage}>&lt;</button>
            <button className={styles.nextArrow} onClick={handleNextPage} disabled={isLastPage}>&gt;</button>

            <div className={styles.narrativeText}>
              {currentPageText}
            </div>
            <div className={styles.navigation}>
              {/* Previous Button Removed */}

              {/* Page Info */}
              <span>Page {currentPageIndex + 1} of {totalPages}</span>

              {/* Next Button Removed */}

              {/* Play/Pause Button with Ref */}
              {narrativeData && ( // Render when narrative is loaded
                 <button ref={playPauseButtonRef} onClick={handlePlayPause}>
                   {isPausedByUser ? 'Resume' : 'Pause'}
                 </button>
              )}

              {/* Auto Page Turn Toggle */}
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={isAutoPageTurnEnabled}
                  onChange={handleToggleAutoPageTurn}
                />
                Auto Turn Pages
              </label>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default NarrativeReader;