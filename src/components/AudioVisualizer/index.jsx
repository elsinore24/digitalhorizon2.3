import { useEffect, useRef, useState } from 'react'
import useAudio from '../../hooks/useAudio'
import styles from './AudioVisualizer.module.scss'

export default function AudioVisualizer() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const { getAnalyzerData, isPlaying, analyzer } = useAudio()
  const [fallbackMode, setFallbackMode] = useState(false)
  
  // Reset fallback mode when audio starts playing
  useEffect(() => {
    if (isPlaying && analyzer) {
      setFallbackMode(false)
    }
  }, [isPlaying, analyzer])
  
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    const draw = () => {
      const WIDTH = canvas.width
      const HEIGHT = canvas.height
      
      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
      
      // Draw grid
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'
      ctx.lineWidth = 0.5
      
      // Vertical grid lines
      for (let x = 0; x <= WIDTH; x += 10) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, HEIGHT)
      }
      
      // Horizontal grid lines
      for (let y = 0; y <= HEIGHT; y += 10) {
        ctx.moveTo(0, y)
        ctx.lineTo(WIDTH, y)
      }
      ctx.stroke()
      
      const numBars = 8
      const barWidth = (WIDTH / numBars) * 0.8
      const spacing = (WIDTH - numBars * barWidth) / (numBars + 1)
      
      // Try to get analyzer data
      const analyzerData = getAnalyzerData()
      
      // If we have analyzer data and audio is playing, use it
      if (analyzerData && isPlaying && !fallbackMode) {
        try {
          const { dataArray, bufferLength } = analyzerData
          
          // Check if we have valid data
          let hasData = false;
          for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > 0) {
              hasData = true;
              break;
            }
          }
          
          if (!hasData) {
            // If no data is present, use fallback but don't set fallbackMode state
            // to allow trying again on the next frame
            // Use the fallback visualization code directly
            const time = Date.now() / 1000;
            
            // Create a virtual frequency spectrum with more realistic behavior
            const virtualSpectrum = [];
            
            // Generate a more realistic frequency distribution
            for (let i = 0; i < numBars; i++) {
              // Base amplitude decreases as frequency (i) increases
              const baseAmplitude = 0.8 - (i / numBars) * 0.3;
              
              // Different oscillation speeds for different frequency bands
              const oscillationSpeed = 1.5 + (i / numBars) * 3;
              
              // Phase shift based on position to create wave-like motion
              const phaseShift = i * 0.7;
              
              // Add some randomness for more natural look
              const noise = 0.05 * Math.sin(time * 10 + i * 20);
              
              // Combine multiple oscillations with different frequencies
              let value = baseAmplitude * (
                0.6 * Math.sin(time * oscillationSpeed + phaseShift) +
                0.3 * Math.sin(time * oscillationSpeed * 1.7 + phaseShift * 1.3) +
                0.1 * Math.sin(time * oscillationSpeed * 3.1 + phaseShift * 0.5) +
                noise
              );
              
              // Ensure value is positive and within range
              value = Math.abs(value);
              value = Math.min(1, Math.max(0.05, value));
              
              // Apply playing state - more active when playing
              value = value * (isPlaying ? 1 : 0.3);
              
              virtualSpectrum.push(value);
            }
            
            // Apply some smoothing between adjacent bars for more natural look
            for (let i = 1; i < numBars - 1; i++) {
              virtualSpectrum[i] = (
                virtualSpectrum[i-1] * 0.2 + 
                virtualSpectrum[i] * 0.6 + 
                virtualSpectrum[i+1] * 0.2
              );
            }
            
            // Draw the bars using the virtual spectrum
            for (let i = 0; i < numBars; i++) {
              const height = HEIGHT * 0.8 * virtualSpectrum[i];
              const x = spacing + i * (barWidth + spacing);
              
              // Draw glow with intensity based on height
              const glowIntensity = 0.1 + virtualSpectrum[i] * 0.3;
              const glow = ctx.createLinearGradient(0, HEIGHT - height, 0, HEIGHT);
              glow.addColorStop(0, 'rgba(0, 255, 255, 0)');
              glow.addColorStop(0.5, `rgba(0, 255, 255, ${glowIntensity})`);
              glow.addColorStop(1, 'rgba(0, 255, 255, 0.1)');
              
              ctx.fillStyle = glow;
              ctx.fillRect(x - 2, HEIGHT - height - 2, barWidth + 4, height + 4);
              
              // Draw bar with gradient
              const gradient = ctx.createLinearGradient(0, HEIGHT - height, 0, HEIGHT);
              gradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)');
              gradient.addColorStop(1, 'rgba(0, 255, 255, 0.4)');
              
              ctx.fillStyle = gradient;
              ctx.fillRect(x, HEIGHT - height, barWidth, height);
              
              // Add highlight at top of bar
              ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
              ctx.fillRect(x, HEIGHT - height, barWidth, 2);
            }
            
            animationRef.current = requestAnimationFrame(draw);
            return;
          }
          
          const step = Math.floor(bufferLength / numBars)
          
          for (let i = 0; i < numBars; i++) {
            // Get frequency data for this bar - average a range of frequencies for smoother visualization
            let sum = 0;
            const rangeSize = Math.max(1, Math.floor(step / 2));
            const startIdx = Math.max(0, i * step - rangeSize);
            const endIdx = Math.min(bufferLength - 1, i * step + rangeSize);
            
            for (let j = startIdx; j <= endIdx; j++) {
              sum += dataArray[j];
            }
            
            // Normalize the value (0-255) to a height
            const value = (sum / (endIdx - startIdx + 1)) / 255.0;
            const height = HEIGHT * 0.8 * Math.max(0.05, value);
            
            const x = spacing + i * (barWidth + spacing)
            
            // Draw glow
            const glow = ctx.createLinearGradient(0, HEIGHT - height, 0, HEIGHT)
            glow.addColorStop(0, 'rgba(0, 255, 255, 0)')
            glow.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)')
            glow.addColorStop(1, 'rgba(0, 255, 255, 0.1)')
            
            ctx.fillStyle = glow
            ctx.fillRect(x - 2, HEIGHT - height - 2, barWidth + 4, height + 4)
            
            // Draw bar with gradient
            const gradient = ctx.createLinearGradient(0, HEIGHT - height, 0, HEIGHT)
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)')
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0.4)')
            
            ctx.fillStyle = gradient
            ctx.fillRect(x, HEIGHT - height, barWidth, height)
            
            // Add highlight at top of bar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
            ctx.fillRect(x, HEIGHT - height, barWidth, 2)
          }
        } catch (err) {
          console.error('Error processing analyzer data:', err)
          setFallbackMode(true)
        }
      } else {
        // Enhanced fallback visualization that simulates frequency spectrum
        const time = Date.now() / 1000
        
        // Create a virtual frequency spectrum with more realistic behavior
        const virtualSpectrum = []
        
        // Generate a more realistic frequency distribution
        // Low frequencies (bass) have higher amplitude and slower changes
        // High frequencies have lower amplitude and faster changes
        for (let i = 0; i < numBars; i++) {
          // Base amplitude decreases as frequency (i) increases
          const baseAmplitude = 0.8 - (i / numBars) * 0.3
          
          // Different oscillation speeds for different frequency bands
          const oscillationSpeed = 1.5 + (i / numBars) * 3
          
          // Phase shift based on position to create wave-like motion
          const phaseShift = i * 0.7
          
          // Add some randomness for more natural look
          const noise = 0.05 * Math.sin(time * 10 + i * 20)
          
          // Combine multiple oscillations with different frequencies
          let value = baseAmplitude * (
            0.6 * Math.sin(time * oscillationSpeed + phaseShift) +
            0.3 * Math.sin(time * oscillationSpeed * 1.7 + phaseShift * 1.3) +
            0.1 * Math.sin(time * oscillationSpeed * 3.1 + phaseShift * 0.5) +
            noise
          )
          
          // Ensure value is positive and within range
          value = Math.abs(value)
          value = Math.min(1, Math.max(0.05, value))
          
          // Apply playing state - more active when playing
          value = value * (isPlaying ? 1 : 0.3)
          
          virtualSpectrum.push(value)
        }
        
        // Apply some smoothing between adjacent bars for more natural look
        for (let i = 1; i < numBars - 1; i++) {
          virtualSpectrum[i] = (
            virtualSpectrum[i-1] * 0.2 + 
            virtualSpectrum[i] * 0.6 + 
            virtualSpectrum[i+1] * 0.2
          )
        }
        
        // Draw the bars using the virtual spectrum
        for (let i = 0; i < numBars; i++) {
          const height = HEIGHT * 0.8 * virtualSpectrum[i]
          const x = spacing + i * (barWidth + spacing)
          
          // Draw glow with intensity based on height
          const glowIntensity = 0.1 + virtualSpectrum[i] * 0.3
          const glow = ctx.createLinearGradient(0, HEIGHT - height, 0, HEIGHT)
          glow.addColorStop(0, 'rgba(0, 255, 255, 0)')
          glow.addColorStop(0.5, `rgba(0, 255, 255, ${glowIntensity})`)
          glow.addColorStop(1, 'rgba(0, 255, 255, 0.1)')
          
          ctx.fillStyle = glow
          ctx.fillRect(x - 2, HEIGHT - height - 2, barWidth + 4, height + 4)
          
          // Draw bar with gradient
          const gradient = ctx.createLinearGradient(0, HEIGHT - height, 0, HEIGHT)
          gradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)')
          gradient.addColorStop(1, 'rgba(0, 255, 255, 0.4)')
          
          ctx.fillStyle = gradient
          ctx.fillRect(x, HEIGHT - height, barWidth, height)
          
          // Add highlight at top of bar
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
          ctx.fillRect(x, HEIGHT - height, barWidth, 2)
        }
      }
      
      animationRef.current = requestAnimationFrame(draw)
    }
    
    draw()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [getAnalyzerData, isPlaying, fallbackMode])
  
  return (
    <canvas 
      ref={canvasRef} 
      className={styles.visualizer}
      width="150"
      height="30"
    />
  )
}
