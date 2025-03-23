import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import useAudio from '../../hooks/useAudio';
import styles from './AudioVisualizer.module.scss';

export default function ToneVisualizer() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const { isPlaying, analyzer } = useAudio();
  const [isIOS, setIsIOS] = useState(false);
  
  // Check if we're on iOS
  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
    console.log('iOS detection in visualizer:', /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
  }, []);

  // Drawing logic for the visualizer
  const drawVisualizer = useCallback(() => {
    if (!canvasRef.current || !analyzer) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    try {
      // Get frequency data from analyzer
      const frequencyData = analyzer.getValue();
      
      // Stop if we have no data
      if (!frequencyData || frequencyData.length === 0) {
        rafRef.current = requestAnimationFrame(drawVisualizer);
        return;
      }
      
      // Set up colors
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(255, 105, 180, 1)'); // Hot pink
      gradient.addColorStop(1, 'rgba(255, 165, 0, 1)');   // Orange
      
      ctx.fillStyle = gradient;
      
      // Draw dome-shaped visualization with bars
      const barCount = frequencyData.length;
      const barWidth = width / barCount;
      
      // Calculate center position for dome effect
      const centerIndex = Math.floor(barCount / 2);
      
      for (let i = 0; i < barCount; i++) {
        // Apply dome shape multiplier - higher in the center, lower at edges
        const domePosition = 1 - Math.abs(i - centerIndex) / centerIndex;
        const domeMultiplier = 0.3 + (domePosition * 0.7); // Scale between 0.3-1.0
        
        // Get the frequency value and normalize it
        const value = frequencyData[i];
        // For Tone.js FFT analyzer, values are in dB (-100 to 0)
        // Convert to a 0-1 range for visualization
        const normalizedValue = (value + 100) / 100;
        
        // Apply dome multiplier to create arch shape
        const enhancedValue = normalizedValue * domeMultiplier;
        const barHeight = enhancedValue * height * 0.9; // Slightly reduce height to fit in canvas
        
        const x = i * barWidth;
        const y = height - barHeight;
        
        // Draw rounded bars
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - 1, barHeight, 3);
        ctx.fill();
      }
    } catch (error) {
      console.error('Error drawing visualizer:', error);
    }
    
    // Continue animation loop
    rafRef.current = requestAnimationFrame(drawVisualizer);
  }, [analyzer]);
  
  // Set up canvas and start animation loop
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Set canvas dimensions to match its display size
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Start animation loop if playing
    if (isPlaying && analyzer) {
      console.log('Starting Tone.js visualizer animation');
      rafRef.current = requestAnimationFrame(drawVisualizer);
    }
    
    // Clean up on unmount or when not playing
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, analyzer, drawVisualizer]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      
      // Update canvas size to match container
      canvasRef.current.width = canvasRef.current.offsetWidth;
      canvasRef.current.height = canvasRef.current.offsetHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div className={styles.visualizer} style={{ width: '100%', height: '400px' }}>
      <canvas
        ref={canvasRef}
        className={styles.visualizerCanvas}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
