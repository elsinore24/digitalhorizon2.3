import { useCallback } from 'react'
import { db } from '../config/database'
import useAuth from './useAuth'

export default function useDatabase() {
  const { user } = useAuth()

  const saveGame = useCallback(async (saveData) => {
    if (!user) return
    return await db.saveGame(user.id, saveData)
  }, [user])

  const loadGame = useCallback(async () => {
    if (!user) return
    return await db.loadGame(user.id)
  }, [user])

  const unlockAchievement = useCallback(async (achievementId) => {
    if (!user) return
    return await db.unlockAchievement(user.id, achievementId)
  }, [user])

  const getAchievements = useCallback(async () => {
    if (!user) return []
    return await db.getAchievements(user.id)
  }, [user])

  return {
    saveGame,
    loadGame,
    unlockAchievement,
    getAchievements,
    getAssetUrl: db.getAssetUrl,
    saveUserContent: user ? (file, path) => db.saveUserContent(user.id, file, path) : null
  }
}
