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
  const labBackgroundImage = '/images/lab_background.png'; // TODO: Replace with actual path if different
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

  // Render the 3D background unconditionally
  // Render overlays based on introPhase

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

      {gameState.introPhase === 'transitioning' && (
        <IntroTransition onComplete={handleTransitionComplete} />
      )}

      {/* Render Lab Scene background during narrative and choice phases */}
      {(gameState.introPhase === 'flashbackNarrative' || gameState.introPhase === 'flashbackChoice') && (
        <FlashbackLabScene />
      )}

      {/* Render Narrative Reader during its phase */}
      {gameState.introPhase === 'flashbackNarrative' && (
        <NarrativeReader
          narrativeId={flashbackNarrativeId} // Use placeholder ID
          backgroundImageUrl={labBackgroundImage} // Use placeholder image
          onComplete={handleNarrativeComplete}
          // Pass dataPerceptionMode if NarrativeReader needs to be hidden by it later
          // dataPerceptionMode={dataPerceptionMode} // Example: Keep narrative visible even in data mode during flashback
        />
      )}

      {/* Render Choice Point during its phase */}
      {gameState.introPhase === 'flashbackChoice' && (
        <ChoicePoint onChoiceSelected={handleFlashbackChoice} />
      )}


      {/* --- Main Game Elements (Rendered when intro is complete) --- */}
      {gameState.introPhase === 'mainGame' && (
        <>
          {/* Data Perception Overlay */}
          <DataPerceptionOverlay active={dataPerceptionMode} />

          {/* Temporal Echoes (only visible in data perception mode) */}
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
