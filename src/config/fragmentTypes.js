export const fragmentTypes = {
  RESEARCH_LOG: {
    color: '#00ffff', // Cyan
    glowColor: 'rgba(0, 255, 255, 0.3)',
    stabilityEffect: +3,
    analysisTime: 5000,
    visualEffect: 'pulse',
    soundEffect: 'research_data',
    dialogue: 'kai_research_log',
    description: 'Research data fragment containing Dr. Kai\'s experimental logs',
    icon: '📊'
  },
  PERSONAL_MEMORY: {
    color: '#ff00ff', // Magenta
    glowColor: 'rgba(255, 0, 255, 0.3)',
    stabilityEffect: +5,
    analysisTime: 7000,
    visualEffect: 'spiral',
    soundEffect: 'personal_memory',
    dialogue: 'kai_personal_memory',
    description: 'Personal memory fragment with strong emotional resonance',
    icon: '💭'
  },
  ANOMALY: {
    color: '#ff3300', // Red-orange
    glowColor: 'rgba(255, 51, 0, 0.3)',
    stabilityEffect: -2,
    analysisTime: 4000,
    visualEffect: 'glitch',
    soundEffect: 'anomaly',
    dialogue: 'alara_warning',
    description: 'Unstable temporal anomaly with potentially hazardous effects',
    icon: '⚠️'
  }
}
