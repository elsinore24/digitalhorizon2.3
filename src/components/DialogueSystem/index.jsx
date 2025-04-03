import { useState, useEffect } from 'react'
import useAudio from '../../hooks/useAudio';
import useGameState from '../../hooks/useGameState'; // Import useGameState
import AudioVisualizer from '../AudioVisualizer'
import styles from './DialogueSystem.module.scss'

const DialogueSystem = () => {
  const { currentDialogue, isPlaying, currentTrack } = useAudio();
  const { gameState } = useGameState(); // Get game state
  const [displayedText, setDisplayedText] = useState('');
  
  // Effect to handle instant text display
  useEffect(() => {
    if (currentDialogue) {
      setDisplayedText(currentDialogue.text); // Set full text instantly
    } else {
      setDisplayedText(''); // Clear text if no dialogue
    }
  }, [currentDialogue]); // Rerun effect when dialogue changes
  
  if (!currentDialogue) return null

  return (
    <div className={styles.dialogueContainer}>
      <div className={styles.dialogueBox}>
        {/* Header is now always rendered if DialogueSystem is rendered */}
        <div className={styles.dialogueHeader}>
          <span className={styles.speakerName}>{currentDialogue.speaker}</span>
          {/* Conditionally show visualizer container only if playing */}
          {isPlaying && (
            <div className={styles.visualizerContainer}>
              <div className={styles.visualizerLabel}>AUDIO ANALYSIS</div>
              <AudioVisualizer />
            </div>
          )}
        </div>
        <div className={styles.dialogueText}>
          {displayedText}
        </div>
      </div>
    </div>
  )
}

export default DialogueSystem
