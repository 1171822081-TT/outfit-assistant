import { useEffect, useState } from 'react'

interface NetworkBannerProps {
  isOnline: boolean
  wasOffline: boolean
  onClearWasOffline: () => void
}

export default function NetworkBanner({ isOnline, wasOffline, onClearWasOffline }: NetworkBannerProps) {
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true)
      onClearWasOffline()
      const timer = setTimeout(() => setShowReconnected(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [wasOffline, isOnline, onClearWasOffline])

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-[var(--color-warning)]/90 px-4 py-2 text-sm font-medium text-black">
        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.242 4.242a1 1 0 010-1.414" />
        </svg>
        当前离线，数据可能不是最新
      </div>
    )
  }

  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-[var(--color-success)]/90 px-4 py-2 text-sm font-medium text-white animate-in fade-in slide-in-from-top">
        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        网络已恢复
      </div>
    )
  }

  return null
}
