import { useEffect, useState } from 'react'
import useAudio from '../hooks/useAudio'
import AudioVisualizer from './AudioVisualizer'
import styles from './DialogueDisplay.module.scss'

export default function DialogueDisplay() {
  const { currentDialogue, isPlaying } = useAudio()
  const [displayText, setDisplayText] = useState('')
  
  useEffect(() => {
    if (!currentDialogue) {
      setDisplayText('')
      return
    }
    
    let index = 0
    const textRevealSpeed = 50
    
    const interval = setInterval(() => {
      if (index < currentDialogue.text.length) {
        setDisplayText(prev => prev + currentDialogue.text.charAt(index))
        index++
      } else {
        clearInterval(interval)
      }
    }, textRevealSpeed)
    
    return () => clearInterval(interval)
  }, [currentDialogue])
  
  if (!currentDialogue || !isPlaying) return null
  
  return (
    <div className={styles.dialogueContainer}>
      <div className={styles.dialogueBox}>
        <div className={styles.dialogueHeader}>
          <div className={styles.speakerName}>
            {currentDialogue.speaker}
            <div className={styles.visualizerContainer}>
              <AudioVisualizer />
            </div>
          </div>
        </div>
        <p className={styles.dialogueText}>{displayText}</p>
      </div>
    </div>
  )
}
