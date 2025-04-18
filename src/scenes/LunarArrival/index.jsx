import { useState, useEffect } from 'react';
import useGameState from '../../hooks/useGameState';
import useAudio from '../../hooks/useAudio';
import TemporalEcho from '../../components/TemporalEcho';
import Scene3D from '../../components/Scene3D';
import DataPerceptionOverlay from '../../components/DataPerceptionOverlay';
import NarrativeReader from '../../components/NarrativeReader';
import RedAlertInterface from '../../components/RedAlertInterface'; // Import new component
import FlashbackLabScene from '../../components/FlashbackLabScene'; // Import new component
import IntroTransition from '../../components/IntroTransition'; // Import new component
import ChoicePoint from '../../components/ChoicePoint'; // Import new component
import { destinations } from '../../config/destinations';
import styles from './LunarArrival.module.scss';

const LunarArrival = ({ dataPerceptionMode }) => {
  // Get introPhase and setIntroPhase from the context
  const { gameState, visitScene, updateGameState, setIntroPhase } = useGameState();
  // Access gameState.introPhase directly in conditionals below
  const { isIOS, playAudioFile } = useAudio();

  // Placeholder for lab background image path
  const labBackgroundImage = 'front_pic/lab.jpg'; // Corrected path and extension, removed leading slash
  // Placeholder for flashback narrative ID
  const flashbackNarrativeId = 'flashback_intro'; // TODO: Replace with actual narrative ID
  // Removed old useEffect that triggered moon_dialogue

  // --- Intro Sequence Handlers ---

  const handleEnter = () => {
    console.log('Entering Digital Horizons - Triggering Red Alert');
    setIntroPhase('redAlert');
    // Potentially mark scene visited here if needed
    visitScene('lunar_arrival'); // Mark arrival if appropriate
  };

  const handleAttemptRealign = () => {
    console.log('Attempting Neural Realignment - Triggering Transition');
    setIntroPhase('transitioning');
  };

  const handleTransitionComplete = () => {
    console.log('Transition Complete - Triggering Flashback Narrative');
    setIntroPhase('flashbackNarrative');
  };

  const handleNarrativeComplete = () => {
    console.log('Flashback Narrative Complete - Triggering Choice Point');
    setIntroPhase('flashbackChoice');
  };

  const handleFlashbackChoice = (choice) => {
    console.log(`Flashback Choice Selected: ${choice}`);
    // Update game state with the choice
    updateGameState({ player: { ...gameState.player, flashbackChoice: choice } });
    // Transition to the main game view using context function
    setIntroPhase('mainGame');
  };

  // Add logging to check gameState and introPhase
  console.log('[LunarArrival] Rendering. GameState:', gameState);
  if (!gameState) {
    console.log('[LunarArrival] gameState is null/undefined, returning null.');
    return null;
  }
  console.log(`[LunarArrival] Rendering with introPhase: ${gameState.introPhase}`);

  // --- Render Logic ---

  return (
    <div className={styles.sceneContainer}>
      {/* Always render the 3D background */}
      <Scene3D dataPerceptionMode={dataPerceptionMode} />

      {/* --- Overlays based on Intro Phase --- */}

      {gameState.introPhase === 'initial' && (
        // Removed undefined className from wrapper div
        <div style={{ zIndex: 1200, position: 'relative' }}> {/* Keep zIndex, ensure positioning context */}
          <button className={styles.enterButton} onClick={handleEnter}>
            Enter Digital Horizons
          </button>
        </div>
      )}

      {gameState.introPhase === 'redAlert' && (
        <RedAlertInterface onAttemptRealign={handleAttemptRealign} />
      )}

      {/* Render Lab Scene background during transition, narrative and choice phases */}
      {(gameState.introPhase === 'transitioning' || gameState.introPhase === 'flashbackNarrative' || gameState.introPhase === 'flashbackChoice') && (
        <FlashbackLabScene />
      )}

      {/* Render IntroTransition in a separate portal div to isolate it from WebGL context */}
      {gameState.introPhase === 'transitioning' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1500, // Higher z-index to ensure it's on top
          pointerEvents: 'auto' // Allow interaction with the transition
        }}>
          <IntroTransition onComplete={handleTransitionComplete} />
        </div>
      )}

      {/* Render Narrative Reader during its phase */}
      {/* Render Narrative Reader during its phase, hide visually instead of unmounting */}
      {gameState.introPhase === 'flashbackNarrative' && (
        <div style={{ display: dataPerceptionMode ? 'none' : 'block' }}>
          <NarrativeReader
            narrativeId={flashbackNarrativeId} // Use placeholder ID
            backgroundImageUrl={labBackgroundImage} // Use placeholder image
            onComplete={handleNarrativeComplete}
          />
        </div>
      )}

      {/* Render Choice Point during its phase */}
      {gameState.introPhase === 'flashbackChoice' && (
        <ChoicePoint onChoiceSelected={handleFlashbackChoice} />
      )}

      {/* --- Data Perception Elements (Rendered based on dataPerceptionMode, NOT introPhase) --- */}
      {/* Moved OUTSIDE the 'mainGame' check */}
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

      {/* --- Main Game Specific UI (Still rendered only when intro is complete) --- */}
      {gameState.introPhase === 'mainGame' && (
        <>
          {/* Potentially add other main game UI elements here */}
          {/* Example: Maybe a default narrative starts after the choice? */}
          {/* {activeNarrativeId && <NarrativeReader narrativeId={activeNarrativeId} ... />} */}
        </>
      )}

      {/* Removed old iOS fallback button */}
    </div>
  )
}

export default LunarArrival
