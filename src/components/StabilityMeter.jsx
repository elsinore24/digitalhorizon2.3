import { useEffect } from 'react'
import useGameState from '../hooks/useGameState'
import styles from './StabilityMeter.module.scss'

export default function StabilityMeter() {
  const { gameState } = useGameState()
  const { stabilityMeter } = gameState.player

  useEffect(() => {
    if (stabilityMeter <= 20) {
      // Trigger warning effects
    }
  }, [stabilityMeter])

  return (
    <div className={styles.stabilityContainer}>
      <div className={styles.meter}>
        <div 
          className={styles.fill} 
          style={{ 
            width: `${stabilityMeter}%`,
            backgroundColor: `hsl(${stabilityMeter * 1.2}, 70%, 50%)`
          }}
        />
      </div>
      <div className={styles.label}>
        Neural Stability: {stabilityMeter}%
      </div>
    </div>
  )
}
