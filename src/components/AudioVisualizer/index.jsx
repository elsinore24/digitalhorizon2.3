import { useEffect, useRef, useState } from 'react'
import useAudio from '../../hooks/useAudio'
import styles from './AudioVisualizer.module.scss'

export default function AudioVisualizer() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const timeRef = useRef(0)
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
      
      // Update time reference
      timeRef.current += 0.01
      
      // Clear with fade effect (transparent)
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
      
      // Clear the canvas completely
      ctx.clearRect(0, 0, WIDTH, HEIGHT)
      
      // Draw subtle background glow
      const bgGradient = ctx.createRadialGradient(
        WIDTH / 2, HEIGHT / 2, 0,
        WIDTH / 2, HEIGHT / 2, WIDTH / 1.5
      )
      bgGradient.addColorStop(0, 'rgba(60, 0, 80, 0.1)')
      bgGradient.addColorStop(0.5, 'rgba(30, 0, 40, 0.05)')
      bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
      
      // Try to get analyzer data
      const analyzerData = getAnalyzerData()
      
      // Create audio data array (either from analyzer or synthetic)
      let audioData = []
      let audioEnergy = 0
      
      if (analyzerData && isPlaying && !fallbackMode) {
        try {
          const { dataArray, bufferLength } = analyzerData
          
          // Check if we have valid data
          let hasData = false
          let sum = 0
          
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i]
            if (dataArray[i] > 0) {
              hasData = true
            }
          }
          
          // Calculate overall audio energy (0-1)
          audioEnergy = sum / (bufferLength * 255)
          
          if (hasData) {
            // Use time domain data for waveform if available
            const timeDataArray = new Uint8Array(bufferLength)
            if (analyzer) {
              try {
                analyzer.getByteTimeDomainData(timeDataArray)
                
                // Convert time domain data to normalized values (-1 to 1)
                for (let i = 0; i < bufferLength; i++) {
                  const value = (timeDataArray[i] / 128.0) - 1.0
                  audioData.push(value)
                }
              } catch (err) {
                console.error('Error getting time domain data:', err)
                audioData = generateSpeechWaveform(WIDTH, 0.7) // Higher energy for better visualization
              }
            } else {
              audioData = generateSpeechWaveform(WIDTH, 0.7) // Higher energy for better visualization
            }
          } else {
            // Always use a higher energy value for better visualization when no real data
            audioData = generateSpeechWaveform(WIDTH, 0.7)
          }
        } catch (err) {
          console.error('Error processing analyzer data:', err)
          setFallbackMode(true)
          audioData = generateSpeechWaveform(WIDTH, 0.7) // Higher energy for better visualization
        }
      } else {
        // Generate flat line or subtle waveform based on playing state
        audioEnergy = isPlaying ? 0.7 : 0 // Increased energy for better visualization
        audioData = generateSpeechWaveform(WIDTH, audioEnergy)
      }
      
      // Draw the waveform
      drawWaveform(ctx, WIDTH, HEIGHT, audioData, audioEnergy)
      
      animationRef.current = requestAnimationFrame(draw)
    }
    
    // Function to generate a speech-like waveform
    const generateSpeechWaveform = (width, energy) => {
      const time = Date.now() / 1000
      const waveform = []
      
      // If no energy (not speaking), return flat line with tiny variations
      if (energy < 0.05) {
        for (let i = 0; i < width; i++) {
          // Tiny random noise for flat line (not completely flat)
          waveform.push((Math.random() * 0.02) - 0.01)
        }
        return waveform
      }
      
      // Speech patterns simulation with more dynamic movement
      const syllableRate = 4.5 // Faster syllables per second (was 3.5)
      const syllablePhase = time * syllableRate
      const syllableAmplitude = 0.6 + 0.4 * Math.sin(syllablePhase * Math.PI * 2) // More pronounced amplitude variation
      
      const wordRate = 1.2 // Faster words per second (was 0.8)
      const wordPhase = time * wordRate
      const wordBoundary = Math.sin(wordPhase * Math.PI * 2) > 0.6 // Lower threshold for more frequent boundaries
      
      const sentenceRate = 0.25 // Faster sentences per second (was 0.15)
      const sentencePhase = time * sentenceRate
      const sentencePause = Math.sin(sentencePhase * Math.PI * 2) > 0.85 // Lower threshold for more frequent pauses
      
      // Base amplitude adjusted by energy level (loudness)
      // Increased base amplitude for better visualization
      let baseAmplitude = energy * 0.95 // Higher multiplier (was 0.9)
      
      // Apply speech patterns with less reduction
      if (wordBoundary) baseAmplitude *= 0.6 // Less reduction during word boundaries (was 0.5)
      if (sentencePause) baseAmplitude *= 0.4 // Less reduction during sentence pauses (was 0.3)
      
      // Generate waveform points
      for (let i = 0; i < width; i++) {
        const x = i / width
        
        // Add some randomness to make it more natural
        const randomFactor = 1.0 + (Math.random() * 0.1 - 0.05)
        
        // Combine multiple frequencies for a speech-like pattern
        // Speech has fundamental frequency (~100-300 Hz) and harmonics
        const fundamentalFreq = 6 // More cycles across the display (was 5)
        const secondHarmonic = 12 // More cycles (was 10)
        const thirdHarmonic = 18 // More cycles (was 15)
        
        // Amplitude modulation to simulate syllables
        const localAmplitude = baseAmplitude * syllableAmplitude * randomFactor
        
        // Combine frequencies with decreasing amplitude for harmonics
        const value = localAmplitude * (
          0.7 * Math.sin(fundamentalFreq * Math.PI * x * 2 + time * 8) + // Faster time factor (was 7)
          0.2 * Math.sin(secondHarmonic * Math.PI * x * 2 + time * 13) + // Faster time factor (was 11)
          0.1 * Math.sin(thirdHarmonic * Math.PI * x * 2 + time * 15) // Faster time factor (was 13)
        )
        
        waveform.push(value)
      }
      
      return waveform
    }
    
    // Function to draw waveform with glow effects
    const drawWaveform = (ctx, WIDTH, HEIGHT, waveform, energy) => {
      const centerY = HEIGHT / 2
      
      // Create gradient for the waveform
      const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT)
      
      // Adjust colors based on energy (emotion/loudness)
      // More energy = more vibrant colors
      if (energy > 0.6) {
        // High energy - bright purple/pink
        gradient.addColorStop(0, 'rgba(255, 50, 255, 0.95)') // More opaque (was 0.9)
        gradient.addColorStop(0.5, 'rgba(200, 0, 255, 0.95)') // More opaque (was 0.9)
        gradient.addColorStop(1, 'rgba(100, 0, 200, 0.95)') // More opaque (was 0.9)
      } else if (energy > 0.3) {
        // Medium energy - purple
        gradient.addColorStop(0, 'rgba(200, 50, 255, 0.85)') // More opaque (was 0.8)
        gradient.addColorStop(0.5, 'rgba(150, 0, 200, 0.85)') // More opaque (was 0.8)
        gradient.addColorStop(1, 'rgba(80, 0, 150, 0.85)') // More opaque (was 0.8)
      } else {
        // Low energy - soft purple
        gradient.addColorStop(0, 'rgba(150, 50, 200, 0.75)') // More opaque (was 0.7)
        gradient.addColorStop(0.5, 'rgba(100, 0, 150, 0.75)') // More opaque (was 0.7)
        gradient.addColorStop(1, 'rgba(50, 0, 100, 0.75)') // More opaque (was 0.7)
      }
      
      // Draw the main waveform
      ctx.beginPath()
      
      // Start at the left edge
      ctx.moveTo(0, centerY + waveform[0] * centerY)
      
      // Draw the waveform with direct lines for better visibility
      for (let i = 1; i < waveform.length; i++) {
        const x = i / waveform.length * WIDTH
        const y = centerY + waveform[i] * centerY
        
        // Draw a line to each point for a more visible waveform
        ctx.lineTo(x, y)
      }
      
      // Complete the path to the right edge
      ctx.lineTo(WIDTH, centerY + waveform[waveform.length - 1] * centerY)
      
      // Set line style and stroke the path
      ctx.lineWidth = 4 + energy * 6 // Increased line width for visibility (was 3 + energy * 5)
      ctx.strokeStyle = gradient
      ctx.stroke()
      
      // Add glow effect
      ctx.shadowColor = 'rgba(150, 0, 255, 0.9)' // More opaque (was 0.8)
      ctx.shadowBlur = 20 + energy * 30 // Increased blur for more glow (was 15 + energy * 25)
      ctx.lineWidth = 3 + energy * 4 // Increased line width (was 2 + energy * 3)
      ctx.strokeStyle = 'rgba(200, 100, 255, 0.9)' // Increased opacity (was 0.8)
      ctx.stroke()
      ctx.shadowBlur = 0
      
      // Add vertical bars for more visual interest
      if (energy > 0.1) {
        const barCount = Math.floor(20 + energy * 60) // More bars (was 15 + energy * 50)
        const barWidth = 2 // Wider bars for better visibility
        const barSpacing = WIDTH / barCount
        
        for (let i = 0; i < barCount; i++) {
          const x = i * barSpacing
          const idx = Math.floor((x / WIDTH) * waveform.length)
          const value = waveform[idx] || 0
          
          // Bar height based on waveform value and energy
          const height = Math.abs(value) * centerY * 2.0 // Taller bars (was 1.8)
          
          // Vary opacity based on position and time
          const opacity = 0.5 + 0.5 * Math.abs(value) * energy // Higher minimum opacity (was 0.4 + 0.6)
          
          // Gradient for the bar
          const barGradient = ctx.createLinearGradient(0, centerY - height, 0, centerY + height)
          barGradient.addColorStop(0, `rgba(255, 100, 255, ${opacity})`)
          barGradient.addColorStop(0.5, `rgba(150, 0, 255, ${opacity * 0.8})`)
          barGradient.addColorStop(1, `rgba(255, 100, 255, ${opacity})`)
          
          ctx.fillStyle = barGradient
          
          // Draw bar with rounded ends
          ctx.beginPath()
          ctx.moveTo(x, centerY - height)
          ctx.lineTo(x, centerY + height)
          ctx.lineWidth = barWidth + 1
          ctx.strokeStyle = barGradient
          ctx.stroke()
          
          // Add glow to bars
          ctx.shadowColor = 'rgba(150, 0, 255, 0.6)' // More opaque (was 0.5)
          ctx.shadowBlur = 10 // Increased blur for more glow (was 8)
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      }
      
      // Draw center line
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(WIDTH, centerY)
      ctx.strokeStyle = 'rgba(100, 0, 150, 0.4)' // More opaque (was 0.3)
      ctx.lineWidth = 1
      ctx.stroke()
    }
    
    draw()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [getAnalyzerData, isPlaying, fallbackMode, analyzer])
  
  useEffect(() => {
    // Function to resize canvas to match window width
    const resizeCanvas = () => {
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      canvas.width = window.innerWidth
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
