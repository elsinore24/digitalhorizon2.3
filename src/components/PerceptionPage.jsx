import React from 'react';
import { useGameStore } from '../store/useGameStore';
import SignalTuningInterface from './SignalTuningInterface';
// Import other components for the perception page (e.g., MapComponent, IndicatorDisplay)
import styles from './PerceptionPage.module.scss'; // Import the CSS module

function PerceptionPage() {
    const activeTuningChallenge = useGameStore((state) => state.activeTuningChallenge);
    const advanceNarrativeAction = useGameStore((state) => state.advanceNarrativeAction);

    return (
        <div className={styles['perception-page']}> {/* Apply the CSS module class */}
            {activeTuningChallenge ? (
                <SignalTuningInterface
                    challengeConfig={activeTuningChallenge}
                    advanceNarrative={advanceNarrativeAction}
                />
            ) : (
                <>
                    {/* Placeholder for other perception view elements */}
                    <h3>Perception View Active</h3>
                    <p>No active signal analysis.</p>
                    {/* <MapComponent /> */}
                    {/* <IndicatorDisplay /> */}
                </>
            )}
        </div>
    );
}

export default PerceptionPage;