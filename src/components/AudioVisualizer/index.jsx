import { useEffect, useRef } from 'react'
import useAudio from '../../hooks/useAudio'
import styles from './AudioVisualizer.module.scss'

export default function AudioVisualizer() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const { isPlaying, getAnalyzerData } = useAudio()
  
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
      
      // Get audio data from analyzer
      const audioData = getAnalyzerData()
      
      // Get audio data from analyzer or use empty array if not available
      const { dataArray, bufferLength } = audioData || { dataArray: new Uint8Array(128).fill(0), bufferLength: 128 }
      
      // Number of bars - use fewer bars to avoid duplicates
      const barCount = 64 // Reduced from 128 to avoid duplicates
      const barWidth = 2
      const barSpacing = Math.max(1, Math.floor((WIDTH - barCount * barWidth) / barCount))
      const totalBarWidth = barWidth + barSpacing
      
      // Calculate the starting X position to center the visualizer
      const totalWidth = barCount * totalBarWidth
      const startX = Math.floor((WIDTH - totalWidth) / 2)
      
      // Debug centering
      if (isPlaying) {
        console.log(`Canvas width: ${WIDTH}, Total bars width: ${totalWidth}, Start X: ${startX}`)
      }
      
      // Draw the bars
      for (let i = 0; i < barCount; i++) {
        const x = startX + i * totalBarWidth
        
        // Get the frequency value (0-255)
        // Use a subset of the frequency data to avoid duplicates
        // Mirror the frequency data for the right half to ensure symmetry
        let dataIndex
        if (i < barCount / 2) {
          // Left half - use actual frequency data
          dataIndex = Math.floor(i * (bufferLength / (barCount / 2)))
        } else {
          // Right half - mirror the left half for symmetry
          const mirrorIndex = barCount - i - 1
          dataIndex = Math.floor(mirrorIndex * (bufferLength / (barCount / 2)))
        }
        
        // Ensure dataIndex is within bounds
        dataIndex = Math.min(dataIndex, bufferLength - 1)
        
        // Get the frequency value without artificial minimums
        const value = dataArray[dataIndex]
        
        // Calculate position factor - 0 at edges, 1 at center
        const centerBarIndex = Math.floor(barCount / 2)
        const distanceFromCenter = Math.abs(i - centerBarIndex) / centerBarIndex
        const positionFactor = 1 - distanceFromCenter
        
        // Apply power function to create dome effect
        const enhancedPositionFactor = Math.pow(positionFactor, 2) // Quadratic for natural dome
        
        // Scale the height based on the frequency value and position
        const heightMultiplier = 0.3 + (enhancedPositionFactor * 2.7) // 0.3 at edges, 3.0 at center
        
        // Calculate height based only on frequency data
        // No base height to ensure bars reduce to zero when no audio is present
        const height = (value / 255) * HEIGHT * 0.8 * heightMultiplier
        
        // Set fill style with gradient
        ctx.fillStyle = gradient
        
        // Add glow effect
        ctx.shadowColor = 'rgba(255, 100, 150, 0.8)'
        ctx.shadowBlur = 5
        
        // Draw the bar from bottom up
        ctx.fillRect(x, HEIGHT - height, barWidth, height)
        
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
  }, [isPlaying, getAnalyzerData])
  
  useEffect(() => {
    // Function to resize canvas to half window width
    const resizeCanvas = () => {
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      canvas.width = Math.floor(window.innerWidth / 2) // Half of window width
      canvas.height = 200
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
      height="200"
    />
  )
}
