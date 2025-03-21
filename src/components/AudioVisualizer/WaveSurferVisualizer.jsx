import { useEffect, useRef, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import useAudio from '../../hooks/useAudio'
import styles from './AudioVisualizer.module.scss'

export default function WaveSurferVisualizer() {
  const waveformRef = useRef(null)
  const wavesurferRef = useRef(null)
  const { isPlaying, currentTrack } = useAudio()
  const [wavesurferReady, setWavesurferReady] = useState(false)
  
  // iOS-friendly initialization function
  const initWaveSurfer = useCallback(() => {
    if (!waveformRef.current || wavesurferRef.current) return;
    
    console.log('[WaveSurfer] Creating WaveSurfer instance')
    
    try {
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'rgba(255, 105, 180, 0.8)',
        progressColor: 'rgba(255, 165, 0, 0.95)',
        cursorColor: 'transparent',
        barWidth: 2,
        barGap: 1,
        barRadius: 3,
        height: 400,
        responsive: true,
        normalize: true,
        fillParent: true,
        // iOS-specific options
        backend: 'MediaElement',
        mediaControls: false,
      })
      
      wavesurferRef.current = wavesurfer
      
      // Event listeners
      wavesurfer.on('ready', () => {
        console.log('[WaveSurfer] WaveSurfer is ready')
        setWavesurferReady(true)
        
        // Sync with external isPlaying state immediately when ready
        if (isPlaying) {
          console.log('[WaveSurfer] Auto-playing on ready')
          wavesurfer.play()
        }
      })
      
      wavesurfer.on('error', (err) => {
        console.error('[WaveSurfer] Error:', err)
      })
      
      // iOS needs to know when audio ends
      wavesurfer.on('finish', () => {
        console.log('[WaveSurfer] Playback finished')
      })
      
    } catch (err) {
      console.error('[WaveSurfer] Error creating WaveSurfer instance:', err)
    }
  }, [isPlaying]) // Including isPlaying is important for when ready happens

  // Create WaveSurfer on mount OR on user interaction for iOS
  useEffect(() => {
    // Initialize on component mount
    initWaveSurfer()
    
    // Also add a user interaction listener for iOS
    const handleUserInteraction = () => {
      console.log('[WaveSurfer] User interaction detected')
      initWaveSurfer()
      
      // Remove listener after first interaction
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
    
    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('touchstart', handleUserInteraction)
    
    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy()
          wavesurferRef.current = null
        } catch (err) {
          console.error('[WaveSurfer] Error destroying WaveSurfer instance:', err)
        }
      }
      
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [initWaveSurfer])
  
  // Load audio when track changes
  useEffect(() => {
    if (!wavesurferRef.current || !currentTrack) return
    
    try {
      const audioUrl = `/audio/narration/${currentTrack}.mp3`
      console.log('[WaveSurfer] Loading audio:', audioUrl)
      
      // Load the audio file
      wavesurferRef.current.load(audioUrl)
    } catch (err) {
      console.error('[WaveSurfer] Error loading audio:', err)
    }
  }, [currentTrack])
  
  // Control playback based on isPlaying state
  useEffect(() => {
    // Only proceed if wavesurfer exists and is ready
    if (!wavesurferRef.current || !wavesurferReady) return
    
    try {
      const wavesurfer = wavesurferRef.current
      
      if (isPlaying && !wavesurfer.isPlaying()) {
        console.log('[WaveSurfer] Playing audio')
        wavesurfer.play()
      } else if (!isPlaying && wavesurfer.isPlaying()) {
        console.log('[WaveSurfer] Pausing audio')
        wavesurfer.pause()
      }
    } catch (err) {
      console.error('[WaveSurfer] Error controlling playback:', err)
    }
  }, [isPlaying, wavesurferReady])
  
  return (
    <div 
      ref={waveformRef} 
      className={styles.visualizer}
      style={{ width: '100%', height: '400px' }}
    />
  )
}
