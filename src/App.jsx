import { BrowserRouter as Router } from 'react-router-dom'
import GameContainer from './components/GameContainer'
import DialogueDisplay from './components/DialogueDisplay'
import AudioVisualizer from './components/AudioVisualizer'
import { AudioProvider } from './contexts/AudioContext'
import { GameStateProvider } from './contexts/GameStateContext'
import { AuthProvider } from './contexts/AuthContext'
import useAudio from './hooks/useAudio';
import useGameState from './hooks/useGameState'; // Import useGameState

// Wrapper component to use hooks
function AppContent() {
  const { isPlaying } = useAudio();
  const { gameState } = useGameState(); // Get game state
  
  return (
    <>
      {/* Only show visualizer if playing AND data perception is OFF */}
      {isPlaying && !gameState.dataPerceptionActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          // alignItems: 'center', // Removed for top alignment
          justifyContent: 'center', // Re-added for horizontal centering
          paddingTop: '20px', // Keep vertical padding
          // paddingLeft: '20px', // Removed, using justifyContent now
          zIndex: 9999, // Increased z-index to ensure it's above everything
          pointerEvents: 'none',
          background: 'rgba(0, 0, 0, 0.2)', // Semi-transparent background
        }}>
          <div style={{ height: '100px' }}> {/* Reduced height */}
            <AudioVisualizer />
          </div>
        </div>
      )}
      <GameContainer />
      {/* Render DialogueDisplay unconditionally, pass isHidden prop */}
      <DialogueDisplay isHidden={gameState.dataPerceptionActive} />
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
