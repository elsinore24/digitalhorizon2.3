import { BrowserRouter as Router } from 'react-router-dom'
import { useState } from 'react'
import GameContainer from './components/GameContainer'
import DialogueDisplay from './components/DialogueDisplay'
import AudioVisualizer from './components/AudioVisualizer'
import SafariAudioTest from './components/SafariAudioTest'
import { AudioProvider } from './contexts/AudioContext'
import { GameStateProvider } from './contexts/GameStateContext'
import { AuthProvider } from './contexts/AuthContext'
import useAudio from './hooks/useAudio'

// Wrapper component to use hooks
function AppContent() {
  const { isPlaying } = useAudio()
  const [showAudioTest, setShowAudioTest] = useState(false)
  
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
          <div style={{ width: '100%', height: '400px' }}>
            <AudioVisualizer />
          </div>
        </div>
      )}
      
      {/* Safari Audio Test Toggle Button */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 10000,
      }}>
        <button 
          onClick={() => setShowAudioTest(!showAudioTest)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {showAudioTest ? 'Hide Audio Test' : 'Safari Audio Test'}
        </button>
      </div>
      
      {/* Safari Audio Test Modal */}
      {showAudioTest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10001,
        }}>
          <div style={{
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            position: 'relative',
          }}>
            <button 
              onClick={() => setShowAudioTest(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            <SafariAudioTest />
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
