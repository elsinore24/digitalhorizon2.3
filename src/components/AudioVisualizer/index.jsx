import { useEffect, useRef, useState } from 'react'
import useAudio from '../../hooks/useAudio'
import styles from './AudioVisualizer.module.scss'

export default function AudioVisualizer() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const { isPlaying, getAnalyzerData, analyzer } = useAudio()
  const [isIOS, setIsIOS] = useState(false)
  
  // Check if we're on iOS
  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)
  }, [])
  
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Function to draw the audio visualizer
    const draw = () => {
      const WIDTH = canvas.width
      const HEIGHT = canvas.height
      
      // Clear the canvas
      ctx.clearRect(0, 0, WIDTH, HEIGHT)
      
      // No background fill - let page background show through
      
      // Create gradient for the bars - orange/gold at top to pink/purple at bottom
      const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT)
      gradient.addColorStop(0, 'rgba(255, 165, 0, 0.95)') // Orange/gold at top
      gradient.addColorStop(0.3, 'rgba(255, 105, 180, 0.95)') // Pink in middle
      gradient.addColorStop(1, 'rgba(150, 0, 205, 0.95)') // Purple at bottom
      
      // Number of bars
      const barCount = 64
      const barWidth = 2
      const barSpacing = Math.max(1, Math.floor((WIDTH - barCount * barWidth) / barCount))
      const totalBarWidth = barWidth + barSpacing
      
      // Calculate the starting X position to center the visualizer
      const totalWidth = barCount * totalBarWidth
      const startX = Math.floor((WIDTH - totalWidth) / 2)
      
      // Calculate exact center index
      const centerIndex = Math.floor(barCount / 2)
      
      // Try to get real audio data first
      let dataArray = null
      let useRealData = false
      
      console.log('Analyzer state:', analyzer ? 'exists' : 'null',
                  analyzer && analyzer.getByteFrequencyData ? 'has getByteFrequencyData' : 'no getByteFrequencyData');
      
      try {
        if (analyzer && analyzer.getByteFrequencyData) {
          // Try to use Web Audio API's analyzer node directly
          const tempArray = new Uint8Array(analyzer.frequencyBinCount);
          analyzer.getByteFrequencyData(tempArray);
          dataArray = tempArray;
          useRealData = true;
          console.log('Using REAL audio data from Web Audio API analyzer', tempArray.slice(0, 5));
        } else {
          // Fall back to getAnalyzerData which might use Tone.js (iOS path)
          const analyzerData = getAnalyzerData()
          console.log('[iOS Path] getAnalyzerData result:', analyzerData ? `array of length ${analyzerData.length}` : 'null/empty',
                      analyzerData && analyzerData.length > 0 ? `raw dB values: ${analyzerData.slice(0, 5)}` : '');
          
          // Check if we got valid data
          if (analyzerData && analyzerData.length > 0 && analyzerData.some(v => v > -Infinity)) { // Check for actual values
            // Convert to 0-255 range needed for visualization
            dataArray = new Uint8Array(analyzerData.length)
            
            // Convert from dB (-100 to 0 range) to 0-255 range for visualization
            for (let i = 0; i < analyzerData.length; i++) {
              // Tone.js FFT analyzer returns values in dB from -Infinity to 0
              // Map -100..0 to 0..255 (adjusting range slightly)
              const normalizedDb = Math.max(0, Math.min(1, (analyzerData[i] + 100) / 100)); // Normalize -100dB to 0dB -> 0 to 1
              dataArray[i] = Math.floor(normalizedDb * 255);
            }
            
            useRealData = true
            console.log('[iOS Path] Using REAL audio data from Tone.js analyzer. Converted 0-255 values:', dataArray.slice(0, 5));
          } else {
             console.log('[iOS Path] No valid data from getAnalyzerData, will use simulated.');
          }
        }
      } catch (err) {
        // Fallback to dummy data if error
        console.log('Using fallback visualization data', err)
      }
      
      // If we couldn't get valid analyzer data, create dummy data
      if (!useRealData) {
        console.log('Using SIMULATED audio data for visualization')
        // Create dummy data for visualization that animates with time
        dataArray = new Uint8Array(128)
        for (let i = 0; i < dataArray.length; i++) {
          const position = i / dataArray.length
          const centerEffect = 1 - Math.abs((position * 2) - 1) // Higher in middle
          const time = Date.now() / 1000
          
          // Make animation more dramatic for better visual effect
          const animatedValue = Math.sin(position * 10 + time) * 30 + // Increased amplitude from 20 to 30
                              Math.sin(position * 5 + time * 0.7) * 20 + // Increased from 15 to 20
                              Math.sin(position * 20 + time * 1.3) * 15 // Increased from 10 to 15
          
          // Base value plus centered effect plus animation
          dataArray[i] = Math.min(255, Math.max(0, 
            Math.floor(isPlaying ? 
              (110 + (centerEffect * 120) + animatedValue) : // Increased base values and center effect
              40 + (Math.sin(time) * 5)) // Subtle animation when not playing
          ))
        }
      }
      
      // Draw the bars
      for (let i = 0; i < barCount; i++) {
        const x = startX + i * totalBarWidth
        
        // Calculate distance from center (0 at center, increases toward edges)
        const distanceFromCenter = Math.abs(i - centerIndex)
        
        // Get position in data array
        const dataIndex = Math.floor(i * (dataArray.length / barCount))
        
        // Get the frequency value
        let value = dataArray[dataIndex]
        
        // Calculate position factor for dome shape (1 at center, 0 at edges)
        const normalizedDistance = distanceFromCenter / centerIndex
        
        // More pronounced dome effect with a steeper curve
        const positionFactor = Math.max(0, 1 - Math.pow(normalizedDistance, 3.5)) // Increased exponent further for sharper drop-off
        
        // Boost center bars even more (within 5 bars of center)
        if (distanceFromCenter < 5) {
          // Apply a multiplier to the frequency value for the center bars
          value = Math.min(255, value * 1.4); // Boost by 40%
        }
        
        // Scale the height based on the frequency value and position
        // Increased multiplier range for taller center bars
        const heightMultiplier = 0.1 + (positionFactor * 2.5) // Increased multiplier for taller center
        
        // Calculate height based on frequency data with overall scaling factor
        const height = (value / 255) * HEIGHT * heightMultiplier * 0.7 // Increased from 0.6 to 0.7
        
        // Calculate the center line (vertically)
        const centerY = HEIGHT / 2
        
        // Calculate the height for both up and down (half of total height)
        const halfHeight = height / 2
        
        // Set fill style with gradient
        // Create a gradient that goes from center outward in both directions
        const barGradient = ctx.createLinearGradient(0, centerY - halfHeight, 0, centerY + halfHeight)
        barGradient.addColorStop(0, 'rgba(255, 165, 0, 0.95)') // Orange/gold at top
        barGradient.addColorStop(0.5, 'rgba(255, 105, 180, 0.95)') // Pink in middle
        barGradient.addColorStop(1, 'rgba(150, 0, 205, 0.95)') // Purple at bottom
        
        ctx.fillStyle = barGradient
        
        // Add glow effect
        ctx.shadowColor = 'rgba(255, 100, 150, 0.8)'
        ctx.shadowBlur = 5
        
        // Draw the bar extending both up and down from center
        ctx.fillRect(x, centerY - halfHeight, barWidth, height)
        
        // Reset shadow for next bar
        ctx.shadowBlur = 0
      }
      
      // Request next frame
      animationRef.current = requestAnimationFrame(draw)
    }
    
    // Start animation if playing or always run for demo purposes
    draw()
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, getAnalyzerData, analyzer, isIOS])
  
  useEffect(() => {
    // Function to resize canvas to half window width
    const resizeCanvas = () => {
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      // canvas.width = Math.floor(window.innerWidth / 2) // Let CSS handle width
      canvas.height = 400 // Increased to match container height
    }
    
    // Initial resize
    resizeCanvas()
    
    // Add resize event listener
    window.addEventListener('resize', resizeCanvas)
    
    // Cleanup
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])
  
  return (
    <canvas 
      ref={canvasRef} 
      className={styles.visualizer}
      height="400"
    />
  )
}
