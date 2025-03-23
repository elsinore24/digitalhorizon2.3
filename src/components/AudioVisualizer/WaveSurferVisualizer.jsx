import ToneVisualizer from './ToneVisualizer';

// This component is kept for backward compatibility but now uses Tone.js
// instead of WaveSurfer for iOS audio compatibility
export default function WaveSurferVisualizer() {
  return <ToneVisualizer />;
}
