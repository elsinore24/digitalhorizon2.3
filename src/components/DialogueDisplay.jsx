import { useEffect, useState } from 'react'
import useAudio from '../hooks/useAudio'
import styles from './DialogueDisplay.module.scss'

export default function DialogueDisplay({ isHidden }) { // Accept isHidden prop
  const { currentDialogue, isPlaying } = useAudio()
  const [displayText, setDisplayText] = useState('');
  const [isTextVisible, setIsTextVisible] = useState(false); // State for fade-in visibility
  
  // Effect to handle text display and fade-in
  useEffect(() => {
    let visibilityTimeout;
    if (currentDialogue) {
      setIsTextVisible(false); // Reset opacity before text change
      setDisplayText(currentDialogue.text); // Set full text immediately

      // Use setTimeout to trigger transition after state update
      visibilityTimeout = setTimeout(() => {
        setIsTextVisible(true);
      }, 50); // Small delay (e.g., 50ms)

    } else {
      setDisplayText(''); // Clear text if no dialogue
      setIsTextVisible(false);
    }

    // Cleanup timeout on unmount or dialogue change
    return () => clearTimeout(visibilityTimeout);
  }, [currentDialogue]); // Dependency array
  
  if (!currentDialogue || !isPlaying) return null
  
  return (
    <div
      className={styles.dialogueContainer}
      style={{ display: isHidden ? 'none' : 'block' }} // Apply conditional display style
    >
      <div className={styles.dialogueBox}>
        <div className={styles.dialogueHeader}>
          <div className={styles.speakerName}>
            {currentDialogue.speaker}
          </div>
        </div>
        {/* Apply conditional class for fade-in */}
        <p className={`${styles.dialogueText} ${isTextVisible ? styles.visible : ''}`}>
          {displayText}
        </p>
      </div>
    </div>
  )
}
