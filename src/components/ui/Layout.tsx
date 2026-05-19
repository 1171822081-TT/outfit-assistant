import { Outlet } from 'react-router-dom'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import BottomNav from './BottomNav'
import NetworkBanner from './NetworkBanner'

export default function Layout() {
  const { isOnline, wasOffline, clearWasOffline } = useNetworkStatus()

  return (
    <div className="mx-auto max-w-lg">
      <NetworkBanner isOnline={isOnline} wasOffline={wasOffline} onClearWasOffline={clearWasOffline} />
      <main className="pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
