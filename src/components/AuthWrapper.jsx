import { useEffect } from 'react'
import useAuth from '../hooks/useAuth'
import useGameState from '../hooks/useGameState'
import styles from './AuthWrapper.module.scss'

export default function AuthWrapper({ children }) {
  const { user, loading } = useAuth()
  const { loadGame } = useGameState()

  useEffect(() => {
    if (user) {
      loadGame(user.id)
    }
  }, [user, loadGame])

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Initializing Systems...</p>
      </div>
    )
  }

  return children
}
