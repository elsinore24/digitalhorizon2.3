import { motion } from 'framer-motion'
import { fragmentTypes } from '../config/fragmentTypes'
import styles from './ObjectiveTracker.module.scss'

export default function ObjectiveTracker({ objective, progress }) {
  const totalByType = {
    RESEARCH_LOG: 3,
    PERSONAL_MEMORY: 3,
    ANOMALY: 3
  }

  return (
    <motion.div 
      className={styles.tracker}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.objective}>{objective}</div>
      <div className={styles.progressList}>
        {Object.entries(totalByType).map(([type, total]) => {
          const collected = progress[type] || 0
          return (
            <div key={type} className={styles.progressItem}>
              <div 
                className={styles.icon}
                style={{ color: fragmentTypes[type].color }}
              >
                {fragmentTypes[type].icon}
              </div>
              <div className={styles.circles}>
                {[...Array(total)].map((_, index) => (
                  <div 
                    key={index}
                    className={`${styles.circle} ${index < collected ? styles.collected : ''}`}
                    style={{
                      '--circle-color': fragmentTypes[type].color,
                      '--circle-glow': fragmentTypes[type].glowColor
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
