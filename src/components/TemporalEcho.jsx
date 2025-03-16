import { useState } from 'react'
import { motion } from 'framer-motion'
import { fragmentTypes } from '../config/fragmentTypes'
import useGameState from '../hooks/useGameState'
import InteractionPrompt from './InteractionPrompt'
import FragmentAnalyzer from './FragmentAnalyzer'
import useFragmentCollection from '../hooks/useFragmentCollection'
import styles from './TemporalEcho.module.scss'

export default function TemporalEcho({ 
  id,
  type,
  position
}) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const { gameState } = useGameState()
  const { 
    isAnalyzing, 
    currentFragment, 
    handleFragmentInteraction
  } = useFragmentCollection()

  const fragmentConfig = fragmentTypes[type]
  const isCurrentlyAnalyzing = isAnalyzing && currentFragment === id
  const isCollected = gameState.discoveredEchoes?.includes(id)

  const handleClick = (e) => {
    e.preventDefault()
    if (!isCollected && (!isAnalyzing || currentFragment === id)) {
      handleFragmentInteraction(id, type)
    }
  }

  return (
    <motion.div 
      className={`${styles.echo} ${isCollected ? styles.collected : ''}`}
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
        '--echo-color': fragmentConfig.color,
        '--echo-glow': fragmentConfig.glowColor
      }}
      animate={
        isCurrentlyAnalyzing 
          ? {
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }
          : {
              scale: 1,
              opacity: isCollected ? 0.5 : 1
            }
      }
      transition={{
        duration: 2,
        repeat: isCurrentlyAnalyzing ? Infinity : 0,
        ease: "easeInOut"
      }}
      onMouseEnter={(e) => {
        if (!isCollected) {
          setShowPrompt(true)
          setMousePos({ x: e.clientX, y: e.clientY })
        }
      }}
      onMouseLeave={() => setShowPrompt(false)}
      onClick={handleClick}
    >
      <div className={styles.core}>
        <span className={styles.icon}>{fragmentConfig.icon}</span>
      </div>
      <motion.div 
        className={styles.rings}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 0.3, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {showPrompt && !isCollected && !isAnalyzing && (
        <InteractionPrompt 
          show={true}
          type={type.toLowerCase()}
          position={mousePos}
          description={fragmentConfig.description}
          icon={fragmentConfig.icon}
        />
      )}

      {isCurrentlyAnalyzing && (
        <FragmentAnalyzer 
          isAnalyzing={true}
          fragmentId={id}
          type={type}
          config={fragmentConfig}
        />
      )}
    </motion.div>
  )
}
