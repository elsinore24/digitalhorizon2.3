import React from 'react';
// import StatusIndicator from '../StatusIndicator'; // Removed old component import
import IndicatorContainer from '../GameUIIndicators/IndicatorContainer'; // Import the new container
import styles from './TopStatusBar.module.scss';

const TopStatusBar = () => {
  // Removed old hardcoded indicator data
  // Placeholder values for the new container - replace with actual game state later
  const neuralValue = 95;
  const vitalityValue = 100; // Assuming OPTIMAL means 100%
  const consciousnessHuman = 50; // Assuming SEPARATE means 50/50 split
  const consciousnessAI = 50;

  return (
    <div className={styles.statusBarContainer}>
      <IndicatorContainer
        neuralValue={neuralValue}
        vitalityValue={vitalityValue}
        consciousnessHuman={consciousnessHuman}
        consciousnessAI={consciousnessAI}
      />
    </div>
  );
};

export default TopStatusBar;