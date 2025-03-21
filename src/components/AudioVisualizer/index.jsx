import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import useAudio from '../../hooks/useAudio';
import styles from './AudioVisualizer.module.scss';

export default function AudioVisualizer() {
  // Declare ALL hooks at component top level
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const { isPlaying, currentTrack } = useAudio();
  const [wavesurferReady, setWavesurferReady] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  // Check if we're on iOS
  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
  }, []);
  
  // Create WaveSurfer instance
  useEffect(() => {
    if (!waveformRef.current) return;
    
    console.log('Creating WaveSurfer instance');
    
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
      // CRITICAL FOR iOS
      backend: isIOS ? 'MediaElement' : 'WebAudio',
      mediaControls: false
    });
    
    wavesurferRef.current = wavesurfer;
    
    wavesurfer.on('ready', () => {
      console.log('WaveSurfer is ready');
      setWavesurferReady(true);
      
      // Auto-play if isPlaying is true (sync with external state)
      if (isPlaying) {
        wavesurfer.play();
      }
    });
    
    wavesurfer.on('error', (err) => {
      console.error('WaveSurfer error:', err);
    });
    
    // Clean up
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
        setWavesurferReady(false);
      }
    };
  }, [isIOS]); // Only recreate if iOS detection changes
  
  // Handle user interaction for iOS (required for audio)
  useEffect(() => {
    if (!isIOS) return;
    
    const unlockAudio = () => {
      if (!wavesurferRef.current) return;
      
      console.log('User interaction detected, unlocking audio');
      // Just calling play() and immediately pause() unlocks audio on iOS
      wavesurferRef.current.play();
      wavesurferRef.current.pause();
      
      // Remove listeners after first interaction
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, [isIOS]);
  
  // Load audio when track changes
  useEffect(() => {
    if (!wavesurferRef.current || !currentTrack) return;
    
    const audioUrl = `/audio/narration/${currentTrack}.mp3`;
    console.log(`Loading audio: ${audioUrl}`);
    
    // IMPORTANT: Use a try-catch for iOS errors
    try {
      wavesurferRef.current.load(audioUrl);
    } catch (err) {
      console.error('Error loading audio:', err);
    }
  }, [currentTrack]);
  
  // Control playback based on isPlaying state
  useEffect(() => {
    if (!wavesurferRef.current || !wavesurferReady) return;
    
    try {
      if (isPlaying) {
        console.log('Playing audio with WaveSurfer');
        wavesurferRef.current.play();
      } else {
        console.log('Pausing audio with WaveSurfer');
        wavesurferRef.current.pause();
      }
    } catch (err) {
      console.error('Error controlling playback:', err);
    }
  }, [isPlaying, wavesurferReady]);
  
  return (
    <div
      ref={waveformRef}
      className={styles.visualizer}
      style={{ width: '100%', height: '400px' }}
    />
  );
}
