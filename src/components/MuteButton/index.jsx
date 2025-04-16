import React from 'react';
import useAudio from '../../hooks/useAudio'; // Adjust path if necessary
import styles from './MuteButton.module.scss';

// Basic SVG icons for volume on/off
const VolumeOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

const VolumeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <line x1="23" y1="9" x2="17" y2="15"></line>
    <line x1="17" y1="9" x2="23" y2="15"></line>
  </svg>
);


export default function MuteButton() {
  // Get mute state and toggle function from the audio hook/context
  // Note: We need to update useAudio hook to expose these first!
  // Let's assume useAudio will be updated to return { isMuted, toggleMute }
  const { isMuted, toggleMute } = useAudio();

  // Handle cases where context might not be ready yet
  if (typeof isMuted === 'undefined' || typeof toggleMute === 'undefined') {
    // console.log("Audio context not fully ready for MuteButton");
    return null; // Don't render button if context/hook isn't ready
  }

  return (
    <button
      className={styles.muteButton}
      onClick={toggleMute}
      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
    >
      {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
    </button>
  );
}