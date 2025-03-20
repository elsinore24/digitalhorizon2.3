import { useEffect, useRef, useState } from 'react'
import useAudio from '../../hooks/useAudio'
import styles from './AudioVisualizer.module.scss'

export default function AudioVisualizer() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const { isPlaying, getAnalyzerData } = useAudio()
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
      
      // Use the analyzer data for all platforms including iOS
      // Get audio data from analyzer
      const audioData = getAnalyzerData()
      
      // Get audio data from analyzer or use empty array if not available
      const { dataArray, bufferLength } = audioData || { dataArray: new Uint8Array(128).fill(0), bufferLength: 128 }
      
      // Draw the bars
      for (let i = 0; i < barCount; i++) {
        const x = startX + i * totalBarWidth
        
        // Calculate distance from center (0 at center, increases toward edges)
        const distanceFromCenter = Math.abs(i - centerIndex)
        
        // Get frequency data with emphasis on lower frequencies (which are usually more active)
        // Map bars to frequency data with center bars getting lower frequencies
        let dataIndex
        
        // Improved mapping to avoid duplicates and large outer bars
        // Use a more gradual mapping across the entire frequency range
        const normalizedPosition = i / barCount // 0 to 1 across all bars
        
        // Apply a curve to emphasize mid-range frequencies
        // This creates a more natural distribution and avoids the large outer bars
        const curvedPosition = Math.pow(normalizedPosition, 1.2)
        
        // Map to the frequency data
        dataIndex = Math.floor(curvedPosition * (bufferLength - 1))
        
        // Ensure dataIndex is within bounds
        const safeIndex = Math.min(Math.max(0, dataIndex), bufferLength - 1)
        
        // Get the frequency value
        const value = dataArray[safeIndex]
        
        // Calculate position factor for dome shape (1 at center, 0 at edges)
        const normalizedDistance = distanceFromCenter / centerIndex
        const positionFactor = Math.max(0, 1 - Math.pow(normalizedDistance, 1.5))
        
        // Scale the height based on the frequency value and position
        // Reduced multiplier range for smaller bars
        const heightMultiplier = 0.2 + (positionFactor * 1.8) // 0.2 at edges, 2.0 at center
        
        // Calculate height based on frequency data with overall scaling factor
        const height = (value / 255) * HEIGHT * heightMultiplier * 0.6 // Added 0.6 scaling factor to reduce overall height
        
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
  }, [isPlaying, getAnalyzerData, isIOS])
  
  useEffect(() => {
    // Function to resize canvas to half window width
    const resizeCanvas = () => {
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      canvas.width = Math.floor(window.innerWidth / 2) // Half of window width
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
