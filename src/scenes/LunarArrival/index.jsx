import { useState, useEffect } from 'react'
import useGameState from '../../hooks/useGameState'
import useAudio from '../../hooks/useAudio'
import TemporalEcho from '../../components/TemporalEcho'
import Scene3D from '../../components/Scene3D'
import DataPerceptionOverlay from '../../components/DataPerceptionOverlay'
import ObjectiveTracker from '../../components/ObjectiveTracker'
import DialogueSystem from '../../components/DialogueSystem'
import { destinations } from '../../config/destinations' // Import the new config
import styles from './LunarArrival.module.scss'

const LunarArrival = ({ dataPerceptionMode }) => {
  const { gameState, visitScene } = useGameState()
  const { playNarration } = useAudio()
  const [showEnter, setShowEnter] = useState(true)

  useEffect(() => {
    if (!gameState) return

    const isFirstVisit = !gameState.scenesVisited?.includes('lunar_arrival')
    if (isFirstVisit && !showEnter) {
      playNarration('lunar_arrival_intro')
      visitScene('lunar_arrival')
    }
  }, [gameState, visitScene, showEnter, playNarration])

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
          <div className={styles.lunarSurface}>
            <div className={styles.stars} />
            <div className={styles.horizon} />
            <div className={styles.lunarGround} />
          </div>

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

          <DialogueSystem />
        </>
      )}
    </div>
  )
}

export default LunarArrival
