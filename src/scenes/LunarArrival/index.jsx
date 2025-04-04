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
  // const { playNarration } = useAudio() // No longer directly calling this here
  const [showEnter, setShowEnter] = useState(true);
  const [activeNarrativeId, setActiveNarrativeId] = useState(null); // State for the narrative reader

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
    setShowEnter(false)
  }

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
        </>
      )}
    </div>
  )
}

export default LunarArrival
