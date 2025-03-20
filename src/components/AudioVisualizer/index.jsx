import { useEffect, useRef, useState } from 'react'
import useAudio from '../../hooks/useAudio'
import styles from './AudioVisualizer.module.scss'

export default function AudioVisualizer() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const waveformDataRef = useRef([]) // Store waveform data for smoother transitions
  const { getAnalyzerData, isPlaying, analyzer } = useAudio()
  const [fallbackMode, setFallbackMode] = useState(false)
  const [visualizationMode, setVisualizationMode] = useState('combined') // 'bars', 'waveform', or 'combined'
  
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
    
    // Initialize waveform data if empty
    if (waveformDataRef.current.length === 0) {
      waveformDataRef.current = Array(canvas.width).fill(canvas.height / 2)
    }
    
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
      
      // More bars for better speech representation
      const numBars = 16 // Increased from 8 to 16 for more detail
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
            // Use speech-like synthetic data
            drawSpeechLikeVisualization(ctx, WIDTH, HEIGHT, numBars, barWidth, spacing)
            animationRef.current = requestAnimationFrame(draw)
            return
          }
          
          // Draw frequency bars
          if (visualizationMode === 'bars' || visualizationMode === 'combined') {
            drawFrequencyBars(ctx, dataArray, bufferLength, WIDTH, HEIGHT, numBars, barWidth, spacing)
          }
          
          // Draw waveform
          if (visualizationMode === 'waveform' || visualizationMode === 'combined') {
            drawWaveform(ctx, dataArray, bufferLength, WIDTH, HEIGHT)
          }
          
        } catch (err) {
          console.error('Error processing analyzer data:', err)
          setFallbackMode(true)
        }
      } else {
        // Use speech-like synthetic data
        drawSpeechLikeVisualization(ctx, WIDTH, HEIGHT, numBars, barWidth, spacing)
      }
      
      animationRef.current = requestAnimationFrame(draw)
    }
    
    // Function to draw frequency bars
    const drawFrequencyBars = (ctx, dataArray, bufferLength, WIDTH, HEIGHT, numBars, barWidth, spacing) => {
      const step = Math.floor(bufferLength / numBars)
      
      // Speech frequency emphasis - human speech is typically 85-255 Hz (formants)
      // and has harmonics up to about 8000 Hz
      const speechEmphasis = [
        1.2, 1.4, 1.5, 1.3, 1.1, 0.9, 0.8, 0.7, // Lower frequencies (formants)
        0.6, 0.5, 0.5, 0.6, 0.7, 0.6, 0.5, 0.4  // Higher frequencies (harmonics)
      ]
      
      for (let i = 0; i < numBars; i++) {
        // Get frequency data for this bar - average a range of frequencies for smoother visualization
        let sum = 0
        const rangeSize = Math.max(1, Math.floor(step / 2))
        const startIdx = Math.max(0, i * step - rangeSize)
        const endIdx = Math.min(bufferLength - 1, i * step + rangeSize)
        
        for (let j = startIdx; j <= endIdx; j++) {
          sum += dataArray[j]
        }
        
        // Normalize the value (0-255) to a height and apply speech emphasis
        const value = (sum / (endIdx - startIdx + 1)) / 255.0
        const emphasisFactor = speechEmphasis[Math.min(i, speechEmphasis.length - 1)]
        const height = HEIGHT * 0.8 * Math.max(0.05, value * emphasisFactor)
        
        const x = spacing + i * (barWidth + spacing)
        
        // Color based on frequency range (blue-cyan for low, cyan-green for mid, green-yellow for high)
        let barColor
        if (i < numBars / 3) {
          // Low frequencies - blue to cyan
          barColor = `rgba(0, ${155 + (i * 100 / (numBars/3))}, 255, 0.9)`
        } else if (i < 2 * numBars / 3) {
          // Mid frequencies - cyan to green
          const idx = i - numBars / 3
          barColor = `rgba(0, 255, ${255 - (idx * 255 / (numBars/3))}, 0.9)`
        } else {
          // High frequencies - green to yellow
          const idx = i - 2 * numBars / 3
          barColor = `rgba(${(idx * 255 / (numBars/3))}, 255, 0, 0.9)`
        }
        
        // Draw glow with intensity based on height
        const glowIntensity = 0.1 + (height / (HEIGHT * 0.8)) * 0.4
        const glow = ctx.createLinearGradient(0, HEIGHT - height, 0, HEIGHT)
        glow.addColorStop(0, 'rgba(0, 255, 255, 0)')
        glow.addColorStop(0.5, `rgba(0, 255, 255, ${glowIntensity})`)
        glow.addColorStop(1, 'rgba(0, 255, 255, 0.1)')
        
        ctx.fillStyle = glow
        ctx.fillRect(x - 2, HEIGHT - height - 2, barWidth + 4, height + 4)
        
        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(0, HEIGHT - height, 0, HEIGHT)
        gradient.addColorStop(0, barColor)
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.4)')
        
        ctx.fillStyle = gradient
        ctx.fillRect(x, HEIGHT - height, barWidth, height)
        
        // Add highlight at top of bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.fillRect(x, HEIGHT - height, barWidth, 2)
        
        // Add pulsing effect for more dynamic visualization
        if (height > HEIGHT * 0.4) {
          const pulseSize = Math.min(10, height / 10)
          ctx.beginPath()
          ctx.arc(x + barWidth / 2, HEIGHT - height - pulseSize, pulseSize, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.fill()
        }
      }
    }
    
    // Function to draw waveform
    const drawWaveform = (ctx, dataArray, bufferLength, WIDTH, HEIGHT) => {
      // Create a new array for waveform data
      const newWaveformData = []
      
      // Use time domain data for waveform if available
      const timeDataArray = new Uint8Array(bufferLength)
      if (analyzer) {
        try {
          analyzer.getByteTimeDomainData(timeDataArray)
        } catch (err) {
          console.error('Error getting time domain data:', err)
        }
      }
      
      // Draw the waveform
      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'
      
      const sliceWidth = WIDTH / bufferLength
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const v = timeDataArray[i] / 128.0
        const y = v * HEIGHT / 2
        
        // Store the new data point
        newWaveformData.push(y)
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        
        x += sliceWidth
      }
      
      // If we don't have enough data points, interpolate
      if (newWaveformData.length < WIDTH) {
        const factor = WIDTH / newWaveformData.length
        const interpolatedData = []
        
        for (let i = 0; i < WIDTH; i++) {
          const idx = i / factor
          const idxFloor = Math.floor(idx)
          const idxCeil = Math.min(newWaveformData.length - 1, Math.ceil(idx))
          const fraction = idx - idxFloor
          
          interpolatedData[i] = newWaveformData[idxFloor] * (1 - fraction) + 
                               newWaveformData[idxCeil] * fraction
        }
        
        waveformDataRef.current = interpolatedData
      } else if (newWaveformData.length > WIDTH) {
        // Downsample
        const factor = newWaveformData.length / WIDTH
        const downsampledData = []
        
        for (let i = 0; i < WIDTH; i++) {
          const startIdx = Math.floor(i * factor)
          const endIdx = Math.min(newWaveformData.length - 1, Math.floor((i + 1) * factor))
          let sum = 0
          
          for (let j = startIdx; j <= endIdx; j++) {
            sum += newWaveformData[j]
          }
          
          downsampledData[i] = sum / (endIdx - startIdx + 1)
        }
        
        waveformDataRef.current = downsampledData
      } else {
        waveformDataRef.current = newWaveformData
      }
      
      // Complete the waveform path
      ctx.lineTo(WIDTH, HEIGHT / 2)
      ctx.stroke()
      
      // Add glow effect to the waveform
      ctx.lineWidth = 4
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'
      ctx.stroke()
      
      // Add a center line
      ctx.beginPath()
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'
      ctx.moveTo(0, HEIGHT / 2)
      ctx.lineTo(WIDTH, HEIGHT / 2)
      ctx.stroke()
    }
    
    // Function to draw speech-like synthetic visualization
    const drawSpeechLikeVisualization = (ctx, WIDTH, HEIGHT, numBars, barWidth, spacing) => {
      const time = Date.now() / 1000
      
      // Create a virtual frequency spectrum with speech-like behavior
      const virtualSpectrum = []
      
      // Speech patterns have these characteristics:
      // 1. Syllables occur at 2-5 Hz (every 0.2-0.5 seconds)
      // 2. Formants (resonant frequencies) are concentrated in specific bands
      // 3. Pauses between words and sentences
      
      // Simulate syllable rhythm (2-5 Hz)
      const syllableRate = 3.5 // syllables per second
      const syllablePhase = time * syllableRate
      const syllableAmplitude = 0.5 + 0.5 * Math.sin(syllablePhase * Math.PI * 2)
      
      // Simulate word boundaries (0.5-1 Hz)
      const wordRate = 0.8 // words per second
      const wordPhase = time * wordRate
      const wordBoundary = Math.sin(wordPhase * Math.PI * 2) > 0.7
      
      // Simulate sentence pauses (0.1-0.2 Hz)
      const sentenceRate = 0.15 // sentences per second
      const sentencePhase = time * sentenceRate
      const sentencePause = Math.sin(sentencePhase * Math.PI * 2) > 0.9
      
      // Generate a speech-like frequency distribution
      for (let i = 0; i < numBars; i++) {
        // Speech formants are concentrated in specific frequency bands
        // First formant: ~500 Hz (low)
        // Second formant: ~1500 Hz (mid-low)
        // Third formant: ~2500 Hz (mid)
        // Fourth formant: ~3500 Hz (mid-high)
        
        // Map bar index to approximate frequency band
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
        
        // Color based on frequency range (blue-cyan for low, cyan-green for mid, green-yellow for high)
        let barColor
        if (i < numBars / 3) {
          // Low frequencies - blue to cyan
          barColor = `rgba(0, ${155 + (i * 100 / (numBars/3))}, 255, 0.9)`
        } else if (i < 2 * numBars / 3) {
          // Mid frequencies - cyan to green
          const idx = i - numBars / 3
          barColor = `rgba(0, 255, ${255 - (idx * 255 / (numBars/3))}, 0.9)`
        } else {
          // High frequencies - green to yellow
          const idx = i - 2 * numBars / 3
          barColor = `rgba(${(idx * 255 / (numBars/3))}, 255, 0, 0.9)`
        }
        
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
        gradient.addColorStop(0, barColor)
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.4)')
        
        ctx.fillStyle = gradient
        ctx.fillRect(x, HEIGHT - height, barWidth, height)
        
        // Add highlight at top of bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.fillRect(x, HEIGHT - height, barWidth, 2)
        
        // Add pulsing effect for more dynamic visualization
        if (height > HEIGHT * 0.4) {
          const pulseSize = Math.min(5, height / 15)
          ctx.beginPath()
          ctx.arc(x + barWidth / 2, HEIGHT - height - pulseSize, pulseSize, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.fill()
        }
      }
      
      // Draw a waveform-like visualization for speech
      if (visualizationMode === 'waveform' || visualizationMode === 'combined') {
        ctx.beginPath()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)'
        
        // Create a speech-like waveform
        const wavePoints = 100
        const waveHeight = HEIGHT * 0.3
        const centerY = HEIGHT / 2
        
        ctx.moveTo(0, centerY)
        
        for (let i = 0; i < wavePoints; i++) {
          const x = (i / wavePoints) * WIDTH
          
          // Combine multiple frequencies for a speech-like pattern
          // Speech has fundamental frequency (~100-300 Hz) and harmonics
          const fundamentalFreq = 5 // cycles across the display
          const secondHarmonic = 10
          const thirdHarmonic = 15
          
          // Amplitude modulation to simulate syllables
          const syllableAmp = 0.5 + 0.5 * Math.sin(time * syllableRate * Math.PI * 2)
          
          // Word and sentence pauses
          let amplitude = 1.0
          if (wordBoundary) amplitude *= 0.3
          if (sentencePause) amplitude *= 0.1
          
          // Combine frequencies with decreasing amplitude for harmonics
          const y = centerY + waveHeight * amplitude * syllableAmp * (
            0.7 * Math.sin(fundamentalFreq * Math.PI * i / wavePoints + time * 7) +
            0.2 * Math.sin(secondHarmonic * Math.PI * i / wavePoints + time * 11) +
            0.1 * Math.sin(thirdHarmonic * Math.PI * i / wavePoints + time * 13)
          )
          
          ctx.lineTo(x, y)
        }
        
        ctx.lineTo(WIDTH, centerY)
        ctx.stroke()
        
        // Add glow effect
        ctx.lineWidth = 3
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)'
        ctx.stroke()
      }
    }
    
    draw()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [getAnalyzerData, isPlaying, fallbackMode, visualizationMode])
  
  return (
    <canvas 
      ref={canvasRef} 
      className={styles.visualizer}
      width="150"
      height="30"
    />
  )
}
