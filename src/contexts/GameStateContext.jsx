import { createContext, useState, useCallback } from 'react'

const initialState = {
  currentScene: 'LunarArrival',
  introPhase: 'initial', // Add intro phase state
  dataPerceptionActive: false,
  player: {
    location: 'lunar_surface',
    stabilityMeter: 100,
    flashbackChoice: null // Add field to store flashback choice
  },
  discoveredEchoes: [],
  dialogueHistory: [],
  puzzlesSolved: [],
  inventory: [],
  scenesVisited: []
};

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
  }, []);

  // Function to specifically update the intro phase
  const setIntroPhase = useCallback((phase) => {
    console.log(`[GameStateContext] Setting introPhase to: ${phase}`); // Log phase changes
    setGameStateRaw(prev => ({ ...prev, introPhase: phase }));
  }, []);

  const value = {
    gameState,
    isLoading,
    updateGameState,
    toggleDataPerception,
    addToInventory,
    recordDialogue,
    solvePuzzle,
    visitScene,
    setIntroPhase // Expose the new function
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  )
}
