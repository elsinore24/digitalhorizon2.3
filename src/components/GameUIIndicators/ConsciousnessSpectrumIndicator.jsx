import React from 'react';
import PropTypes from 'prop-types';
import sharedStyles from './IndicatorContainer.module.scss'; // Shared styles
import styles from './ConsciousnessSpectrumIndicator.module.scss'; // Specific styles

const ConsciousnessSpectrumIndicator = ({ humanValue, aiValue }) => {
  const normHuman = Math.max(0, Math.min(100, humanValue));
  const normAI = Math.max(0, Math.min(100, aiValue));
  // Ensure total doesn't exceed 100 for visualization if they represent parts of a whole
  // If they are independent, this normalization might not be needed. Assuming they represent balance:
  const total = normHuman + normAI;
  const displayHuman = total > 0 ? Math.round((normHuman / total) * 100) : 50; // Default to 50/50 if total is 0
  const displayAI = total > 0 ? 100 - displayHuman : 50;

  // Placeholder data
  const fluctuation = "±2.5 Units"; // Example different unit
  const lastUpdate = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  let statusText = "BALANCED";
  if (displayHuman > 65) statusText = "HUMAN DOMINANT";
  else if (displayAI > 65) statusText = "AI DOMINANT";
  else if (displayHuman > 55) statusText = "HUMAN LEANING";
  else if (displayAI > 55) statusText = "AI LEANING";


  return (
    <div className={`${sharedStyles.indicatorWrapper} ${styles.consciousnessIndicator}`}>
      {/* Effects Overlays */}
      <div className={sharedStyles.scanline}></div>
      <div className={sharedStyles.noiseOverlay}></div>

      {/* Content */}
      <div className={sharedStyles.indicatorTitle}>Consciousness</div>
      <div className={sharedStyles.indicatorStatus}>{`H:${displayHuman}% / A:${displayAI}%`}</div>

      {/* Dual Indicator Bar */}
      <div className={`${sharedStyles.indicatorBarBase} ${styles.dualBarContainer}`}>
        {/* Human Indicator */}
        <div
          className={`${styles.dualFill} ${styles.humanFill}`}
          style={{ width: `${displayHuman}%` }}
          title={`Human: ${displayHuman}%`}
        ></div>
        {/* AI Indicator */}
        <div
          className={`${styles.dualFill} ${styles.aiFill}`}
          style={{ width: `${displayAI}%` }}
          title={`AI: ${displayAI}%`}
        ></div>
      </div>

      {/* Technical Details Removed */}
    </div>
  );
};

ConsciousnessSpectrumIndicator.propTypes = {
  humanValue: PropTypes.number.isRequired,
  aiValue: PropTypes.number.isRequired,
};

export default ConsciousnessSpectrumIndicator;