import { useState, useEffect } from 'react'
import useAudio from '../../hooks/useAudio'
import AudioVisualizer from '../AudioVisualizer'
import styles from './DialogueSystem.module.scss'

const DialogueSystem = () => {
  const { currentDialogue, isPlaying, currentTrack } = useAudio()
  const [displayedText, setDisplayedText] = useState('')
  const [typingComplete, setTypingComplete] = useState(false)
  
  useEffect(() => {
    console.log('Current audio state:', { currentDialogue, isPlaying, currentTrack })
    
    if (currentDialogue) {
      setDisplayedText('')
      setTypingComplete(false)
      
      const fullText = currentDialogue.text
      let charIndex = 0
      
      const typingInterval = setInterval(() => {
        if (charIndex < fullText.length) {
          setDisplayedText(fullText.substring(0, charIndex + 1))
          charIndex++
        } else {
          clearInterval(typingInterval)
          setTypingComplete(true)
        }
      }, 30)
      
      return () => clearInterval(typingInterval)
    }
  }, [currentDialogue])
  
  if (!currentDialogue) return null

  return (
    <div className={styles.dialogueContainer}>
      <div className={styles.dialogueBox}>
        <div className={styles.dialogueHeader}>
          <span className={styles.speakerName}>{currentDialogue.speaker}</span>
          {isPlaying && (
            <div className={styles.visualizerContainer}>
              <div className={styles.visualizerLabel}>AUDIO ANALYSIS</div>
              <AudioVisualizer />
            </div>
          )}
        </div>
        <div className={styles.dialogueText}>
          {displayedText}
          {!typingComplete && <span className={styles.cursor}>_</span>}
        </div>
      </div>
    </div>
  )
}

export default DialogueSystem
