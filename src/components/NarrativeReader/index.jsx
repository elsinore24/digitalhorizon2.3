import React, { useState, useEffect } from 'react';
import useAudio from '../../hooks/useAudio'; // Assuming audio control is needed
import styles from './NarrativeReader.module.scss';

const NarrativeReader = ({ narrativeId, dataPerceptionMode }) => { // Accept dataPerceptionMode prop
  const [narrativeData, setNarrativeData] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { playAudioFile } = useAudio(); // Get the new function
  // const { playAudio } = useAudio(); // Placeholder for audio hook usage

  useEffect(() => {
    if (!narrativeId) {
      setNarrativeData(null);
      setCurrentPageIndex(0);
      return;
    }

    const fetchNarrative = async () => {
      setIsLoading(true);
      setError(null);
      setNarrativeData(null); // Clear previous data
      setCurrentPageIndex(0); // Reset page index

      try {
        // Assuming narratives are in /public/narratives/
        const response = await fetch(`/narratives/${narrativeId}.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setNarrativeData(data);
        // Trigger audio playback using the path from the fetched data
        if (data.audio) {
          playAudioFile(data.audio); // Re-enabled audio playback trigger
        }
        // TODO: Trigger audio playback here using data.audio
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
  }, [narrativeId]); // Removed playAudioFile from dependency array again to test loop theory

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

  if (isLoading) {
    return <div className={styles.loading}>Loading Narrative...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!narrativeData) {
    return null; // Or some placeholder if needed when no narrative is active
  }

  const currentPageText = narrativeData.pages[currentPageIndex];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === narrativeData.pages.length - 1;

  return (
    <div
      className={`${styles.narrativeContainer} ${dataPerceptionMode ? styles.hidden : ''}`} // Conditionally add hidden class
      // style={{ display: dataPerceptionMode ? 'none' : 'block' }} // Removed inline style
    >
      <div className={styles.narrativeBox}>
        <div className={styles.narrativeText}>
          {currentPageText}
        </div>
        <div className={styles.navigation}>
          <button onClick={handlePrevPage} disabled={isFirstPage}>
            Previous
          </button>
          <span>Page {currentPageIndex + 1} of {narrativeData.pages.length}</span>
          <button onClick={handleNextPage} disabled={isLastPage}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default NarrativeReader;