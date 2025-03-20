import { BrowserRouter as Router } from 'react-router-dom'
import { useState, useEffect } from 'react'
import GameContainer from './components/GameContainer'
import DialogueDisplay from './components/DialogueDisplay'
import AudioVisualizer from './components/AudioVisualizer'
import { AudioProvider } from './contexts/AudioContext'
import { GameStateProvider } from './contexts/GameStateContext'
import { AuthProvider } from './contexts/AuthContext'
import useAudio from './hooks/useAudio'

// Wrapper component to use hooks
function AppContent() {
  const { isPlaying } = useAudio()
  const [isMobile, setIsMobile] = useState(false)
  
  // Handle responsive layout
  useEffect(() => {
    // Check if we're on a mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkMobile()
    
    // Add resize event listener
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return (
    <>
      {isPlaying && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999, // Increased z-index to ensure it's above everything
          pointerEvents: 'none',
          background: 'rgba(0, 0, 0, 0.2)', // Semi-transparent background
        }}>
          <div style={{ 
            width: '100%', 
            height: isMobile ? '200px' : '400px', // Responsive height based on screen size
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <AudioVisualizer />
          </div>
        </div>
      )}
      <GameContainer />
      <DialogueDisplay />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <GameStateProvider>
          <AudioProvider>
            <AppContent />
          </AudioProvider>
        </GameStateProvider>
      </Router>
    </AuthProvider>
  )
}
