import { create } from 'zustand'

const initialState = {
  currentScene: 'LunarArrival',
  introPhase: 'initial', // <<< ADDED introPhase HERE
  dataPerceptionActive: false,
  player: {
    stabilityMeter: 100,
    flashbackChoice: null // <<< ADDED flashbackChoice HERE
  },
  discoveredEchoes: [],
  scenesVisited: []
};

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

  toggleDataPerception: () => set((state) => {
    console.log('[Zustand Toggle] Before:', state.gameState.dataPerceptionActive); // DEBUG LOG
    const newState = !state.gameState.dataPerceptionActive;
    console.log('[Zustand Toggle] After:', newState); // DEBUG LOG
    return {
      gameState: {
        ...state.gameState,
        dataPerceptionActive: newState,
        player: {
          ...state.gameState.player,
          stabilityMeter: Math.max(0, state.gameState.player.stabilityMeter - 2)
        }
      }
    };
  }),

  // Add setIntroPhase action to Zustand store
  setIntroPhase: (phase) => set((state) => {
    console.log(`[Zustand] Setting introPhase to: ${phase}`);
    return {
      gameState: {
        ...state.gameState,
        introPhase: phase
      }
    };
  }),
}))

export default useGameState
