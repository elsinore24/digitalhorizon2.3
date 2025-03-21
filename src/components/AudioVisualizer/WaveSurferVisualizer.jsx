import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import useAudio from '../../hooks/useAudio'
import styles from './AudioVisualizer.module.scss'

export default function WaveSurferVisualizer() {
  const waveformRef = useRef(null)
  const wavesurferRef = useRef(null)
  const { isPlaying, currentTrack } = useAudio()
  const [wavesurferReady, setWavesurferReady] = useState(false)
  
  // Create WaveSurfer instance ONCE when component mounts
  useEffect(() => {
    let wavesurfer = null
    
    // Only create if it doesn't exist yet and we have a container
    if (waveformRef.current) {
      console.log('[WaveSurfer] Creating WaveSurfer instance')
      
      try {
        wavesurfer = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: 'rgba(255, 105, 180, 0.8)', // Pink
          progressColor: 'rgba(255, 165, 0, 0.95)', // Orange/gold
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
        })
        
        wavesurfer.on('error', (err) => {
          console.error('[WaveSurfer] Error:', err)
        })
      } catch (err) {
        console.error('[WaveSurfer] Error creating WaveSurfer instance:', err)
      }
    }
    
    // Cleanup
    return () => {
      if (wavesurfer) {
        try {
          wavesurfer.destroy()
        } catch (err) {
          console.error('[WaveSurfer] Error destroying WaveSurfer instance:', err)
        }
        wavesurferRef.current = null
      }
    }
  }, []) // Only run once on mount
  
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
  
  // Control playback based on isPlaying state and wavesurferReady
  useEffect(() => {
    if (!wavesurferRef.current || !wavesurferReady) return
    
    try {
      if (isPlaying) {
        console.log('[WaveSurfer] Playing audio')
        wavesurferRef.current.play()
      } else {
        console.log('[WaveSurfer] Pausing audio')
        wavesurferRef.current.pause()
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
