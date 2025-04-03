import { useState } from 'react' // Removed unused useState
import { motion } from 'framer-motion'
// Removed unused imports: useEffect, fragmentTypes, useGameState, InteractionPrompt, FragmentAnalyzer, useFragmentCollection
import styles from './TemporalEcho.module.scss'

export default function TemporalEcho({
  id, // Keep id for key prop in parent mapping
  destinationConfig // Pass the rest of the config object
}) {
  // Destructure config properties
  const {
    position,
    visualStyle, // Used for simple destinations
    color,       // Used for simple destinations
    caption,     // Used for simple destinations
    motion: motionConfig, // Used for simple destinations (or potentially parent)
    parentBody,  // Config for the main body (e.g., Mars planet)
    childBody    // Config for the orbiting body (e.g., outpost)
  } = destinationConfig;

  // Determine if this is a compound destination
  const isCompound = !!parentBody;
  // Removed unused state and hooks: showCaption, captionToShow, showPrompt, mousePos, gameState, useFragmentCollection related state/functions
  // Removed config derived from fragmentTypes

  // Removed handleClick function
  // Common style for the main container div
  const containerStyle = {
    left: `${position.x}%`,
    top: `${position.y}%`,
  };

  // --- Render Logic ---
  if (isCompound) {
    // Render Compound Destination (e.g., Mars + Outpost)
    const parentStyle = {
      '--echo-color': parentBody.color || '#fff',
      width: `${parentBody.size || 40}px`, // Use size from config
      height: `${parentBody.size || 40}px`,
    };
    const childStyle = {
      '--echo-color': childBody.color || '#fff',
      width: `${childBody.size || 15}px`,
      height: `${childBody.size || 15}px`,
    };
    const orbitDuration = childBody.motion?.type === 'orbit' ? `${childBody.motion.speed || 5}s` : '5s';

    return (
      <div
        className={`${styles.echo} ${styles.compoundContainer}`} // Base + compound marker
        style={containerStyle}
        // Prevent clicks on the container from triggering caption if parent/child have handlers
      >
        {/* Parent Body (e.g., Mars) */}
        <motion.div
          className={`${styles.parentBody} ${styles[parentBody.visualStyle] || ''}`}
          style={parentStyle}
          // onClick={(e) => handleClick(e, parentBody.caption)} // Removed onClick
          // Add motion config for parent if needed later
        >
          {/* Core visual element for parent, styled by CSS */}
           <div className={styles.core}></div>
        </motion.div>

        {/* Child Body Wrapper (for orbit animation) */}
        {childBody && (
          <div
            className={styles.childWrapper}
            style={{ animation: `${styles.orbit} ${orbitDuration} linear infinite` }}
          >
            <motion.div
              className={`${styles.childBody} ${styles[childBody.visualStyle] || ''}`}
              style={childStyle}
              // onClick={(e) => handleClick(e, childBody.caption)} // Optional: click handler for child
            >
               {/* Core visual element for child, styled by CSS */}
               <div className={styles.core}></div>
            </motion.div>
          </div>
        )}

        {/* Caption Display (Positioned relative to the main container) */}
        {/* Always show parent caption for compound destinations */}
        <div className={styles.caption}>{parentBody.caption}</div>

      </div>
    );

  } else {
    // Render Simple Destination (e.g., Moon, Satellite)
    const simpleStyle = {
      '--echo-color': color || '#fff',
    };

    return (
      <motion.div
        className={`${styles.echo} ${styles[visualStyle] || ''}`} // Base + specific style
        style={{ ...containerStyle, ...simpleStyle }}
        // onClick={(e) => handleClick(e, caption)} // Removed onClick
        // TODO: Implement animations based on motionConfig if needed
      >
        {/* Core visual element, styled by CSS */}
        <div className={styles.core}></div>

        {/* Caption Display */}
        {/* Always show caption for simple destinations */}
        <div className={styles.caption}>{caption}</div>

      </motion.div>
    );
  }
  // Removed stray closing parenthesis
}
