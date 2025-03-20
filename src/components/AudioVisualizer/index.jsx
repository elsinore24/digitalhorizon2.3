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
      
      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
      
      // Draw grid with wave effect
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(0, 100, 255, 0.05)'
      ctx.lineWidth = 0.5
      
      // Vertical grid lines with perspective effect
      const gridSpacing = 20
      for (let x = 0; x <= WIDTH; x += gridSpacing) {
        const distortion = Math.sin(x / WIDTH * Math.PI + timeRef.current) * 5
        ctx.moveTo(x, 0)
        ctx.lineTo(x + distortion, HEIGHT)
      }
      
      // Horizontal grid lines with wave effect
      for (let y = 0; y <= HEIGHT; y += gridSpacing) {
        const waveAmplitude = 5
        const waveFrequency = 0.1
        ctx.moveTo(0, y)
        
        for (let x = 0; x <= WIDTH; x += 5) {
          const distortion = Math.sin(x * waveFrequency + timeRef.current * 2) * waveAmplitude
          ctx.lineTo(x, y + distortion)
        }
      }
      ctx.stroke()
      
      // More bars for better speech representation
      const numBars = 32 // Increased from 8 to 32 for more detail
      const barWidth = (WIDTH / numBars) * 0.7
      const spacing = (WIDTH / numBars) * 0.3
      
      // Try to get analyzer data
      const analyzerData = getAnalyzerData()
      
      // Create audio data array (either from analyzer or synthetic)
      let audioData = []
      
      if (analyzerData && isPlaying && !fallbackMode) {
        try {
          const { dataArray, bufferLength } = analyzerData
          
          // Check if we have valid data
          let hasData = false
          for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > 0) {
              hasData = true
              break
            }
          }
          
          if (hasData) {
            // Use real audio data
            const step = Math.floor(bufferLength / numBars)
            for (let i = 0; i < numBars; i++) {
              let sum = 0
              const rangeSize = Math.max(1, Math.floor(step / 2))
              const startIdx = Math.max(0, i * step - rangeSize)
              const endIdx = Math.min(bufferLength - 1, i * step + rangeSize)
              
              for (let j = startIdx; j <= endIdx; j++) {
                sum += dataArray[j]
              }
              
              // Normalize value (0-255) to 0-1 range
              const value = (sum / (endIdx - startIdx + 1)) / 255.0
              audioData.push(value)
            }
          } else {
            // Generate synthetic data
            audioData = generateSpeechLikeData(numBars)
          }
        } catch (err) {
          console.error('Error processing analyzer data:', err)
          setFallbackMode(true)
          audioData = generateSpeechLikeData(numBars)
        }
      } else {
        // Generate synthetic data
        audioData = generateSpeechLikeData(numBars)
      }
      
      // Apply smoothing
      const smoothedData = [...audioData]
      for (let i = 1; i < numBars - 1; i++) {
        smoothedData[i] = (
          audioData[i-1] * 0.2 + 
          audioData[i] * 0.6 + 
          audioData[i+1] * 0.2
        )
      }
      
      // Draw 3D-like circular visualization
      const centerX = WIDTH / 2
      const centerY = HEIGHT / 2
      const maxRadius = Math.min(WIDTH, HEIGHT) * 0.4
      const layers = 5
      
      // Draw multiple circular layers
      for (let layer = 0; layer < layers; layer++) {
        const layerRadius = maxRadius * (0.5 + layer * 0.1)
        const points = []
        
        // Calculate points around the circle
        for (let i = 0; i < numBars; i++) {
          const angle = (i / numBars) * Math.PI * 2
          const amplitude = smoothedData[i] * maxRadius * 0.5
          const radius = layerRadius + amplitude * (layer / layers)
          
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius
          
          points.push({ x, y, value: smoothedData[i] })
        }
        
        // Draw filled shape with gradient
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        
        // Connect points with curves for smoother shape
        for (let i = 0; i < points.length; i++) {
          const current = points[i]
          const next = points[(i + 1) % points.length]
          
          // Control points for curve
          const cpX1 = current.x + (next.x - current.x) * 0.3
          const cpY1 = current.y + (next.y - current.y) * 0.1
          const cpX2 = current.x + (next.x - current.x) * 0.7
          const cpY2 = current.y + (next.y - current.y) * 0.9
          
          ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, next.x, next.y)
        }
        
        // Create gradient fill
        const gradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, maxRadius * 1.5
        )
        
        // Layer-specific colors
        const hueBase = 180 + layer * 30 // Blue to green to yellow
        const saturation = 100 - layer * 10
        const lightness = 50 + layer * 5
        
        gradient.addColorStop(0, `hsla(${hueBase}, ${saturation}%, ${lightness}%, 0.1)`)
        gradient.addColorStop(0.5, `hsla(${hueBase + 20}, ${saturation}%, ${lightness}%, 0.05)`)
        gradient.addColorStop(1, `hsla(${hueBase + 40}, ${saturation}%, ${lightness}%, 0)`)
        
        ctx.fillStyle = gradient
        ctx.fill()
        
        // Draw outline with glow
        ctx.strokeStyle = `hsla(${hueBase}, ${saturation}%, ${lightness}%, 0.8)`
        ctx.lineWidth = 1
        ctx.stroke()
        
        // Add second stroke for glow effect
        ctx.strokeStyle = `hsla(${hueBase}, ${saturation}%, ${lightness + 20}%, 0.3)`
        ctx.lineWidth = 2
        ctx.stroke()
      }
      
      // Draw connecting lines between layers for 3D mesh effect
      ctx.globalAlpha = 0.2
      for (let i = 0; i < numBars; i += 2) { // Skip some points for cleaner look
        const angle = (i / numBars) * Math.PI * 2
        
        ctx.beginPath()
        ctx.strokeStyle = `hsla(${200 + i}, 100%, 70%, 0.3)`
        ctx.lineWidth = 0.5
        
        // Draw line from center to outer edge with wave distortion
        const segments = 10
        ctx.moveTo(centerX, centerY)
        
        for (let j = 1; j <= segments; j++) {
          const segmentRadius = (j / segments) * maxRadius * 1.2
          const distortion = Math.sin(j / segments * Math.PI + timeRef.current * 2) * 10
          
          const x = centerX + Math.cos(angle + distortion * 0.01) * segmentRadius
          const y = centerY + Math.sin(angle + distortion * 0.01) * segmentRadius
          
          ctx.lineTo(x, y)
        }
        
        ctx.stroke()
      }
      ctx.globalAlpha = 1.0
      
      // Draw center point with glow
      const centerGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, maxRadius * 0.2
      )
      centerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
      centerGlow.addColorStop(0.2, 'rgba(100, 200, 255, 0.5)')
      centerGlow.addColorStop(1, 'rgba(0, 100, 255, 0)')
      
      ctx.fillStyle = centerGlow
      ctx.beginPath()
      ctx.arc(centerX, centerY, maxRadius * 0.2, 0, Math.PI * 2)
      ctx.fill()
      
      // Draw particles
      drawParticles(ctx, WIDTH, HEIGHT, audioData)
      
      animationRef.current = requestAnimationFrame(draw)
    }
    
    // Function to generate speech-like data
    const generateSpeechLikeData = (numBars) => {
      const time = Date.now() / 1000
      const virtualSpectrum = []
      
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
      
      for (let i = 0; i < numBars; i++) {
        // Map bar index to frequency band
        const freqBand = i / numBars
        
        // Base amplitude varies by frequency band to simulate formants
        let baseAmplitude
        if (freqBand < 0.2) {
          // First formant (strongest)
          baseAmplitude = 0.9
        } else if (freqBand < 0.4) {
          // Second formant
          baseAmplitude = 0.7
        } else if (freqBand < 0.6) {
          // Third formant
          baseAmplitude = 0.5
        } else if (freqBand < 0.8) {
          // Fourth formant
          baseAmplitude = 0.3
        } else {
          // High frequencies (weakest in speech)
          baseAmplitude = 0.2
        }
        
        // Apply syllable rhythm
        baseAmplitude *= syllableAmplitude
        
        // Apply word boundaries and sentence pauses
        if (wordBoundary) baseAmplitude *= 0.3
        if (sentencePause) baseAmplitude *= 0.1
        
        // Add oscillations and noise
        const oscillationSpeed = 1.5 + (i / numBars) * 3
        const phaseShift = i * 0.7
        const noise = 0.05 * Math.sin(time * 10 + i * 20)
        
        let value = baseAmplitude * (
          0.6 * Math.sin(time * oscillationSpeed + phaseShift) +
          0.3 * Math.sin(time * oscillationSpeed * 1.7 + phaseShift * 1.3) +
          0.1 * Math.sin(time * oscillationSpeed * 3.1 + phaseShift * 0.5) +
          noise
        )
        
        value = Math.abs(value)
        value = Math.min(1, Math.max(0.05, value))
        value = value * (isPlaying ? 1 : 0.3)
        
        virtualSpectrum.push(value)
      }
      
      return virtualSpectrum
    }
    
    // Function to draw particles
    const drawParticles = (ctx, WIDTH, HEIGHT, audioData) => {
      // Calculate overall audio energy
      let audioEnergy = 0
      if (audioData.length > 0) {
        for (let i = 0; i < audioData.length; i++) {
          audioEnergy += audioData[i]
        }
        audioEnergy /= audioData.length
      } else {
        audioEnergy = 0.3 + 0.2 * Math.sin(timeRef.current * 3)
      }
      
      // Number of particles based on energy
      const particleCount = Math.floor(20 + audioEnergy * 30)
      
      // Draw particles
      for (let i = 0; i < particleCount; i++) {
        // Position based on time and index
        const angle = (i / particleCount) * Math.PI * 2 + timeRef.current
        const distance = 20 + audioEnergy * 40 + 10 * Math.sin(timeRef.current * 2 + i)
        
        const x = WIDTH / 2 + Math.cos(angle) * distance
        const y = HEIGHT / 2 + Math.sin(angle) * distance
        
        // Size based on audio and position
        const size = 1 + audioEnergy * 3 * (1 + 0.5 * Math.sin(i + timeRef.current))
        
        // Color based on position
        const hue = (i / particleCount) * 120 + 180 // Blue to green
        const color = `hsla(${hue}, 100%, 70%, ${0.3 + audioEnergy * 0.5})`
        
        // Draw particle with glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0)')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, size * 2, 0, Math.PI * 2)
        ctx.fill()
      }
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
      width="150"
      height="30"
    />
  )
}
