import { motion, AnimatePresence } from 'framer-motion'
import styles from './FragmentAnalyzer.module.scss'

export default function FragmentAnalyzer({ isAnalyzing, fragmentId, type }) {
  return (
    <AnimatePresence>
      {isAnalyzing && (
        <motion.div 
          className={styles.analyzer}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <div className={`${styles.scanRing} ${styles[type.toLowerCase()]}`} />
          <div className={styles.status}>
            <div className={styles.label}>Analyzing Fragment</div>
            <div className={styles.progress}>
              <motion.div 
                className={styles.bar}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 5 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
