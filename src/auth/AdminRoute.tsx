import React from 'react';
import { useAdmin } from './AdminProvider';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { AdminRole } from './authTypes';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
  fallback?: React.ReactNode;
  onNavigateBack?: () => void;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  requiredRole = 'ADMIN',
  fallback,
  onNavigateBack,
}) => {
  const { isAdmin, isSuperAdmin, role, loading } = useAdmin();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 space-y-3">
        <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
        <span className="text-xs text-gray-400 font-mono tracking-wider uppercase">
          Verifying administrative authorization...
        </span>
      </div>
    );
  }

  // Check general admin authorization
  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="p-8 rounded-3xl bg-red-950/30 border border-red-500/30 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white uppercase tracking-wider font-mono">
            403 — Unauthorized Access
          </h2>
          <p className="text-xs text-red-300 font-mono">
            STATUS: FORBIDDEN / NON_ADMIN_USER
          </p>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          This section is restricted to authorized tournament administrators. Your authenticated account is not registered as an active administrator in the Chuka eFootball official registry.
        </p>
        {onNavigateBack && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Player Hub</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Check specific role requirement if SUPER_ADMIN
  if (requiredRole === 'SUPER_ADMIN' && !isSuperAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="p-8 rounded-3xl bg-amber-950/30 border border-amber-500/30 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white uppercase tracking-wider font-mono">
            Restricted System Operation
          </h2>
          <p className="text-xs text-amber-300 font-mono">
            STATUS: REQUIRES_SUPER_ADMIN_PRIVILEGES (Current: {role || 'ADMIN'})
          </p>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          This operation requires SUPER_ADMIN privileges. Your administrative role does not have permission to execute this system-level task.
        </p>
        {onNavigateBack && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tournaments</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
