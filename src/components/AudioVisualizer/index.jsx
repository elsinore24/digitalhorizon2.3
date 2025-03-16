import { useEffect, useRef } from 'react'
import styles from './AudioVisualizer.module.scss'

export default function AudioVisualizer() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  
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
      
      // Generate animated bars
      const time = Date.now() / 1000
      const numBars = 8
      const barWidth = (WIDTH / numBars) * 0.8
      const spacing = (WIDTH - numBars * barWidth) / (numBars + 1)
      
      for (let i = 0; i < numBars; i++) {
        // Calculate bar height using multiple sine waves for more interesting motion
        const height = HEIGHT * 0.8 * (
          0.5 + 
          0.3 * Math.sin(time * 4 + i) +
          0.2 * Math.sin(time * 2.5 + i * 0.5)
        )
        
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
      
      animationRef.current = requestAnimationFrame(draw)
    }
    
    draw()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])
  
  return (
    <canvas 
      ref={canvasRef} 
      className={styles.visualizer}
      width="150"
      height="30"
    />
  )
}
