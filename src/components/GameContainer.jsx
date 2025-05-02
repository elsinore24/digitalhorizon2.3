import { useState, useEffect, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import LunarArrival from '../scenes/LunarArrival'
import DataPerceptionOverlay from './DataPerceptionOverlay';
// import StabilityMeter from './StabilityMeter'; // Remove old import
import TopStatusBar from './TopStatusBar'; // Import new component
import NarrationIndicator from './NarrationIndicator';
import MuteButton from './MuteButton';
// import useGameState from '../hooks/useGameState'; // Remove old import
import useAudio from '../hooks/useAudio'; // Import useAudio
import useAuth from '../hooks/useAuth';
import { useGameStore } from '../store/useGameStore'; // Import useGameStore
import useDatabase from '../hooks/useDatabase';
import styles from './GameContainer.module.scss'

export default function GameContainer() {
  // const { gameState, toggleDataPerception } = useGameState(); // Remove old hook usage
  const { storeAudioStateBeforeToggle, restoreAudioStateAfterToggle } = useAudio(); // Get audio state functions
  const { user } = useAuth();
  const { loadGame } = useDatabase();

  // Get currentView and setView from Zustand store
  const { currentView, setView } = useGameStore(state => ({
    currentView: state.currentView,
    setView: state.setView,
  }));

  // Read gameState from Zustand store
  const gameState = useGameStore(state => state.gameState);


  useEffect(() => {
    if (user) {
      loadGame()
    }
  }, [user, loadGame])

  // Create a wrapped toggle function
  const handleToggleDataPerception = useCallback(() => {
    // Determine the next view
    const nextView = currentView === 'narrative' ? 'perception' : 'narrative';

    if (nextView === 'perception') {
      // About to switch to perception, store audio state
      storeAudioStateBeforeToggle();
    } else {
      // About to switch back to narrative
      // Use setTimeout to ensure component has updated before restoring audio
      setTimeout(() => {
        restoreAudioStateAfterToggle();
      }, 100); // Small delay to ensure components have updated
    }

    // Call the setView action from Zustand
    setView(nextView);

  }, [currentView, setView, storeAudioStateBeforeToggle, restoreAudioStateAfterToggle]); // Depend on currentView and setView

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
    </div>
  )
}
