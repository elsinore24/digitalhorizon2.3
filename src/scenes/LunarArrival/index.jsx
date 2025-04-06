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
  const { preloadAudioFile, isIOS, playAudioFile, isPlaying } = useAudio(); // Import playAudioFile and isPlaying
  const [showEnter, setShowEnter] = useState(true);
  const [activeNarrativeId, setActiveNarrativeId] = useState(null); // State for the narrative reader
  const [immediatePlaybackNeeded, setImmediatePlaybackNeeded] = useState(false); // State for immediate playback

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
    
    // For iOS, directly trigger audio context initialization and preload
    if (isIOS) {
      // Get the narrative audio path (assuming it's always moon_dialogue for this scene)
      const narrativeAudioPath = 'audio/narration/moon_dialogue.mp3'; // Or fetch from config if dynamic
      
      // Pre-load the audio file but don't play yet
      preloadAudioFile(narrativeAudioPath);
      
      // Set a flag to play as soon as possible in NarrativeReader
      setImmediatePlaybackNeeded(true);
      console.log('[LunarArrival] iOS detected, preloading audio and setting immediate playback flag.');
    }
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
          {activeNarrativeId && <NarrativeReader narrativeId={activeNarrativeId} dataPerceptionMode={dataPerceptionMode} immediatePlaybackNeeded={immediatePlaybackNeeded} setImmediatePlaybackNeeded={setImmediatePlaybackNeeded} />}
          
          {/* Fallback Button for iOS if audio doesn't start automatically */}
          {!showEnter && isIOS && !isPlaying && activeNarrativeId && (
            <button
              className={styles.directPlayButton} // Add appropriate styling
              onClick={() => {
                // Direct play attempt
                console.log('[LunarArrival] Fallback button clicked, attempting direct play.');
                const audioPath = `audio/narration/${activeNarrativeId}.mp3`; // Assuming mp3 format
                playAudioFile(audioPath);
              }}
            >
              Start Audio
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default LunarArrival
