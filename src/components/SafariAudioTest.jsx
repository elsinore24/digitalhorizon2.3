import { useState, useEffect, useRef } from 'react'
import { Howl } from 'howler'
import styles from './SafariAudioTest.module.scss'

export default function SafariAudioTest() {
  const [status, setStatus] = useState('Ready')
  const [contextState, setContextState] = useState('Not initialized')
  const [isIOS, setIsIOS] = useState(false)
  const [audioInitialized, setAudioInitialized] = useState(false)
  
  const audioContextRef = useRef(null)
  const audioElementRef = useRef(null)
  
  // Audio file path
  const audioFile = '/audio/narration/lunar_arrival_intro.mp3'
  
  useEffect(() => {
    // Check if running on iOS
    const iosDetected = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(iosDetected)
    
    // Create audio element
    audioElementRef.current = new Audio()
    audioElementRef.current.crossOrigin = 'anonymous'
    audioElementRef.current.preload = 'auto'
    
    // Clean up on unmount
    return () => {
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }, [])
  
  // Initialize audio context
  const initializeAudio = () => {
    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      setContextState(audioContextRef.current.state)
      setStatus('Audio context created')
      
      // Resume audio context (needed for Safari)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          setContextState(audioContextRef.current.state)
          setStatus('Audio context resumed')
          
          // For iOS, play a silent sound to unlock audio
          if (isIOS && !audioInitialized) {
            const oscillator = audioContextRef.current.createOscillator()
            oscillator.frequency.value = 1
            oscillator.connect(audioContextRef.current.destination)
            oscillator.start(0)
            oscillator.stop(0.001)
            
            setStatus('iOS audio initialized')
            setAudioInitialized(true)
          }
        }).catch(err => {
          setStatus(`Resume error: ${err.message}`)
          console.error('Failed to resume AudioContext:', err)
        })
      }
      
      // Set up state change listener
      audioContextRef.current.onstatechange = () => {
        if (audioContextRef.current) {
          setContextState(audioContextRef.current.state)
        }
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`)
      console.error('Audio initialization error:', err)
    }
  }
  
  // Play audio using HTML5 Audio
  const playWithHtml5 = () => {
    try {
      const audioElement = audioElementRef.current
      
      // Stop any currently playing audio
      audioElement.pause()
      audioElement.currentTime = 0
      
      // Set source and play
      audioElement.src = audioFile
      
      // Set up event handlers
      audioElement.onloadeddata = () => {
        setStatus('Audio loaded (HTML5)')
      }
      
      audioElement.onplay = () => {
        setStatus('Audio playing (HTML5)')
      }
      
      audioElement.onended = () => {
        setStatus('Audio ended (HTML5)')
      }
      
      audioElement.onerror = (err) => {
        setStatus(`Audio error (HTML5): ${err.message || 'Unknown error'}`)
        console.error('HTML5 Audio error:', err)
      }
      
      // Play audio
      audioElement.play()
        .then(() => {
          console.log('HTML5 Audio playing')
        })
        .catch(err => {
          setStatus(`Play error (HTML5): ${err.message}`)
          console.error('HTML5 Audio play error:', err)
        })
      
    } catch (err) {
      setStatus(`Error: ${err.message}`)
      console.error('HTML5 Audio error:', err)
    }
  }
  
  // Play audio using Howler.js
  const playWithHowler = () => {
    try {
      // Create Howl instance
      const sound = new Howl({
        src: [audioFile],
        html5: true, // Force HTML5 Audio for better iOS compatibility
        preload: true,
        format: ['mp3'],
        onload: function() {
          setStatus('Audio loaded (Howler)')
        },
        onplay: function() {
          setStatus('Audio playing (Howler)')
        },
        onend: function() {
          setStatus('Audio ended (Howler)')
        },
        onloaderror: function(id, err) {
          setStatus(`Load error (Howler): ${err || 'Unknown error'}`)
          console.error('Howler load error:', err)
        },
        onplayerror: function(id, err) {
          setStatus(`Play error (Howler): ${err || 'Unknown error'}`)
          console.error('Howler play error:', err)
          
          // On iOS, try to recover from play errors
          if (isIOS && audioContextRef.current) {
            audioContextRef.current.resume().then(() => {
              setStatus('Retrying after resume')
              sound.play()
            })
          }
        }
      })
      
      // Play the sound
      sound.play()
      
    } catch (err) {
      setStatus(`Error: ${err.message}`)
      console.error('Howler error:', err)
    }
  }
  
  return (
    <div className={styles.container}>
      <h2>Safari Audio Test</h2>
      
      <div className={styles.instructions}>
        <p><strong>Instructions:</strong></p>
        <ol>
          <li>First, click the "Initialize Audio" button to unlock the audio context</li>
          <li>Then try playing audio using the different methods</li>
          <li>Check the status messages below to see what's happening</li>
        </ol>
      </div>
      
      <div className={styles.buttonContainer}>
        <button 
          className={styles.button} 
          onClick={initializeAudio}
        >
          Initialize Audio
        </button>
        
        <button 
          className={styles.button} 
          onClick={playWithHtml5}
        >
          Play Audio (HTML5)
        </button>
        
        <button 
          className={styles.button} 
          onClick={playWithHowler}
        >
          Play Audio (Howler.js)
        </button>
      </div>
      
      <div className={styles.infoPanel}>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Audio Context State:</strong> {contextState}</p>
        <p><strong>Device:</strong> {isIOS ? 'iOS Device Detected' : 'Not an iOS Device'}</p>
      </div>
    </div>
  )
}
