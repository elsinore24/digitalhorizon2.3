import React from 'react';
import styles from './FlashbackLabScene.module.scss';

const FlashbackLabScene = () => {
  // This component currently just displays the static UI.
  // It doesn't need props unless we add dynamic elements later.
  return (
    <div className={styles.labContainer}>
      <div className={styles.header}>
        <h2 className={styles.headerText}>72 HOURS EARLIER - FIRST NEURAL INTEGRATION EXPERIMENT</h2>
      </div>

      {/* Monitor section removed - now handled by TopStatusBar */}
    </div>
  );
};

export default FlashbackLabScene;