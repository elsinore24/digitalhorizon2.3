import React, { useEffect } from 'react';
import styles from './IntroTransition.module.scss';

const TRANSITION_DURATION = 4500; // milliseconds (adjust as needed)

const IntroTransition = ({ onComplete }) => {
  useEffect(() => {
    // Set a timer to call the onComplete callback after the transition duration
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, TRANSITION_DURATION);

    // Cleanup the timer if the component unmounts before the timer finishes
    return () => clearTimeout(timer);
  }, [onComplete]); // Dependency array includes onComplete

  return (
    <div className={styles.transitionContainer}>
      {/* Apply glitch effect class optionally */}
      <p className={`${styles.message} ${styles.glitchText}`}>NEURAL REALIGNMENT FAILED</p>
      <p className={styles.message}>INITIATING MEMORY RECONSTRUCTION</p>
      {/* Add more elements here for fracture/reconstruction effects later */}
    </div>
  );
};

export default IntroTransition;