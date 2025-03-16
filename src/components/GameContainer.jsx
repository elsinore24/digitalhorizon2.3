import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import LunarArrival from '../scenes/LunarArrival'
import DataPerceptionOverlay from './DataPerceptionOverlay'
import StabilityMeter from './StabilityMeter'
import NarrationIndicator from './NarrationIndicator'
import useGameState from '../hooks/useGameState'
import useAuth from '../hooks/useAuth'
import useDatabase from '../hooks/useDatabase'
import styles from './GameContainer.module.scss'

export default function GameContainer() {
  const { gameState, toggleDataPerception } = useGameState()
  const { user } = useAuth()
  const { loadGame } = useDatabase()

  useEffect(() => {
    if (user) {
      loadGame()
    }
  }, [user, loadGame])

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        toggleDataPerception()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [toggleDataPerception])

  return (
    <div className={styles.container}>
      <Routes>
        <Route path="/" element={<LunarArrival dataPerceptionMode={gameState.dataPerceptionActive} />} />
      </Routes>
      <DataPerceptionOverlay active={gameState.dataPerceptionActive} />
      <StabilityMeter />
      <NarrationIndicator />
      <button 
        className={styles.perceptionToggle} 
        onClick={toggleDataPerception}
      >
        Toggle Data Perception [Tab]
      </button>
    </div>
  )
}
