import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAudio from '../../hooks/useAudio';
import styles from './NarrativeReader.module.scss';

const NarrativeReader = ({ narrativeId, dataPerceptionMode }) => { // Accept dataPerceptionMode prop
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
  // const { playAudio } = useAudio(); // Placeholder for audio hook usage

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
        playAudioFile(`audio/narration/${narrativeId}.mp3`); // Construct path from narrativeId
        
        // Removed TODO related to data.audio
        // playAudio(data.audio);
      } catch (e) {
        console.error("[NarrativeReader] CATCH BLOCK: Failed to fetch narrative:", e); // Add specific log
        setError(`Failed to load narrative: ${narrativeId}. Error: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNarrative();
  // Re-add playAudioFile dependency since it's used in the effect
  }, [narrativeId, playAudioFile]); // Add playAudioFile back as dependency

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
  // Effect for handling audio time updates and auto page turning
  useEffect(() => {
    if (!isPlaying || !narrativeData || !isAutoPageTurnEnabled || isPausedByUser) {
      // If not playing, no data, auto-turn disabled, or paused by user, do nothing with time updates
      // We might still want to clean up the listener if isPlaying becomes false
      if (!isPlaying && audioInstanceRef.current) {
         audioInstanceRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      }
      return;
    }

    // Ensure pages have timestamps
    if (!narrativeData.pages || !narrativeData.pages.every(p => typeof p.timestamp === 'number')) {
      console.warn("Narrative pages are missing timestamps. Auto page turning disabled.");
      return;
    }

    const audioInstance = getAudioInstance();
    audioInstanceRef.current = audioInstance; // Store instance in ref

    const handleTimeUpdate = () => {
      if (!audioInstance || !narrativeData || !isAutoPageTurnEnabled || isPausedByUser) return;

      const currentTime = audioInstance.currentTime;
      let newPageIndex = 0;

      // Find the latest page whose timestamp is less than or equal to the current time
      for (let i = narrativeData.pages.length - 1; i >= 0; i--) {
        if (narrativeData.pages[i].timestamp <= currentTime) {
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
    };

    if (audioInstance) {
      // console.log("Adding timeupdate listener");
      audioInstance.addEventListener('timeupdate', handleTimeUpdate);

      // Cleanup function
      return () => {
        // console.log("Removing timeupdate listener");
        audioInstance.removeEventListener('timeupdate', handleTimeUpdate);
        // Don't nullify audioInstanceRef here, might be needed elsewhere
      };
    }
  }, [isPlaying, narrativeData, isAutoPageTurnEnabled, isPausedByUser, getAudioInstance, setCurrentPageIndex]);

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

              {/* Play/Pause Button */}
              {isPlaying && ( // Only show if audio context thinks it's playing
                 <button onClick={handlePlayPause}>
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