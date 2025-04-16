import { useState, useEffect } from 'react'
import useGameState from '../../hooks/useGameState'
import useAudio from '../../hooks/useAudio'
import TemporalEcho from '../../components/TemporalEcho'
import Scene3D from '../../components/Scene3D'
import DataPerceptionOverlay from '../../components/DataPerceptionOverlay'
// import ObjectiveTracker from '../../components/ObjectiveTracker' // Removed as per comment in original code
// import DialogueSystem from '../../components/DialogueSystem' // Replaced by NarrativeReader
import NarrativeReader from '../../components/NarrativeReader'; // Import the new component
import { destinations } from '../../config/destinations' // Import the new config
import styles from './LunarArrival.module.scss'

const LunarArrival = ({ dataPerceptionMode }) => {
  const { gameState, visitScene } = useGameState()
  const { isIOS, playAudioFile, isPlaying } = useAudio(); // Remove pauseAudio, resumeAudio (no longer needed here)
  const [showEnter, setShowEnter] = useState(true);
  const [activeNarrativeId, setActiveNarrativeId] = useState(null); // State for the narrative reader
  // Revert: Remove immediatePlaybackNeeded state

  useEffect(() => {
    if (!gameState) return

    const isFirstVisit = !gameState.scenesVisited?.includes('lunar_arrival')
    if (isFirstVisit && !showEnter) {
      // Trigger the NarrativeReader instead of playing narration directly
      setActiveNarrativeId('moon_dialogue');
      visitScene('lunar_arrival');
    }
  }, [gameState, visitScene, showEnter]); // Removed playNarration from dependencies

  const handleEnter = () => {
    setShowEnter(false);
    
    // Trigger narrative loading via useEffect by setting activeNarrativeId
    // setActiveNarrativeId('moon_dialogue'); // Let useEffect handle this based on showEnter

    // No special iOS handling needed here anymore.
    // The NarrativeReader will handle the programmatic click on iOS.
  };

  if (!gameState) return null

  return (
    <div className={styles.sceneContainer}>
      {showEnter ? (
        <button className={styles.enterButton} onClick={handleEnter}>
          Enter Digital Horizons
        </button>
      ) : (
        <>
          {/* Old background divs removed */}

          <Scene3D dataPerceptionMode={dataPerceptionMode} />
          <DataPerceptionOverlay active={dataPerceptionMode} />
          
          {/* Removed ObjectiveTracker as it's tied to old fragment system */}
          
          <div className={styles.environment}>
            {dataPerceptionMode && (
              <div className={styles.dataElements}>
                {/* Map over destinations config to render TemporalEcho components */}
                {destinations.map((dest) => (
                  <TemporalEcho
                    key={dest.id}
                    id={dest.id} // Pass id for potential future use, key is essential
                    destinationConfig={dest} // Pass the whole config object
                  />
                ))}
              </div>
            )}
          </div>

          {/* Render NarrativeReader conditionally based on activeNarrativeId */}
          {activeNarrativeId && <NarrativeReader narrativeId={activeNarrativeId} dataPerceptionMode={dataPerceptionMode} />}
          {/* Revert: Remove immediatePlaybackNeeded props */}

          {/* Fallback Button for iOS if audio doesn't start automatically */}
          {/* Fallback Button - Show always on iOS after entering */}
          {!showEnter && isIOS && (
            <button
              style={{ // Basic inline styling for visibility
                position: 'fixed',
                bottom: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '10px 20px',
                zIndex: 10000, // Ensure it's visible
                backgroundColor: 'rgba(0, 255, 255, 0.7)',
                color: 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
              onClick={() => {
                // Direct play attempt
                console.log('[LunarArrival] Fallback button clicked, attempting direct play.');
                // Use the correct audio path for the fallback button as well
                const audioPath = 'audio/narration/lunar_arrival_intro.mp3';
                playAudioFile(audioPath);
              }}
            >
              Start Audio (Fallback)
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default LunarArrival
