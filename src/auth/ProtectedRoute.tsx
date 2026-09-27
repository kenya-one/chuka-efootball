import React from 'react';
import { useAuth } from './AuthProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#080c09] text-white p-6">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
          </div>
        </div>
        <h2
          className="text-lg font-bold tracking-widest uppercase text-white mb-2"
          style={{ fontFamily: "'Chakra Petch', sans-serif" }}
        >
          CHUKA <span className="text-[#22c55e]">eFOOTBALL</span>
        </h2>
        <p className="text-xs text-gray-400 font-medium">Verifying Firebase Authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
