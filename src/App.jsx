import { BrowserRouter as Router } from 'react-router-dom'
import GameContainer from './components/GameContainer'
import DialogueDisplay from './components/DialogueDisplay'
import { AudioProvider } from './contexts/AudioContext'
import { GameStateProvider } from './contexts/GameStateContext'
import { AuthProvider } from './contexts/AuthContext'

// Wrapper component to use hooks
function AppContent() {
  return (
    <>
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
