import { createContext, useState, useCallback } from 'react'

const initialState = {
  currentScene: 'LunarArrival',
  dataPerceptionActive: false,
  player: {
    location: 'lunar_surface',
    stabilityMeter: 100
  },
  discoveredEchoes: [],
  dialogueHistory: [],
  puzzlesSolved: [],
  inventory: [],
  scenesVisited: [] // Add scenesVisited array
}

export const GameStateContext = createContext(null)

export function GameStateProvider({ children }) {
  const [gameState, setGameStateRaw] = useState(initialState)
  const [isLoading, setIsLoading] = useState(false)

  const updateGameState = useCallback((updates) => {
    setGameStateRaw(prev => ({ ...prev, ...updates }))
  }, [])

  const toggleDataPerception = useCallback(() => {
    setGameStateRaw(prev => ({
      ...prev,
      dataPerceptionActive: !prev.dataPerceptionActive,
      player: {
        ...prev.player,
        stabilityMeter: Math.max(0, prev.player.stabilityMeter - 2)
      }
    }))
  }, [])

  const addToInventory = useCallback((item) => {
    setGameStateRaw(prev => ({
      ...prev,
      inventory: [...prev.inventory, item]
    }))
  }, [])

  const recordDialogue = useCallback((dialogue) => {
    setGameStateRaw(prev => ({
      ...prev,
      dialogueHistory: [...prev.dialogueHistory, {
        ...dialogue,
        timestamp: new Date().toISOString()
      }]
    }))
  }, [])

  const solvePuzzle = useCallback((puzzleId) => {
    setGameStateRaw(prev => ({
      ...prev,
      puzzlesSolved: [...prev.puzzlesSolved, puzzleId]
    }))
  }, [])

  const visitScene = useCallback((sceneId) => {
    setGameStateRaw(prev => ({
      ...prev,
      scenesVisited: prev.scenesVisited.includes(sceneId) 
        ? prev.scenesVisited 
        : [...prev.scenesVisited, sceneId]
    }))
  }, [])

  const value = {
    gameState,
    isLoading,
    updateGameState,
    toggleDataPerception,
    addToInventory,
    recordDialogue,
    solvePuzzle,
    visitScene
  }

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  )
}
