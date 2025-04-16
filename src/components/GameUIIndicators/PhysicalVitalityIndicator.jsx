import React from 'react';
import PropTypes from 'prop-types';
import sharedStyles from './IndicatorContainer.module.scss'; // Shared styles
import styles from './PhysicalVitalityIndicator.module.scss'; // Specific styles

const PhysicalVitalityIndicator = ({ value }) => {
  const normalizedValue = Math.max(0, Math.min(100, value)); // Clamp value between 0 and 100
  const segments = 20; // Number of segments in the bar
  const filledSegments = Math.round((normalizedValue / 100) * segments);

  // Placeholder data - replace with actual data source later
  const fluctuation = "±1.1%"; // Example different fluctuation
  const lastUpdate = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  // Different status text based on vitality
  const statusText = normalizedValue > 85 ? "OPTIMAL" : normalizedValue > 60 ? "HEALTHY" : normalizedValue > 30 ? "WEAKENED" : "CRITICAL";

  return (
    <div className={`${sharedStyles.indicatorWrapper} ${styles.vitalityIndicator}`}>
      {/* Effects Overlays */}
      <div className={sharedStyles.scanline}></div>
      <div className={sharedStyles.noiseOverlay}></div>

      {/* Content */}
      <div className={sharedStyles.indicatorTitle}>Physical Body</div>
      <div className={sharedStyles.indicatorStatus}>{`${normalizedValue}% ${statusText}`}</div>

      {/* Segmented Bar */}
      <div className={`${sharedStyles.indicatorBarBase} ${styles.segmentedBar}`}>
        {Array.from({ length: segments }).map((_, index) => (
          <div
            key={index}
            className={`${styles.segment} ${index < filledSegments ? styles.filled : styles.empty}`}
            style={{ '--segment-index': index, '--filled-segments': filledSegments }}
          ></div>
        ))}
      </div>

      {/* Technical Details Removed */}
    </div>
  );
};

PhysicalVitalityIndicator.propTypes = {
  value: PropTypes.number.isRequired,
};

export default PhysicalVitalityIndicator;