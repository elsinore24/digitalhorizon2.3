import { motion, AnimatePresence } from 'framer-motion'
import styles from './InteractionPrompt.module.scss'

export default function InteractionPrompt({ show, type, position }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          className={styles.prompt}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <div className={styles.key}>E</div>
          <div className={styles.action}>
            {type === 'echo' ? 'Analyze Fragment' : 'Interact'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
