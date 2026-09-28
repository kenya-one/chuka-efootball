import React from 'react';
import { AuthProvider } from './auth/AuthProvider';
import { AdminProvider } from './auth/AdminProvider';
import { PlayerProvider } from './auth/PlayerProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <PlayerProvider>
          <div id="app-root" className="min-h-screen w-full bg-[#080c09] text-gray-100">
            <OfflineIndicator />
            <ProtectedRoute fallback={<LoginPage />}>
              <DashboardPage />
            </ProtectedRoute>
          </div>
        </PlayerProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
