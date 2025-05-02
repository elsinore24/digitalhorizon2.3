import React, { useCallback } from 'react'; // Import useCallback
import { BrowserRouter as Router } from 'react-router-dom';
import GameContainer from './components/GameContainer';
import DialogueDisplay from './components/DialogueDisplay';
// import AudioVisualizer from './components/AudioVisualizer'; // Commented out as per previous state
import { AudioProvider } from './contexts/AudioContext';
import { AuthProvider } from './contexts/AuthContext';
import useAudio from './hooks/useAudio';
// import useGameState from './hooks/useGameState'; // Removed - using Zustand hook now
import { useGameStore } from './store/useGameStore'; // Import useGameStore
import SignalTuningInterface from './components/SignalTuningInterface'; // Import SignalTuningInterface
import NarrativeReader from './components/NarrativeReader'; // Import NarrativeReader
import PerceptionPage from './components/PerceptionPage'; // Import PerceptionPage
import MuteButton from './components/MuteButton'; // Import MuteButton

// Wrapper component to use hooks
function AppContent() {
  const { isPlaying, storeAudioStateBeforeToggle, restoreAudioStateAfterToggle } = useAudio(); // Get audio state functions
  // Access gameState and currentNodeId from Zustand store
  const { gameState, currentNodeId, currentView, setView } = useGameStore(state => ({
    gameState: state.gameState,
    currentNodeId: state.gameState.currentNodeId,
    currentView: state.currentView,
    setView: state.setView,
  }));

  // Placeholder function for advanceNarrative
  // Get the action directly from the store hook
  const advanceNarrativeAction = useGameStore((state) => state.advanceNarrativeAction);

  // This function is passed as a prop
  const handleAdvanceNarrative = useCallback((chosenInterpretationId) => {
      console.log(`App: handleAdvanceNarrative called with ${chosenInterpretationId}`);
      // Call the Zustand action
      advanceNarrativeAction(chosenInterpretationId);
  }, [advanceNarrativeAction]); // Depend on the action from the store

  // Wrapped toggle function for the Perception button
  const handleTogglePerception = useCallback(() => {
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

  // Add a check in case gameState is initially undefined during hydration/setup
  if (!gameState) {
    return null; // Or a loading indicator
  }

  // Define the node ID that triggers the Signal Tuning Interface
  const SIGNAL_TUNING_NODE_ID = 'signal_tuning_node'; // Placeholder node ID - replace with actual ID

  // Conditionally render SignalTuningInterface or NarrativeReader and other game content
  // Conditionally render SignalTuningInterface or NarrativeReader and other game content
  return (
    <>
      {/* Conditionally render NarrativeReader or PerceptionPage */}
      {currentView === 'narrative' ? (
        <NarrativeReader dataPerceptionMode={gameState.dataPerceptionActive} /> // Pass dataPerceptionMode
      ) : (
        <PerceptionPage
          // Pass necessary props to PerceptionPage if needed
          // advanceNarrative={handleAdvanceNarrative} // Example: if PerceptionPage needs to trigger narrative advance directly
        />
      )}

      {/* Only show visualizer if playing AND data perception is OFF */}
      {/* {isPlaying && !gameState.dataPerceptionActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          // alignItems: 'center', // Removed for top alignment
          justifyContent: 'center', // Re-added for horizontal centering
          paddingTop: '20px', // Keep vertical padding
          // paddingLeft: '20px', // Removed, using justifyContent now
          zIndex: 9999, // Increased z-index to ensure it's above everything
          pointerEvents: 'none',
          background: 'rgba(0, 0, 0, 0.2)', // Semi-transparent background
        }}>
          <div style={{ height: '100px' }}> {/* Reduced height */}
            {/* <AudioVisualizer /> */}
          {/* </div>
        </div>
      )} */}
      <GameContainer />
      {/* Render DialogueDisplay unconditionally, pass isHidden prop */}
      <DialogueDisplay isHidden={gameState.dataPerceptionActive} />

      {/* Toggle Data Perception Button */}
      <button
        onClick={handleTogglePerception}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 3000, // Ensure it's on top
          backgroundColor: 'var(--color-primary)',
          color: 'black',
          border: 'none',
          padding: '8px 15px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Toggle Data Perception ({currentView === 'narrative' ? 'Show Data' : 'Show Narrative'})
      </button>

      {/* Mute Button */}
      <MuteButton style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 3000 }} /> {/* Add inline styles for positioning and z-index */}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        {/* <GameStateProvider> Removed */}
          <AudioProvider>
            <AppContent />
          </AudioProvider>
        {/* </GameStateProvider> Removed */}
      </Router>
    </AuthProvider>
  );
}
