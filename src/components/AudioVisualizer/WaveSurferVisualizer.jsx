import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import useAudio from '../../hooks/useAudio'
import styles from './AudioVisualizer.module.scss'

export default function WaveSurferVisualizer() {
  const containerRef = useRef(null)
  const wavesurferRef = useRef(null)
  const { isPlaying, currentTrack, getAudioInstance } = useAudio()
  const [isIOS, setIsIOS] = useState(false)
  
  // Check if we're on iOS
  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)
  }, [])
  
  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return
    
    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(255, 105, 180, 0.8)', // Pink
      progressColor: 'rgba(255, 165, 0, 0.95)', // Orange/gold
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 1,
      barRadius: 3,
      height: 400,
      normalize: true,
      responsive: true,
      fillParent: true,
      interact: false, // Disable user interaction
      hideScrollbar: true,
      partialRender: true,
      pixelRatio: 1,
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
    
    const audioUrl = `/audio/narration/${currentTrack}.mp3`
    console.log('[WaveSurfer] Loading audio:', audioUrl)
    
    // Load the audio file
    wavesurferRef.current.load(audioUrl)
    
    // Set up event listeners
    wavesurferRef.current.on('ready', () => {
      console.log('[WaveSurfer] Audio ready')
      
      // Apply gradient to waveform
      const gradient = wavesurferRef.current.backend.canvasCtx.createLinearGradient(
        0, 0, 0, wavesurferRef.current.backend.height
      )
      gradient.addColorStop(0, 'rgba(255, 165, 0, 0.95)') // Orange/gold at top
      gradient.addColorStop(0.3, 'rgba(255, 105, 180, 0.95)') // Pink in middle
      gradient.addColorStop(1, 'rgba(150, 0, 205, 0.95)') // Purple at bottom
      
      wavesurferRef.current.setWaveColor(gradient)
      
      // Start playing if isPlaying is true
      if (isPlaying) {
        wavesurferRef.current.play()
      }
    })
    
    wavesurferRef.current.on('error', (err) => {
      console.error('[WaveSurfer] Error:', err)
    })
    
  }, [currentTrack])
  
  // Control playback based on isPlaying state
  useEffect(() => {
    if (!wavesurferRef.current || !wavesurferRef.current.isReady) return
    
    if (isPlaying) {
      wavesurferRef.current.play()
    } else {
      wavesurferRef.current.pause()
    }
  }, [isPlaying])
  
  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.empty()
        wavesurferRef.current.drawBuffer()
      }
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  return (
    <div 
      ref={containerRef} 
      className={styles.visualizer}
      style={{ width: '100%', height: '400px' }}
    />
  )
}
