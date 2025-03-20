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
                audioData = generateSpeechWaveform(WIDTH, audioEnergy)
              }
            } else {
              audioData = generateSpeechWaveform(WIDTH, audioEnergy)
            }
          } else {
            audioData = generateSpeechWaveform(WIDTH, 0)
          }
        } catch (err) {
          console.error('Error processing analyzer data:', err)
          setFallbackMode(true)
          audioData = generateSpeechWaveform(WIDTH, 0)
        }
      } else {
        // Generate flat line or subtle waveform based on playing state
        audioEnergy = isPlaying ? 0.3 : 0
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
      
      // Speech patterns simulation
      const syllableRate = 3.5 // syllables per second
      const syllablePhase = time * syllableRate
      const syllableAmplitude = 0.5 + 0.5 * Math.sin(syllablePhase * Math.PI * 2)
      
      const wordRate = 0.8 // words per second
      const wordPhase = time * wordRate
      const wordBoundary = Math.sin(wordPhase * Math.PI * 2) > 0.7
      
      const sentenceRate = 0.15 // sentences per second
      const sentencePhase = time * sentenceRate
      const sentencePause = Math.sin(sentencePhase * Math.PI * 2) > 0.9
      
      // Base amplitude adjusted by energy level (loudness)
      let baseAmplitude = energy * 0.8
      
      // Apply speech patterns
      if (wordBoundary) baseAmplitude *= 0.3
      if (sentencePause) baseAmplitude *= 0.1
      
      // Generate waveform points
      for (let i = 0; i < width; i++) {
        const x = i / width
        
        // Combine multiple frequencies for a speech-like pattern
        // Speech has fundamental frequency (~100-300 Hz) and harmonics
        const fundamentalFreq = 5 // cycles across the display
        const secondHarmonic = 10
        const thirdHarmonic = 15
        
        // Amplitude modulation to simulate syllables
        const localAmplitude = baseAmplitude * syllableAmplitude
        
        // Combine frequencies with decreasing amplitude for harmonics
        const value = localAmplitude * (
          0.7 * Math.sin(fundamentalFreq * Math.PI * x * 2 + time * 7) +
          0.2 * Math.sin(secondHarmonic * Math.PI * x * 2 + time * 11) +
          0.1 * Math.sin(thirdHarmonic * Math.PI * x * 2 + time * 13)
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
        gradient.addColorStop(0, 'rgba(255, 50, 255, 0.9)')
        gradient.addColorStop(0.5, 'rgba(200, 0, 255, 0.9)')
        gradient.addColorStop(1, 'rgba(100, 0, 200, 0.9)')
      } else if (energy > 0.3) {
        // Medium energy - purple
        gradient.addColorStop(0, 'rgba(200, 50, 255, 0.8)')
        gradient.addColorStop(0.5, 'rgba(150, 0, 200, 0.8)')
        gradient.addColorStop(1, 'rgba(80, 0, 150, 0.8)')
      } else {
        // Low energy - soft purple
        gradient.addColorStop(0, 'rgba(150, 50, 200, 0.7)')
        gradient.addColorStop(0.5, 'rgba(100, 0, 150, 0.7)')
        gradient.addColorStop(1, 'rgba(50, 0, 100, 0.7)')
      }
      
      // Draw the main waveform
      ctx.beginPath()
      
      // Start at the left edge
      ctx.moveTo(0, centerY + waveform[0] * centerY)
      
      // Draw the waveform with smooth curves
      for (let i = 1; i < waveform.length; i++) {
        // Use quadratic curves for smoother waveform
        if (i % 2 === 0) {
          const prevX = (i - 1) / waveform.length * WIDTH
          const prevY = centerY + waveform[i - 1] * centerY
          const currX = i / waveform.length * WIDTH
          const currY = centerY + waveform[i] * centerY
          
          const cpX = (prevX + currX) / 2
          const cpY = centerY + waveform[i - 0.5] * centerY
          
          ctx.quadraticCurveTo(cpX, cpY, currX, currY)
        }
      }
      
      // Complete the path to the right edge
      ctx.lineTo(WIDTH, centerY + waveform[waveform.length - 1] * centerY)
      
      // Set line style and stroke the path
      ctx.lineWidth = 2 + energy * 3 // Line width increases with energy
      ctx.strokeStyle = gradient
      ctx.stroke()
      
      // Add glow effect
      ctx.shadowColor = 'rgba(150, 0, 255, 0.8)'
      ctx.shadowBlur = 10 + energy * 20
      ctx.lineWidth = 1 + energy * 2
      ctx.strokeStyle = 'rgba(200, 100, 255, 0.6)'
      ctx.stroke()
      ctx.shadowBlur = 0
      
      // Add vertical bars for more visual interest
      if (energy > 0.1) {
        const barCount = Math.floor(10 + energy * 40) // More bars with higher energy
        const barWidth = 1
        const barSpacing = WIDTH / barCount
        
        for (let i = 0; i < barCount; i++) {
          const x = i * barSpacing
          const idx = Math.floor((x / WIDTH) * waveform.length)
          const value = waveform[idx] || 0
          
          // Bar height based on waveform value and energy
          const height = Math.abs(value) * centerY * 1.5
          
          // Vary opacity based on position and time
          const opacity = 0.3 + 0.7 * Math.abs(value) * energy
          
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
          ctx.shadowColor = 'rgba(150, 0, 255, 0.5)'
          ctx.shadowBlur = 5
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      }
      
      // Draw center line
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(WIDTH, centerY)
      ctx.strokeStyle = 'rgba(100, 0, 150, 0.3)'
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
  
  return (
    <canvas 
      ref={canvasRef} 
      className={styles.visualizer}
      width="600"
      height="200"
    />
  )
}
