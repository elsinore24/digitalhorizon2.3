# Audio Playback Issue Analysis and Fix Plan

## Root Causes Identified

1. **State Management Issue**: 
   - The `isPlaying` state is not being reset to `false` after the first track ends
   - This is confirmed by the log `[NarrativeReader] Before playAudioFile - isPlaying: true isPausedByUser: false` for the second track
   - This incorrect state disrupts the normal flow of the audio playback logic

2. **Web Audio Graph / Gain Node Issue**:
   - The `masterGainNode` is likely stuck at a gain value of 0 after the first track fades out
   - This is evidenced by the absence of "Master gain node ramp" logs for the second track
   - When the second track plays, the audio data hits this muted gain node and no sound is produced

## Fix Implementation Plan

```mermaid
flowchart TD
    A[Audio Playback Issue] --> B[State Management Fix]
    A --> C[Gain Node Fix]
    
    B --> B1[Reset isPlaying in onEnded handler]
    B --> B2[Add explicit state reset in handleAudioEnded]
    
    C --> C1[Reset masterGainNode before playing]
    C --> C2[Add error handling for play() Promise]
    
    B1 --> D[Test Fix]
    B2 --> D
    C1 --> D
    C2 --> D
    
    D --> E[Address React Router Warnings]
```

### 1. Fix State Reset in NarrativeReader Component

The `handleAudioEnded` function in NarrativeReader/index.jsx (around line 418) needs to explicitly reset the `isPlaying` state before advancing to the next node:

```javascript
// In NarrativeReader component (index.jsx)
const handleAudioEnded = () => {
  console.log('[NarrativeReader] Audio "ended" event triggered. Checking for next narrative node.');
  
  // Set the pending flag to true immediately
  narrativeAdvancementPendingRef.current = true;
  
  // CRITICAL FIX: Reset isPlaying state before advancing to next node
  setIsPlaying(false); // Add this line to reset the state
  
  // Get the latest state using get() from Zustand
  const state = useGameStore.getState();
  const currentGameState = state.gameState;
  
  // Rest of the function remains the same...
}
```

### 2. Ensure Gain Reset in AudioContext.jsx

In the `playAudioFileRef` function (around line 737) or in `playNarrativeAudio` function (around line 814), we need to explicitly reset the master gain node before playing a new track:

```javascript
// Inside AudioContext.jsx -> playNarrativeAudio function
const playNarrativeAudio = useCallback((filePath, onComplete) => {
  console.log('[AudioContext] playNarrativeAudio called with:', filePath);
  
  // Make sure audio context is running before playing
  if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
    audioContextRef.current.resume().then(() => {
      console.log('[AudioContext] Audio context resumed before playing narrative audio');
      
      // CRITICAL FIX: Reset master gain node to 1 before playing
      if (masterGainNodeRef.current) {
        const now = audioContextRef.current.currentTime;
        masterGainNodeRef.current.gain.cancelScheduledValues(now);
        masterGainNodeRef.current.gain.setValueAtTime(masterGainNodeRef.current.gain.value, now);
        masterGainNodeRef.current.gain.linearRampToValueAtTime(1, now + 0.1); // Quick ramp to 1
        console.log('[AudioContext] Master gain node reset to 1 before playing new track');
      }
      
      // Use the existing playAudioFileRef logic for narrative audio
      playAudioFileRef.current(filePath, onComplete);
    }).catch(err => {
      console.error('[AudioContext] Failed to resume audio context:', err);
      // Try to play anyway
      playAudioFileRef.current(filePath, onComplete);
    });
  } else {
    // Audio context is already running or not available
    
    // CRITICAL FIX: Reset master gain node to 1 before playing (for this case too)
    if (audioContextRef.current && masterGainNodeRef.current) {
      const now = audioContextRef.current.currentTime;
      masterGainNodeRef.current.gain.cancelScheduledValues(now);
      masterGainNodeRef.current.gain.setValueAtTime(masterGainNodeRef.current.gain.value, now);
      masterGainNodeRef.current.gain.linearRampToValueAtTime(1, now + 0.1); // Quick ramp to 1
      console.log('[AudioContext] Master gain node reset to 1 before playing new track');
    }
    
    playAudioFileRef.current(filePath, onComplete);
  }
}, []); // No dependencies needed since we're using refs
```

### 3. Add Error Handling for play() Promise

In the `playAudioWithElementRef` function (around line 390), add proper error handling for the play() Promise:

```javascript
// Inside playAudioWithElementRef
audioElementRef.current.play()
  .then(() => {
    console.log('Audio playing:', dialogueId);
    setIsPlaying(true);
    setCurrentTrack(dialogueId);
  })
  .catch(err => {
    console.error('Error playing audio:', err);
    // Reset state if play fails
    setIsPlaying(false);
    setCurrentTrack(null);
    // Optionally call completion callback on error
    if (audioCompletionCallbackRef.current) {
      audioCompletionCallbackRef.current();
      audioCompletionCallbackRef.current = null;
    }
  });
```

### 4. Address React Router Warnings

While not directly related to the audio issue, the console logs show React Router warnings that should be addressed:

```javascript
// In App.jsx or wherever BrowserRouter is defined
<BrowserRouter future={{ 
  v7_startTransition: true, 
  v7_relativeSplatPath: true 
}}>
  {/* App content */}
</BrowserRouter>
```

## Testing Plan

1. Test the audio playback sequence from the first track to the second track
2. Verify that the `isPlaying` state is correctly reset between tracks
3. Confirm that the master gain node is properly reset before playing the second track
4. Check that the audio plays smoothly through both tracks without manual intervention