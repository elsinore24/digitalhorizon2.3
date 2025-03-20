import { BrowserRouter as Router } from 'react-router-dom'
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
  
  return (
    <>
      {isPlaying && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 1001,
          pointerEvents: 'none'
        }}>
          <AudioVisualizer />
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
