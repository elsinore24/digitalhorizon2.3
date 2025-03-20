import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import useAudio from '../../hooks/useAudio'
import styles from './AudioVisualizer.module.scss'

export default function WaveSurferVisualizer() {
  const containerRef = useRef(null)
  const wavesurferRef = useRef(null)
  const { isPlaying, currentTrack } = useAudio()
  
  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return
    
    // Create WaveSurfer instance with simpler configuration
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#ff69b4', // Pink
      progressColor: '#ffa500', // Orange
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 1,
      height: 400,
      responsive: true,
      normalize: true,
      fillParent: true,
      interact: false,
      hideScrollbar: true,
    })
    
    // Store the WaveSurfer instance
    wavesurferRef.current = wavesurfer
    
    // Clean up on unmount
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
      }
    }
  }, [])
  
  // Load audio when track changes
  useEffect(() => {
    if (!wavesurferRef.current || !currentTrack) return
    
    try {
      const audioUrl = `/audio/narration/${currentTrack}.mp3`
      console.log('[WaveSurfer] Loading audio:', audioUrl)
      
      // Load the audio file
      wavesurferRef.current.load(audioUrl)
      
      // Set up event listeners
      wavesurferRef.current.on('ready', () => {
        console.log('[WaveSurfer] Audio ready')
        
        // Start playing if isPlaying is true
        if (isPlaying) {
          wavesurferRef.current.play()
        }
      })
      
      wavesurferRef.current.on('error', (err) => {
        console.error('[WaveSurfer] Error:', err)
      })
    } catch (err) {
      console.error('[WaveSurfer] Error loading audio:', err)
    }
  }, [currentTrack, isPlaying])
  
  // Control playback based on isPlaying state
  useEffect(() => {
    if (!wavesurferRef.current) return
    
    try {
      if (isPlaying && wavesurferRef.current.isReady) {
        wavesurferRef.current.play()
      } else if (wavesurferRef.current.isPlaying()) {
        wavesurferRef.current.pause()
      }
    } catch (err) {
      console.error('[WaveSurfer] Error controlling playback:', err)
    }
  }, [isPlaying])
  
  return (
    <div 
      ref={containerRef} 
      className={styles.visualizer}
      style={{ width: '100%', height: '400px' }}
    />
  )
}
