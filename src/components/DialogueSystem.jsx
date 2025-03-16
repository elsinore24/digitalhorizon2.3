import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useDialogue from '../hooks/useDialogue'
import styles from './DialogueSystem.module.scss'

function TypewriterEffect({ text, speed = 30, onComplete }) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(currentIndex + 1)
      }, speed)
      
      return () => clearTimeout(timer)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])
  
  return <>{displayedText}</>
}

export default function DialogueSystem() {
  const { currentDialogue, isDialogueActive, completeDialogue } = useDialogue()
  const [isTyping, setIsTyping] = useState(false)
  
  if (!isDialogueActive) return null
  
  return (
    <AnimatePresence>
      <motion.div 
        className={styles.dialogueContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <div className={styles.dialogueBox}>
          <div className={styles.speakerName}>
            {currentDialogue.speaker}
            <span className={styles.dot}></span>
          </div>
          <div className={styles.dialogueText}>
            <TypewriterEffect 
              text={currentDialogue.text} 
              speed={30}
              onComplete={() => {
                setIsTyping(false)
                if (currentDialogue.autoComplete) {
                  setTimeout(completeDialogue, 1000)
                }
              }}
            />
            {isTyping && <span className={styles.cursor}>_</span>}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
