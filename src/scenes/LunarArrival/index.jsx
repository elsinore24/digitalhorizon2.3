import { useState, useEffect } from 'react';
import useAudio from '../../hooks/useAudio';
import TemporalEcho from '../../components/TemporalEcho';
import { useGameStore } from '../../store/useGameStore'; // Import useGameStore to access actions
import Scene3D from '../../components/Scene3D';
import DataPerceptionOverlay from '../../components/DataPerceptionOverlay';
import NarrativeReader from '../../components/NarrativeReader';
import RedAlertInterface from '../../components/RedAlertInterface'; // Import new component
import FlashbackLabScene from '../../components/FlashbackLabScene'; // Import new component
import IntroTransition from '../../components/IntroTransition'; // Import new component
import ChoicePoint from '../../components/ChoicePoint'; // Import new component
import SignalTuningInterface from '../../components/SignalTuningInterface'; // Import SignalTuningInterface component
import { destinations } from '../../config/destinations';
import styles from './LunarArrival.module.scss';

const LunarArrival = ({ dataPerceptionMode }) => {
  // Get gameState, currentNodeId, activeTuningChallenge, visitScene, updateGameState, and setRedAlertActive from the useGameStore
  const { gameState, currentNodeId, activeTuningChallenge, visitScene, updateGameState, setRedAlertActive } = useGameStore(state => ({
    gameState: state.gameState,
    currentNodeId: state.gameState.currentNodeId,
    activeTuningChallenge: state.activeTuningChallenge,
    visitScene: state.visitScene,
    updateGameState: state.updateGameState,
    setRedAlertActive: state.setRedAlertActive,
  }));
  const { isIOS, playAudioFile, resumeContextAndUnlock } = useAudio();

  // Placeholder for lab background image path
  const labBackgroundImage = 'front_pic/lab.jpg'; // Corrected path and extension, removed leading slash
  // Placeholder for flashback narrative ID
  const flashbackNarrativeId = 'flashback_intro'; // TODO: Replace with actual narrative ID
  // Removed old useEffect that triggered moon_dialogue

  // --- Intro Sequence Handlers (These will need to be refactored later to use state flags) ---
  // For now, removing setIntroPhase calls to decouple from the old logic
  const handleEnter = async () => {
    console.log('Entering Digital Horizons - Triggering Red Alert.');
    
    // Resume audio context and unlock audio on iOS
    console.log("Initial user interaction detected. Resuming context and attempting silent play...");
    try {
      await resumeContextAndUnlock();
      console.log("Audio context resumed and unlocked successfully.");
    } catch (error) {
      console.error("Failed to resume/unlock audio context:", error);
      // Continue anyway, as we still want to show the Red Alert
    }
    
    // Trigger the Red Alert using the new state flag
    setRedAlertActive(true);
    // Removed old logic to set currentNodeId and visitScene here
  };

  const handleAttemptRealign = () => {
    console.log('Attempting Neural Realignment - Triggering Transition (Placeholder)');
    // Set the introPhase to 'transitioning' to show the IntroTransition component
    updateGameState({ introPhase: 'transitioning' });
    // Also set the Red Alert to inactive since we're moving to the next phase
    setRedAlertActive(false);
  };

  const handleTransitionComplete = () => {
    console.log('Transition Complete - Triggering Flashback Narrative (Placeholder)');
    // Set the currentNodeId to trigger the NarrativeReader and update the introPhase
    updateGameState({
      currentNodeId: flashbackNarrativeId,
      introPhase: 'flashbackNarrative' // Change from 'transitioning' to 'flashbackNarrative'
    });
  };

  const handleNarrativeComplete = () => {
    console.log('Flashback Narrative Complete - Triggering Choice Point (Placeholder)');
    // TODO: Trigger Choice Point using a game state flag
  };

  const handleFlashbackChoice = (choice) => {
    console.log(`Flashback Choice Selected: ${choice} (Placeholder)`);
    // Update game state with the choice
    updateGameState({ player: { ...gameState.player, flashbackChoice: choice } });
    // TODO: Transition to the main game view using a game state flag or by setting the next narrative node
  };

  // Add logging to check gameState and currentNodeId/activeTuningChallenge
  console.log('[LunarArrival] Rendering. GameState:', gameState);
  if (!gameState) {
    console.log('[LunarArrival] gameState is null/undefined, returning null.');
    return null;
  }
  console.log(`[LunarArrival] Rendering with currentNodeId: ${currentNodeId}, activeTuningChallenge: ${activeTuningChallenge ? activeTuningChallenge.id : 'none'}`);


  // --- Render Logic ---

  return (
    <div className={styles.sceneContainer}>
      {/* Always render the 3D background */}
      <Scene3D dataPerceptionMode={dataPerceptionMode} />

      {/* Render Narrative Reader when a currentNodeId is set and no tuning challenge is active */}
      {currentNodeId && !activeTuningChallenge && (
        <NarrativeReader
          narrativeToLoad={currentNodeId} // Load narrative based on currentNodeId
          backgroundImageUrl={labBackgroundImage} // Use placeholder image
          // NarrativeReader now handles its own completion based on 'next' property
        />
      )}

      {/* Render Signal Tuning Interface when a tuning challenge is active */}
      {activeTuningChallenge && (
        <SignalTuningInterface
          challengeConfig={activeTuningChallenge}
          // advanceNarrative prop is passed in GameContainer
        />
      )}


      {/* --- Overlays based on State Flags (Placeholder - will be refactored) --- */}
      {/* These components will need new state flags to control their rendering */}

      {/* Example: Initial Enter Button (Placeholder - needs new state flag) */}
      {gameState.introPhase === 'initial' && ( // Keep for now, will be refactored
        <div style={{ zIndex: 1200, position: 'relative' }}>
          <button className={styles.enterButton} onClick={handleEnter}>
            Enter Digital Horizons
          </button>
        </div>
      )}

      {/* Example: Red Alert Interface (Placeholder - needs new state flag) */}
      {/* Example: Red Alert Interface (Now controlled by isRedAlertActive flag) */}
      {gameState.isRedAlertActive && (
        <RedAlertInterface onAttemptRealign={handleAttemptRealign} />
      )}

      {/* Example: Flashback Lab Scene Background (Placeholder - needs new state flag) */}
      {(gameState.introPhase === 'transitioning' || gameState.introPhase === 'flashbackNarrative' || gameState.introPhase === 'flashbackChoice') && ( // Keep for now, will be refactored
        <FlashbackLabScene />
      )}

      {/* Example: Intro Transition (Placeholder - needs new state flag) */}
      {gameState.introPhase === 'transitioning' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1500,
          pointerEvents: 'auto'
        }}>
          <IntroTransition onComplete={handleTransitionComplete} startTransition={true} /> {/* Pass startTransition prop */}
        </div>
      )}

      {/* Example: Choice Point (Placeholder - needs new state flag) */}
      {gameState.introPhase === 'flashbackChoice' && ( // Keep for now, will be refactored
        <ChoicePoint onChoiceSelected={handleFlashbackChoice} />
      )}


      {/* --- Data Perception Elements (Rendered based on dataPerceptionMode) --- */}
      <DataPerceptionOverlay active={dataPerceptionMode} />
      <div className={styles.environment}>
        {dataPerceptionMode && (
          <div className={styles.dataElements}>
            {destinations.map((dest) => (
              <TemporalEcho
                key={dest.id}
                id={dest.id}
                destinationConfig={dest}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- Main Game Specific UI (Placeholder - needs new state flag) --- */}
      {gameState.introPhase === 'mainGame' && ( // Keep for now, will be refactored
        <>
          {/* Potentially add other main game UI elements here */}
        </>
      )}

      {/* Removed old iOS fallback button */}
    </div>
  )
}

export default LunarArrival
