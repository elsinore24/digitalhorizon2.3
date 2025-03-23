import AudioVisualizer from './index';

// This component is kept for backward compatibility but now uses the main AudioVisualizer
// instead of WaveSurfer for iOS audio compatibility
export default function WaveSurferVisualizer() {
  return <AudioVisualizer />;
}
