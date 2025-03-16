import { useState, useCallback } from 'react'
import useAudio from './useAudio'
import useGameState from './useGameState'
import { fragmentTypes } from '../config/fragmentTypes'

export default function useFragmentCollection() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentFragment, setCurrentFragment] = useState(null)
  const { playNarration, playSound } = useAudio()
  const { gameState, updateGameState } = useGameState()

  const handleFragmentInteraction = useCallback(async (fragmentId, type) => {
    if (gameState.discoveredEchoes?.includes(fragmentId)) {
      return
    }

    if (isAnalyzing) {
      return
    }

    try {
      setIsAnalyzing(true)
      setCurrentFragment(fragmentId)

      const fragmentConfig = fragmentTypes[type]

      // Update game state to collect the fragment
      updateGameState({
        discoveredEchoes: [...(gameState.discoveredEchoes || []), fragmentId],
        player: {
          ...gameState.player,
          stabilityMeter: Math.max(0, Math.min(100, 
            (gameState.player?.stabilityMeter || 100) + fragmentConfig.stabilityEffect
          ))
        }
      })

      // Wait for analysis duration
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.error('Fragment analysis error:', error)
    } finally {
      setIsAnalyzing(false)
      setCurrentFragment(null)
    }
  }, [isAnalyzing, gameState, updateGameState])

  return {
    isAnalyzing,
    currentFragment,
    handleFragmentInteraction
  }
}
