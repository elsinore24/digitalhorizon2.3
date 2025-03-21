import React, { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import useAudio from '../../hooks/useAudio'
import styles from './AudioVisualizer.module.scss'

export default function WaveSurferVisualizer() {
  const waveformRef = useRef(null)
  const wavesurferRef = useRef(null)
  const { isPlaying, currentTrack } = useAudio()
  
  // Create WaveSurfer instance ONCE when component mounts
  useEffect(() => {
    // Only create if it doesn't exist yet and we have a container
    if (!wavesurferRef.current && waveformRef.current) {
      console.log('[WaveSurfer] Creating WaveSurfer instance')
      
      const wavesurfer = WaveSurfer.create({
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
        
        // If audio should be playing, start playback
        if (isPlaying) {
          wavesurfer.play()
        }
      })
      
      wavesurfer.on('error', (err) => {
        console.error('[WaveSurfer] Error:', err)
      })
    }
    
    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
        wavesurferRef.current = null
      }
    }
  }, []) // Only run once on mount
  
  // Load audio when track changes
  useEffect(() => {
    if (!wavesurferRef.current || !currentTrack) return
    
    const audioUrl = `/audio/narration/${currentTrack}.mp3`
    console.log('[WaveSurfer] Loading audio:', audioUrl)
    
    // Load the audio file
    wavesurferRef.current.load(audioUrl)
  }, [currentTrack])
  
  // Control playback based on isPlaying state
  useEffect(() => {
    if (!wavesurferRef.current) return
    
    try {
      if (isPlaying && !wavesurferRef.current.isPlaying()) {
        wavesurferRef.current.play()
      } else if (!isPlaying && wavesurferRef.current.isPlaying()) {
        wavesurferRef.current.pause()
      }
    } catch (err) {
      console.error('[WaveSurfer] Error controlling playback:', err)
    }
  }, [isPlaying])
  
  return (
    <div 
      ref={waveformRef} 
      className={styles.visualizer}
      style={{ width: '100%', height: '400px' }}
    />
  )
}
