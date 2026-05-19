import { useState, useEffect, useCallback } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const clearWasOffline = useCallback(() => setWasOffline(false), [])

  return { isOnline, wasOffline, clearWasOffline }
}
