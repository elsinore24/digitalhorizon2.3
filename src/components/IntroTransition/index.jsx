import React, { useState, useEffect, useRef } from 'react';
import styles from './IntroTransition.module.scss';

// Duration for text display before fade
const TEXT_DISPLAY_DURATION = 4000; // 4 seconds
const FADE_DURATION = 1500; // 1.5 seconds for fade out

const IntroTransition = ({ onComplete, startTransition }) => {
  const [animationPhase, setAnimationPhase] = useState('idle'); // 'idle', 'text', 'fading', 'done'
  
  const containerRef = useRef(null);
  const textContainerRef = useRef(null);
  
  // Start transition when startTransition prop becomes true
  useEffect(() => {
    if (startTransition && animationPhase === 'idle') {
      console.log('[IntroTransition] startTransition is true, starting text phase');
      setAnimationPhase('text');
    }
  }, [startTransition, animationPhase]);

  // Handle text display phase
  useEffect(() => {
    if (animationPhase === 'text') {
      console.log('[IntroTransition] Starting text phase');
      
      // Make sure text container is visible
      if (textContainerRef.current) {
        textContainerRef.current.style.visibility = 'visible';
        textContainerRef.current.style.opacity = '1';
      }
      
      // Timer to trigger fading phase after text display
      const timer = setTimeout(() => {
        console.log('[IntroTransition] Text display complete, transitioning to fading phase');
        setAnimationPhase('fading');
      }, TEXT_DISPLAY_DURATION);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [animationPhase]); // Depend on animationPhase
  
  // Handle fading phase
  useEffect(() => {
    if (animationPhase === 'fading') {
      console.log('[IntroTransition] Starting fade animation');
      
      // Fade out text container
      if (textContainerRef.current) {
        console.log('[IntroTransition] Fading out text container');
        textContainerRef.current.style.transition = `opacity ${FADE_DURATION/1000}s ease-out`;
        textContainerRef.current.style.opacity = '0';
        
        // After fade out, complete the transition
        setTimeout(() => {
          console.log('[IntroTransition] Fade complete, moving to done phase');
          setAnimationPhase('done');
          if (onComplete) {
            console.log('[IntroTransition] Calling onComplete callback');
            onComplete();
          }
        }, FADE_DURATION + 200); // Add a small buffer
      } else {
        // Fallback if text container is not available
        console.error('[IntroTransition] Text container not available for fading');
        setAnimationPhase('done');
        if (onComplete) {
          onComplete();
        }
      }
    }
  }, [animationPhase, onComplete]);
  
  console.log(`[IntroTransition] Current animation phase: ${animationPhase}`);
  
  // Only render the transition container if not in 'idle' or 'done' phase
  if (animationPhase === 'idle' || animationPhase === 'done') {
    return null;
  }

  return (
    <div ref={containerRef} className={styles.transitionContainer} style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      {/* Text container */}
      <div
        ref={textContainerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          visibility: animationPhase === 'text' ? 'visible' : 'hidden', // Control visibility based on phase
          opacity: animationPhase === 'text' ? 1 : 0, // Control opacity based on phase
          transition: `opacity ${FADE_DURATION/1000}s ease-out`,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.9)'
        }}
      >
        <p className={styles.glitchText} style={{
          fontSize: '2.5em', // Further reduced for mobile
          color: '#ff0000',
          textShadow: '0 0 10px #ff0000, 0 0 20px #ff0000',
          margin: '15px 0',
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '0 10px'
        }}>NEURAL REALIGNMENT FAILED</p>
        <p style={{
          fontSize: '1.8em', // Further reduced for mobile
          color: '#ff0000',
          textShadow: '0 0 10px #ff0000, 0 0 20px #ff0000',
          margin: '15px 0',
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '0 10px'
        }}>INITIATING MEMORY RECONSTRUCTION</p>
      </div>
    </div>
  );
};

export default IntroTransition;