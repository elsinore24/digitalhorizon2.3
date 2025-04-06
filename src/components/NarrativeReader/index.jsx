import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAudio from '../../hooks/useAudio';
import styles from './NarrativeReader.module.scss';

const NarrativeReader = ({ narrativeId, dataPerceptionMode }) => { // Revert: Remove props
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
    // Get the audio instance *once* when the effect runs or dependencies change
    const audioInstance = getAudioInstance();
    audioInstanceRef.current = audioInstance; // Store instance in ref

    if (!isPlaying || !narrativeData || !isAutoPageTurnEnabled || isPausedByUser || !audioInstance) {
      // If not playing, no data, auto-turn disabled, paused by user, or no audio instance, clean up listener if needed
      if (audioInstance) { // Check if we have an instance to remove listener from
         // Use the stable handleTimeUpdate from useCallback
         audioInstance.removeEventListener('timeupdate', handleTimeUpdate);
      }
      return; // Exit effect
    }

    // Ensure pages have timestamps (moved check after getting audioInstance)
    if (!narrativeData.pages || !narrativeData.pages.every(p => typeof p.timestamp === 'number')) {
      console.warn("Narrative pages are missing timestamps. Auto page turning disabled.");
      return; // Exit effect
    }

    // Add the listener using the stable handleTimeUpdate
    // console.log("Adding timeupdate listener");
    audioInstance.addEventListener('timeupdate', handleTimeUpdate);

    // Cleanup function also uses the stable handleTimeUpdate
    return () => {
      // console.log("Removing timeupdate listener");
      // Check if audioInstance exists before removing listener
      if (audioInstance) {
         audioInstance.removeEventListener('timeupdate', handleTimeUpdate);
      }
      // Don't nullify audioInstanceRef here, might be needed elsewhere
    };
    // Updated dependencies: include the stable handleTimeUpdate
  }, [isPlaying, narrativeData, isAutoPageTurnEnabled, isPausedByUser, getAudioInstance, handleTimeUpdate]);

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

  // Ensure currentPageText is accessed safely, considering the new structure
  const currentPageData = narrativeData.pages[currentPageIndex];
  const currentPageText = currentPageData ? currentPageData.text : '';
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === narrativeData.pages.length - 1;

  return (
    <div
      className={`${styles.narrativeContainer} ${dataPerceptionMode ? styles.hidden : ''}`} // Conditionally add hidden class
    >
      {/* Use a Fragment to return multiple elements */}
      <>
        {/* NEW: Image Container */}
        {narrativeData && ( // Only show image container if there's a narrative
          <div className={`${styles.lunarImageContainer} ${imageVisible ? styles.fadeInActive : ''}`}>
            <img src="/front_pic/moon.png" alt="Lunar surface" className={styles.lunarImage} />
          </div>
        )}

        {/* Existing Narrative Box */}
        {narrativeData && ( // Conditionally render narrative box as well
          <div className={styles.narrativeBox}>
            <div className={styles.narrativeText}>
              {currentPageText}
            </div>
            <div className={styles.navigation}>
              {/* Previous Button */}
              <button onClick={handlePrevPage} disabled={isFirstPage}>
                Previous
              </button>

              {/* Page Info */}
              <span>Page {currentPageIndex + 1} of {narrativeData.pages.length}</span>

              {/* Next Button */}
              <button onClick={handleNextPage} disabled={isLastPage}>
                Next
              </button>

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