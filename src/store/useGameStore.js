import { create } from 'zustand';
import { supabase } from '../config/supabaseClient'; // Import supabase client

// Define the structure of your saveable game state
const initialGameState = {
    currentNodeId: null, // Starting node should be null initially
    decisionHistory: {},
    hiddenPointScores: { Enlightenment: 0, Trust: 0, Witness: 0, Reality: 100 },
    visibleIndicatorValues: { NeuralStability: 0.95, PhysicalVitality: 'OPTIMAL', ConsciousnessSpectrum: 'SEPARATE' },
    // Add other necessary state fields...
};

export const useGameStore = create((set, get) => ({
    // --- View State ---
    currentView: 'narrative', // 'narrative' or 'perception'
    activeTuningChallenge: null, // null or an object/ID describing the current challenge

    // --- View Actions ---
    setView: (view) => set({ currentView: view }),
    setActiveTuningChallenge: (challengeData) => set({ activeTuningChallenge: challengeData }),

    // --- Auth State ---
    session: null,
    profile: null,
    loadingAuth: true, // To track initial auth check

    // --- Game State ---
    gameState: initialGameState,
    isGameLoaded: false, // Track if loaded from save

    // --- Actions (Examples) ---
    setSession: (session) => set({ session, loadingAuth: false }),
    setProfile: (profile) => set({ profile }),
    setGameState: (newState) => set({ gameState: newState, isGameLoaded: true }),
    updateGameState: (updates) => set((state) => ({ gameState: { ...state.gameState, ...updates } })),
    resetGameState: () => set({ gameState: initialGameState, isGameLoaded: false }), // For restarting

    // --- Save/Load Actions ---
    saveGameStateToServer: async () => {
        const { session, gameState } = get();
        if (!session?.user) {
            console.error("No user logged in to save game.");
            return;
        }
        try {
            // Use upsert to create or update the save for the user
            const { error } = await supabase
                .from('game_saves')
                .upsert({
                    user_id: session.user.id,
                    game_state: gameState, // Save the whole state object
                    updated_at: new Date(),
                }, { onConflict: 'user_id' }) // Assumes one save slot per user for simplicity
                .select(); // Needed for upsert to return data/error properly

            if (error) throw error;
            console.log("Game state saved.");
        } catch (error) {
            console.error("Error saving game state:", error.message);
            // Add user feedback?
        }
    },

    loadGameStateFromServer: async () => {
        const { session } = get();
        if (!session?.user) {
            console.error("No user logged in to load game.");
            set({ loadingAuth: false }); // Ensure loading stops
            return false;
        }
        try {
            const { data, error, status } = await supabase
                .from('game_saves')
                .select('game_state')
                .eq('user_id', session.user.id)
                .single(); // Assumes one save slot

            if (error && status !== 406) { // 406 means no row found, which is okay
                throw error;
            }

            if (data) {
                // Deep merge might be needed if initialGameState has structure not in saved state
                const loadedState = { ...initialGameState, ...data.game_state };
                set({ gameState: loadedState, isGameLoaded: true });
                console.log("Game state loaded.");
                return true;
            } else {
                console.log("No saved game found.");
                set({ isGameLoaded: false }); // Ensure we know it's a new game
                return false;
            }
        } catch (error) {
            console.error("Error loading game state:", error.message);
            set({ isGameLoaded: false }); // Default to new game on error
            return false;
        } finally {
             set({ loadingAuth: false }); // Ensure loading stops regardless
        }
    },

    // --- Leaderboard Actions ---
    submitToLeaderboard: async (scoreData) => {
        const { session } = get();
        if (!session?.user) {
            console.error("No user logged in to submit score.");
            return;
        }
        try {
            const { error } = await supabase
                .from('leaderboard')
                .insert([
                    {
                        user_id: session.user.id,
                        score: scoreData.score, // Assuming scoreData has a 'score' property
                        progress_metric: scoreData.progress_metric, // Assuming scoreData has a 'progress_metric' property
                        achieved_at: new Date(),
                    }
                ]);

            if (error) throw error;
            console.log("Score submitted to leaderboard.");
        } catch (error) {
            console.error("Error submitting score:", error.message);
            // Add user feedback?
        }
    },

    fetchLeaderboardData: async () => {
        try {
            const { data, error } = await supabase
                .from('leaderboard')
                .select('*')
                .order('score', { ascending: false }); // Order by score descending

            if (error) throw error;
            console.log("Leaderboard data fetched.");
            return data;
        } catch (error) {
            console.error("Error fetching leaderboard data:", error.message);
            // Add user feedback?
            return null;
        }
    },

    advanceNarrativeAction: (chosenInterpretationId) => {
        // --- 1. Get current state ---
        const { gameState, saveGameStateToServer } = get(); // Get current state and save action
        const { currentNodeId, hiddenPointScores, visibleIndicatorValues } = gameState;

        console.log(`Advancing narrative from node ${currentNodeId} with choice ${chosenInterpretationId}`);

        // --- 2. Determine impact of the choice ---
        // TODO: Replace with actual logic based on your narrative data/rules
        let nextNodeId = 'Default_NextNode'; // Placeholder
        let pointsUpdate = { Enlightenment: 0, Trust: 0, Witness: 0, Reality: 0 };
        let indicatorUpdate = { NeuralStability: 0 }; // Change relative to current

        // Logic for the first signal tuning challenge:
        if (currentNodeId === 'Chapter1_LunarSignalAnalysisIntro') {
            if (chosenInterpretationId === 'A') {
                nextNodeId = 'Chapter1_PathA_Result';
                pointsUpdate = { Enlightenment: 2, Trust: -1, Reality: 3, Witness: 0 };
                indicatorUpdate = { NeuralStability: 0.01 };
            } else if (chosenInterpretationId === 'B') {
                nextNodeId = 'Chapter1_PathB_Result';
                pointsUpdate = { Enlightenment: 5, Trust: 2, Witness: 1, Reality: -2 };
                indicatorUpdate = { NeuralStability: -0.01 }; // Net effect after lock
            } else if (chosenInterpretationId === 'C') {
                nextNodeId = 'Chapter1_PathC_Result';
                pointsUpdate = { Enlightenment: -3, Trust: 1, Reality: 5, Witness: 0 };
                indicatorUpdate = { NeuralStability: 0.02 };
            }
        }
        // Add more rules for other decision points later...

        // --- 3. Calculate new state ---
        const newHiddenScores = { ...hiddenPointScores };
        for (const key in pointsUpdate) {
            newHiddenScores[key] = (newHiddenScores[key] || 0) + pointsUpdate[key];
            // Optional: Clamp scores if needed (e.g., Reality between 0-100)
        }

        const newVisibleIndicators = { ...visibleIndicatorValues };
        // Ensure NeuralStability stays between 0 and 1 (or 0-100 if percentage)
        newVisibleIndicators.NeuralStability = Math.max(0, Math.min(1, (newVisibleIndicators.NeuralStability || 0) + indicatorUpdate.NeuralStability));
        // Update other visible indicators if necessary

        // --- 4. Update the store ---
        set({
            gameState: {
                ...gameState, // Keep existing parts of gameState
                currentNodeId: nextNodeId, // Update the current node
                hiddenPointScores: newHiddenScores, // Update hidden scores
                visibleIndicatorValues: newVisibleIndicators, // Update visible indicators
                // Optionally update decisionHistory here too
                decisionHistory: {
                    ...gameState.decisionHistory,
                    [currentNodeId]: chosenInterpretationId // Record the choice made at this node
                }
            }
        });

        console.log('New Game State:', get().gameState); // Log updated state

        // --- 5. Trigger save to server ---
        // Call saveGameStateToServer asynchronously (don't wait for it here)
        saveGameStateToServer();

        // --- 6. Clean up tuning state & potentially switch view ---
        set({
            activeTuningChallenge: null, // Clear the active challenge
            currentView: 'narrative' // Automatically switch back to narrative view
        });

        console.log('Narrative advanced, tuning challenge cleared, view set to narrative.');

    }, // End of advanceNarrativeAction
}));