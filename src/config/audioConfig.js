import { supabase } from './supabase'

const AUDIO_BUCKET = 'narration-audio'

export const getAudioUrl = (filename) => {
  const { data } = supabase
    .storage
    .from(AUDIO_BUCKET)
    .getPublicUrl(filename)
  
  return data.publicUrl
}

export const audioFiles = {
  lunar_arrival_intro: 'lunar_arrival_intro.mp3',
  lunar_arrival_explanation: 'lunar_arrival_explanation.mp3',
  lunar_arrival_details: 'lunar_arrival_details.mp3',
  lunar_arrival_instructions: 'lunar_arrival_instructions.mp3',
  lunar_arrival_urgency: 'lunar_arrival_urgency.mp3'
}
