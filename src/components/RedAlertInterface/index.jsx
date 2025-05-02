import React from 'react';
import styles from './RedAlertInterface.module.scss';

const RedAlertInterface = ({ onAttemptRealign }) => {
  return (
    <div className={styles.redAlertContainer}>
      <div className={styles.headerBox}>
        <h1 className={styles.headerTitle}>CRITICAL SYSTEM FAILURE</h1>
      </div>

      <div className={styles.statusSection}>
        <div className={styles.statusBlock}>
          <p className={styles.statusLabel}>NEURAL STABILITY: <span className={styles.statusValue}>7%</span></p>
          <div className={styles.statusBarOuter}>
            <div className={styles.statusBarInner} style={{ width: '7%' }}></div>
          </div>
        </div>

        <div className={styles.statusBlock}>
          <p className={styles.statusLabel}>PHYSICAL VITALITY: <span className={styles.statusValue}>CRITICAL</span></p>
          <div className={styles.statusBarOuter}>
            <div className={styles.statusBarInner} style={{ width: '15%' }}></div>
          </div>
        </div>
      </div>

      <div className={`${styles.dialogueBlock} ${styles.dialogueAlara}`}>
        <p>ALARA: Dr. Thorne! Can you hear me? Your neural patterns are collapsing!</p>
      </div>

      <div className={`${styles.dialogueBlock} ${styles.dialogueThorne}`}>
        <p>DR. THORNE: Too much... alien data... can't maintain... the link...</p>
      </div>

      <div className={styles.warningBlock}>
        <p>WARNING: TERMINAL DISCONNECTION IMMINENT</p>
        <p>CATASTROPHIC NEURAL DAMAGE PREDICTED</p>
      </div>

      <div className={styles.actionButtonContainer}>
        <button className={styles.actionButton} onClick={onAttemptRealign}>
          ATTEMPT EMERGENCY NEURAL REALIGNMENT
        </button>
      </div>
    </div>
  );
};

export default RedAlertInterface;