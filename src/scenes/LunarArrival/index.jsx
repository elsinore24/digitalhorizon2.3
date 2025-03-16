import { useState, useEffect } from 'react'
import useGameState from '../../hooks/useGameState'
import useAudio from '../../hooks/useAudio'
import TemporalEcho from '../../components/TemporalEcho'
import Scene3D from '../../components/Scene3D'
import DataPerceptionOverlay from '../../components/DataPerceptionOverlay'
import ObjectiveTracker from '../../components/ObjectiveTracker'
import DialogueSystem from '../../components/DialogueSystem'
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
          
          {dataPerceptionMode && (
            <ObjectiveTracker 
              objective="DR. KAI'S RESEARCH FRGM"
              progress={{
                RESEARCH_LOG: gameState.discoveredEchoes?.filter(id => id.startsWith('research_')).length || 0,
                PERSONAL_MEMORY: gameState.discoveredEchoes?.filter(id => id.startsWith('memory_')).length || 0,
                ANOMALY: gameState.discoveredEchoes?.filter(id => id.startsWith('anomaly_')).length || 0
              }}
            />
          )}
          
          <div className={styles.environment}>
            {dataPerceptionMode && (
              <div className={styles.dataElements}>
                <TemporalEcho 
                  id="research_001"
                  type="RESEARCH_LOG"
                  position={{ x: 25, y: 40 }}
                />
                <TemporalEcho 
                  id="memory_001"
                  type="PERSONAL_MEMORY"
                  position={{ x: 75, y: 60 }}
                />
                <TemporalEcho 
                  id="anomaly_001"
                  type="ANOMALY"
                  position={{ x: 50, y: 30 }}
                />
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
