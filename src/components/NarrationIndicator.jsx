import { useEffect, useState } from 'react'
import useAudio from '../hooks/useAudio'
import styles from './NarrationIndicator.module.scss'

export default function NarrationIndicator() {
  const { isPlaying, currentTrack } = useAudio()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isPlaying) {
      setVisible(true)
    } else {
      const timeout = setTimeout(() => setVisible(false), 1000)
      return () => clearTimeout(timeout)
    }
  }, [isPlaying])

  if (!visible) return null

  return (
    <div className={`${styles.indicator} ${isPlaying ? styles.active : ''}`}>
      <div className={styles.icon}>
        <div className={styles.wave}></div>
      </div>
      <div className={styles.label}>
        Alara Speaking
      </div>
    </div>
  )
}
