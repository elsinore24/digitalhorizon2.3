import { supabase } from './supabase'

export const db = {
  // Player operations
  async createPlayer(userId, username) {
    return await supabase
      .from('players')
      .insert([{ id: userId, username }])
      .single()
  },

  async getPlayer(userId) {
    return await supabase
      .from('players')
      .select('*')
      .eq('id', userId)
      .single()
  },

  // Save operations
  async saveGame(userId, saveData) {
    return await supabase
      .from('game_saves')
      .upsert({
        user_id: userId,
        save_data: saveData,
        updated_at: new Date().toISOString()
      })
  },

  async loadGame(userId) {
    return await supabase
      .from('game_saves')
      .select('save_data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
  },

  // Achievement operations
  async unlockAchievement(userId, achievementId) {
    return await supabase
      .from('achievements')
      .insert([{
        user_id: userId,
        achievement_id: achievementId
      }])
      .single()
  },

  async getAchievements(userId) {
    return await supabase
      .from('achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId)
  },

  // Storage operations
  getAssetUrl(path) {
    return supabase
      .storage
      .from('game-assets')
      .getPublicUrl(path).data.publicUrl
  },

  async saveUserContent(userId, file, path) {
    return await supabase
      .storage
      .from('user-content')
      .upload(`${userId}/${path}`, file)
  }
}
