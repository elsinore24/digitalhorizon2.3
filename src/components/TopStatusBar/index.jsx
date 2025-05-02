import React from 'react';
// import StatusIndicator from '../StatusIndicator'; // Removed old component import
import IndicatorContainer from '../GameUIIndicators/IndicatorContainer'; // Import the new container
import useGameState from '../../hooks/useGameState'; // Import the Zustand hook
import styles from './TopStatusBar.module.scss';

const TopStatusBar = () => {
  const dataPerceptionActive = useGameState(state => state.gameState.dataPerceptionActive); // Correctly select nested state

  // Removed old hardcoded indicator data
  // Placeholder values for the new container - replace with actual game state later
  const neuralValue = 95; // TODO: Replace with gameState.player.neuralStability or similar
  const vitalityValue = 100; // Assuming OPTIMAL means 100%
  const consciousnessHuman = 50; // Assuming SEPARATE means 50/50 split
  const consciousnessAI = 50;

  return (
    <div className={styles.statusBarContainer}>
      {dataPerceptionActive && ( // Conditionally render based on dataPerceptionActive from hook
        <IndicatorContainer
          neuralValue={neuralValue}
          vitalityValue={vitalityValue}
          consciousnessHuman={consciousnessHuman}
          consciousnessAI={consciousnessAI}
        />
      )}
    </div>
  );
};

export default TopStatusBar;