import React from 'react';
import styles from './ChoicePoint.module.scss';

const ChoicePoint = ({ onChoiceSelected }) => {
  // Ensure onChoiceSelected is a function before calling it
  const handleSelect = (choice) => {
    if (typeof onChoiceSelected === 'function') {
      onChoiceSelected(choice);
    } else {
      console.warn('ChoicePoint: onChoiceSelected prop is not a function!');
    }
  };

  return (
    <div className={styles.choiceContainer}>
      <button
        className={styles.choiceButton}
        onClick={() => handleSelect('clinical')} // Pass identifier for the choice
      >
        [Clinical Approach] "Let's maintain strict neural boundaries during integration. Safety protocols at maximum."
      </button>
      <button
        className={styles.choiceButton}
        onClick={() => handleSelect('embrace')} // Pass identifier for the choice
      >
        [Embracing Uncertainty] "We need to be open to whatever happens. Reduce safety limitations and allow deeper integration."
      </button>
    </div>
  );
};

export default ChoicePoint;