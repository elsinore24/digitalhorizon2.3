import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './DataPerceptionOverlay.module.scss'

export default function DataPerceptionOverlay({ active }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {active && (
        <motion.div 
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.grid}></div>
          <div className={styles.scanlines}></div>
          <div className={styles.dataStreams}></div>
          <div className={styles.glowEffect}></div>
          <div className={styles.dataPatterns}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i} 
                className={styles.dataNode}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
