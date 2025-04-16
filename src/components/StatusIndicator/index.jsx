import React from 'react';
import styles from './StatusIndicator.module.scss';

const StatusIndicator = ({ label, value, displayType = 'text' }) => {

  const renderValue = () => {
    switch (displayType) {
      case 'percentageBar':
        const numericValue = Number(value) || 0;
        const clampedValue = Math.max(0, Math.min(100, numericValue)); // Ensure value is between 0-100
        const barColor = `hsl(${clampedValue * 1.2}, 70%, 50%)`; // Color calculation like StabilityMeter

        return (
          <>
            <div className={styles.meter}>
              <div
                className={styles.fill}
                style={{
                  width: `${clampedValue}%`,
                  backgroundColor: barColor
                }}
              />
            </div>
            <div className={styles.label}>
              {label}: {clampedValue}%
            </div>
          </>
        );

      case 'spectrum':
        return (
          <>
            <div className={styles.label}>{label}</div>
            <div className={`${styles.valueText} ${styles.valueSeparate}`}>{value}</div>
            <div className={styles.consciousnessIndicators}>
              <div className={`${styles.spectrumIndicator} ${styles.indicatorHuman}`}></div>
              <div className={`${styles.spectrumIndicator} ${styles.indicatorAI}`}></div>
            </div>
          </>
        );

      case 'text':
      default:
        let valueStyle = '';
        if (typeof value === 'string') {
           if (value.toUpperCase() === 'OPTIMAL') valueStyle = styles.valueOptimal;
           // Add more conditions for other text values if needed
        }
        return (
          <>
            <div className={styles.label}>{label}</div>
            <div className={`${styles.valueText} ${valueStyle}`}>{value}</div>
          </>
        );
    }
  };

  return (
    <div className={styles.indicatorContainer}>
      {renderValue()}
    </div>
  );
};

export default StatusIndicator;