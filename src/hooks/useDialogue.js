import { create } from 'zustand'

const useDialogueStore = create((set) => ({
  currentDialogue: null,
  isDialogueActive: false,
  dialogueQueue: [],
  
  setDialogue: (dialogue) => set({ 
    currentDialogue: dialogue,
    isDialogueActive: true 
  }),
  
  completeDialogue: () => set((state) => {
    const nextDialogue = state.dialogueQueue[0]
    const newQueue = state.dialogueQueue.slice(1)
    
    return {
      currentDialogue: nextDialogue || null,
      isDialogueActive: !!nextDialogue,
      dialogueQueue: newQueue
    }
  }),
  
  queueDialogue: (dialogue) => set((state) => ({
    dialogueQueue: [...state.dialogueQueue, dialogue],
    currentDialogue: state.currentDialogue || dialogue,
    isDialogueActive: true
  })),
  
  clearDialogue: () => set({
    currentDialogue: null,
    isDialogueActive: false,
    dialogueQueue: []
  })
}))

// Export the hook directly instead of wrapping it
export default useDialogueStore
