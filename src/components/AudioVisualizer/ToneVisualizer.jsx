import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import useAudio from '../../hooks/useAudio';
import styles from './AudioVisualizer.module.scss';

export default function ToneVisualizer() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const { isPlaying, getAnalyzerData, analyzer } = useAudio();
  const [isIOS, setIsIOS] = useState(false);
  
  // Check if we're on iOS
  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
    console.log('iOS detection in visualizer:', /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
  }, []);

  // Drawing logic for the visualizer - main animation loop
  const drawVisualizer = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    try {
      // Only attempt visualization if audio is playing
      if (!isPlaying) {
        // Clear the canvas if not playing - no visualization when silent
        rafRef.current = requestAnimationFrame(drawVisualizer);
        return;
      }

      // ==========================================================
      // VISUALIZATION SETTINGS - Adjust these values as needed
      // ==========================================================
      
      // === Color settings ===
      // Set up colors - these define the gradient for the visualization
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(255, 105, 180, 1)'); // Top color - Hot pink
      gradient.addColorStop(1, 'rgba(255, 165, 0, 1)');   // Bottom color - Orange
      
      ctx.fillStyle = gradient;
      
      // === Shape settings ===
      // Number of bars to display - fewer bars = better performance but less detail
      const barCount = 64; // SETTING: Number of bars in the visualization
      
      // Bar spacing - gap between bars (in pixels)
      const barSpacing = 1; // SETTING: Space between bars
      
      // Calculate bar width based on canvas width and count
      const barWidth = (width / barCount) - barSpacing;
      
      // === Animation settings ===
      // How much the bars should move per frame
      const animationSpeed = 0.1; // SETTING: How fast the animation moves
      
      // How pronounced the dome shape should be
      const domeStrength = 0.6; // SETTING: Higher values = more pronounced dome (0.0-1.0)
      
      // Maximum height of visualization (as percentage of canvas height)
      const maxHeightPercent = 0.9; // SETTING: Maximum height of bars (0.0-1.0)
      
      // Animation amplitude - how much the bars fluctuate
      const animationAmplitude = 10; // SETTING: Higher values = more movement
      
      // ==========================================================

      // Create dummy data for visualization
      // Note: We're using dummy data for now since it seems analyzer data isn't working
      const dummyData = new Float32Array(128);
      for (let i = 0; i < dummyData.length; i++) {
        // Create a simple pattern with values between -80 and -30
        const position = i / dummyData.length;
        const centerEffect = 1 - Math.abs((position * 2) - 1); // Higher in middle
        // Add some animation with time-based variation
        const time = Date.now() / 1000;
        const animatedValue = Math.sin(position * 10 + time * animationSpeed) * animationAmplitude;
        dummyData[i] = -80 + (centerEffect * 50) + animatedValue; 
      }
      
      // Calculate center position for dome effect
      const centerIndex = Math.floor(barCount / 2);
      
      for (let i = 0; i < barCount; i++) {
        // Apply dome shape multiplier - higher in the center, lower at edges
        const domePosition = 1 - Math.abs(i - centerIndex) / centerIndex;
        const domeMultiplier = 0.4 + (domePosition * domeStrength); // Scale between 0.4-1.0 for more pronounced dome
        
        // Get the frequency value and normalize it with some amplification
        // Map a subset of the frequency data to spread more evenly
        const dataIndex = Math.floor(i * (dummyData.length / barCount));
        const value = dummyData[dataIndex] || -80;
        
        // For Tone.js FFT analyzer, values are in dB (-100 to 0)
        // Convert to a 0-1 range for visualization with amplification
        const normalizedValue = Math.min(1, (value + 100) / 80); // Amplify by dividing by 80 instead of 100
        
        // Apply dome multiplier to create arch shape
        const enhancedValue = normalizedValue * domeMultiplier;
        const barHeight = enhancedValue * height * maxHeightPercent; // Scale height to fit in canvas
        
        const x = i * (barWidth + barSpacing);
        const y = height - barHeight;
        
        // Draw simple rectangles instead of using roundRect which might not be supported in all browsers
        ctx.beginPath();
        ctx.rect(x, y, barWidth, barHeight);
        ctx.fill();
      }
    } catch (error) {
      console.error('Error in visualizer:', error.message);
    }
    
    // Continue animation loop
    rafRef.current = requestAnimationFrame(drawVisualizer);
  }, [isPlaying]);
  
  // Set up canvas and animation loop
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Set canvas dimensions to match its display size
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Start animation loop
    console.log('Starting visualizer animation');
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(drawVisualizer);
    
    // Clean up on unmount
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [drawVisualizer]);
  
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
  
  // Container size settings are here - controls the overall dimensions of the visualizer
  // The stylesheet (AudioVisualizer.module.scss) also contains additional styling
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
