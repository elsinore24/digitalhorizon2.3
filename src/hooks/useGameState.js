import { create } from 'zustand'

const initialState = {
  currentScene: 'LunarArrival',
  dataPerceptionActive: false,
  player: {
    stabilityMeter: 100
  },
  discoveredEchoes: [],
  scenesVisited: []
}

const useGameState = create((set) => ({
  gameState: initialState,

  updateGameState: (updates) => set((state) => ({
    gameState: {
      ...state.gameState,
      ...updates,
      player: {
        ...state.gameState.player,
        ...(updates.player || {})
      }
    }
  })),

  visitScene: (sceneId) => set((state) => ({
    gameState: {
      ...state.gameState,
      scenesVisited: state.gameState.scenesVisited.includes(sceneId)
        ? state.gameState.scenesVisited
        : [...state.gameState.scenesVisited, sceneId]
    }
  })),

  toggleDataPerception: () => set((state) => ({
    gameState: {
      ...state.gameState,
      dataPerceptionActive: !state.gameState.dataPerceptionActive,
      player: {
        ...state.gameState.player,
        stabilityMeter: Math.max(0, state.gameState.player.stabilityMeter - 2)
      }
    }
  }))
}))

export default useGameState
