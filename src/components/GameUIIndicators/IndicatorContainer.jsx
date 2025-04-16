import React from 'react';
import PropTypes from 'prop-types';
import NeuralStabilityIndicator from './NeuralStabilityIndicator';
import PhysicalVitalityIndicator from './PhysicalVitalityIndicator';
import ConsciousnessSpectrumIndicator from './ConsciousnessSpectrumIndicator';
import styles from './IndicatorContainer.module.scss';

const IndicatorContainer = ({ neuralValue, vitalityValue, consciousnessHuman, consciousnessAI }) => {
  return (
    <div className={styles.indicatorsGrid}>
      <NeuralStabilityIndicator value={neuralValue} />
      <PhysicalVitalityIndicator value={vitalityValue} />
      <ConsciousnessSpectrumIndicator humanValue={consciousnessHuman} aiValue={consciousnessAI} />
    </div>
  );
};

IndicatorContainer.propTypes = {
  neuralValue: PropTypes.number.isRequired,
  vitalityValue: PropTypes.number.isRequired,
  consciousnessHuman: PropTypes.number.isRequired,
  consciousnessAI: PropTypes.number.isRequired,
};

// Example Usage (You would integrate this into your game UI)
// <IndicatorContainer
//   neuralValue={95}
//   vitalityValue={88}
//   consciousnessHuman={60}
//   consciousnessAI={40}
// />

export default IndicatorContainer;