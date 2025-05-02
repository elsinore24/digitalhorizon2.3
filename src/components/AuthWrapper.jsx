import { useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useGameStore from '../store/useGameStore'; // Import useGameStore
import styles from './AuthWrapper.module.scss';
import Login from './Login';
import SignUp from './SignUp';
import LogoutButton from './LogoutButton';

export default function AuthWrapper({ children }) {
  const { user, loading } = useAuth();
  const { loadGameStateFromServer, isGameLoaded, resetGameState, saveGameStateToServer } = useGameStore(); // Get loadGameStateFromServer, isGameLoaded, resetGameState, and saveGameStateToServer from Zustand

  useEffect(() => {
    // If user is logged in and game state hasn't been loaded yet, load it
    if (user && !isGameLoaded) {
      loadGameStateFromServer();
    }
  }, [user, isGameLoaded, loadGameStateFromServer]); // Depend on user, isGameLoaded, and loadGameStateFromServer

  const handleRestart = () => {
    resetGameState();
    saveGameStateToServer(); // Save the reset state
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Initializing Systems...</p>
      </div>
    );
  }

  if (!user) {
    // No user session, show login/signup forms
    return (
      <div className={styles.authFormsContainer}> {/* Add a container div for styling */}
        <Login />
        <SignUp />
      </div>
    );
  }

  // User session exists, show main app content and logout button
  return (
    <>
      <LogoutButton /> {/* Add logout button */}
      <button onClick={handleRestart}>Restart Game</button> {/* Add Restart button */}
      {children}
    </>
  );
}
