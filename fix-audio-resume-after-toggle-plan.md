# Fix Audio Resumption After Data Perception Toggle

## Problem Analysis

Based on the error logs and code examination, I've identified the root cause of the audio resumption issue:

1. When toggling data perception on and then off, the audio doesn't resume playing.
2. The error logs show: `ReferenceError: storeAudioStateBeforeToggle is not defined`
3. The functions `storeAudioStateBeforeToggle` and `restoreAudioStateAfterToggle` are referenced in the `AudioContext.Provider` value object, but they were never actually defined in the component.

## Implementation Plan

### 1. Add Missing Function Implementations in AudioContext.jsx

```javascript
// Add these functions before the return statement
const storeAudioStateBeforeToggle = useCallback(() => {
  // Store current audio state
  const currentAudio = isIOS ? audioRef.current : audioElementRef.current;
  if (currentAudio) {
    setWasPlayingBeforeToggle(isPlaying);
    setAudioPositionBeforeToggle(currentAudio.currentTime || 0);
    console.log('[AudioContext] Stored audio state:', { 
      wasPlaying: isPlaying, 
      position: currentAudio.currentTime || 0 
    });
  }
}, [isPlaying, isIOS]);

const restoreAudioStateAfterToggle = useCallback(() => {
  // Restore audio state
  const currentAudio = isIOS ? audioRef.current : audioElementRef.current;
  console.log('[AudioContext] Restoring audio state:', { 
    wasPlaying: wasPlayingBeforeToggle, 
    position: audioPositionBeforeToggle 
  });
  
  if (currentAudio && wasPlayingBeforeToggle) {
    // Set the current time if available
    if (typeof currentAudio.currentTime === 'number' && audioPositionBeforeToggle > 0) {
      currentAudio.currentTime = audioPositionBeforeToggle;
    }
    
    // Resume playback if it was playing before
    resumeAudio();
  }
}, [wasPlayingBeforeToggle, audioPositionBeforeToggle, isIOS, resumeAudio]);
```

### 2. Keep the Provider Value Object as Is

```javascript
const providerValue = {
  // ... existing properties
  storeAudioStateBeforeToggle: storeAudioStateBeforeToggle,
  restoreAudioStateAfterToggle: restoreAudioStateAfterToggle
};
```

### 3. Ensure GameContainer.jsx Correctly Uses These Functions

The `GameContainer.jsx` file should already be updated to use these functions when toggling data perception:

```javascript
// Create a wrapped toggle function
const handleToggleDataPerception = useCallback(() => {
  if (!gameState.dataPerceptionActive) {
    // About to turn ON data perception, store audio state
    storeAudioStateBeforeToggle();
  } else {
    // About to turn OFF data perception
    // Use setTimeout to ensure component has updated before restoring audio
    setTimeout(() => {
      restoreAudioStateAfterToggle();
    }, 100); // Small delay to ensure components have updated
  }
  
  // Call the original toggle function
  toggleDataPerception();
}, [gameState.dataPerceptionActive, toggleDataPerception, storeAudioStateBeforeToggle, restoreAudioStateAfterToggle]);
```

## Expected Outcome

After implementing these changes:
1. When data perception is toggled ON, the audio state will be stored
2. When data perception is toggled OFF, the audio state will be restored
3. Audio will resume playing if it was playing before the toggle

## Implementation Steps

1. Switch to Code mode to implement the changes
2. Add the missing function implementations in `AudioContext.jsx`
3. Test the application to verify the fix works