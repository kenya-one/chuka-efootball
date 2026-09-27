import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from './useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-banner"
      className="fixed bottom-16 sm:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/90 text-white px-3.5 py-2 text-xs font-semibold shadow-xl backdrop-blur-sm border border-amber-400/30"
    >
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>You are offline. Live competition data and submissions require an internet connection.</span>
    </div>
  );
};
