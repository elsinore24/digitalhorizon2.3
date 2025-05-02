import React from 'react';
import PropTypes from 'prop-types';
import sharedStyles from './IndicatorContainer.module.scss'; // Shared styles
import styles from './NeuralStabilityIndicator.module.scss'; // Specific styles

const NeuralStabilityIndicator = ({ value }) => {
  const normalizedValue = Math.max(0, Math.min(100, value)); // Clamp value between 0 and 100
  const segments = 20; // Number of segments in the bar
  const filledSegments = Math.round((normalizedValue / 100) * segments);

  // Placeholder data - replace with actual data source later
  const fluctuation = "±0.3%";
  const lastUpdate = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const statusText = normalizedValue > 80 ? "NOMINAL" : normalizedValue > 50 ? "STABLE" : normalizedValue > 20 ? "DEGRADED" : "CRITICAL";

  return (
    <div className={`${sharedStyles.indicatorWrapper} ${styles.neuralIndicator}`}>
      {/* Effects Overlays */}
      <div className={sharedStyles.scanline}></div>
      <div className={sharedStyles.noiseOverlay}></div>

      {/* Content */}
      <div className={sharedStyles.indicatorTitle}>Neural Stability</div>
      <div className={sharedStyles.indicatorStatus}>{`${normalizedValue}% ${statusText}`}</div>

      {/* Segmented Bar */}
      <div className={`${sharedStyles.indicatorBarBase} ${styles.segmentedBar}`}>
        {Array.from({ length: segments }).map((_, index) => (
          <div
            key={index}
            className={`${styles.segment} ${index < filledSegments ? styles.filled : styles.empty}`}
            style={{ '--segment-index': index, '--filled-segments': filledSegments }} // Pass index for potential animation delays
          ></div>
        ))}
        {/* Optional: Continuous fill overlay for gradient (can be complex with segments) */}
        {/* <div
          className={`${sharedStyles.indicatorFillBase} ${styles.neuralFill}`}
          style={{ width: `${normalizedValue}%` }}
        ></div> */}
      </div>

      {/* Technical Details Removed */}
    </div>
  );
};

NeuralStabilityIndicator.propTypes = {
  value: PropTypes.number.isRequired,
};

export default NeuralStabilityIndicator;