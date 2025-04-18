import { useState, useEffect, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import LunarArrival from '../scenes/LunarArrival'
import DataPerceptionOverlay from './DataPerceptionOverlay';
// import StabilityMeter from './StabilityMeter'; // Remove old import
import TopStatusBar from './TopStatusBar'; // Import new component
import NarrationIndicator from './NarrationIndicator';
import MuteButton from './MuteButton';
import useGameState from '../hooks/useGameState';
import useAudio from '../hooks/useAudio'; // Import useAudio
import useAuth from '../hooks/useAuth';
import useDatabase from '../hooks/useDatabase';
import styles from './GameContainer.module.scss'

export default function GameContainer() {
  const { gameState, toggleDataPerception } = useGameState();
  const { storeAudioStateBeforeToggle, restoreAudioStateAfterToggle } = useAudio(); // Get audio state functions
  const { user } = useAuth();
  const { loadGame } = useDatabase();

  useEffect(() => {
    if (user) {
      loadGame()
    }
  }, [user, loadGame])

  // Create a wrapped toggle function
  const handleToggleDataPerception = useCallback(() => {
    if (!gameState.dataPerceptionActive) {
      // About to turn ON data perception, store audio state
      storeAudioStateBeforeToggle();
    } else {
      // About to turn OFF data perception
      // Use setTimeout to ensure component has updated before restoring audio
      setTimeout(() => {
        restoreAudioStateAfterToggle();
      }, 100); // Small delay to ensure components have updated
    }
    
    // Call the original toggle function
    toggleDataPerception();
  }, [gameState.dataPerceptionActive, toggleDataPerception, storeAudioStateBeforeToggle, restoreAudioStateAfterToggle]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        handleToggleDataPerception(); // Use the wrapped function
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleToggleDataPerception]); // Depend on the wrapped function

  return (
    <div className={styles.container}>
      <Routes>
        <Route path="/" element={<LunarArrival dataPerceptionMode={gameState.dataPerceptionActive} />} />
      </Routes>
      {/* Conditionally render TopStatusBar during specific intro phases */}
      {(gameState.introPhase === 'flashbackNarrative' || gameState.introPhase === 'flashbackChoice') && (
        <TopStatusBar />
      )}

      {/* Render other UI elements */}
      <DataPerceptionOverlay active={gameState.dataPerceptionActive} />
      {/* Removed StabilityMeter rendering */}
      {/* <NarrationIndicator /> */} {/* Temporarily hide */}
      <button
        className={styles.perceptionToggle}
        onClick={handleToggleDataPerception} // Use the wrapped function
      >
        Toggle Data Perception [Tab]
      </button>
      <MuteButton />
    </div>
  )
}
