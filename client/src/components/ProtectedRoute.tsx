import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Verifying institutional session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Preserve current path and query (e.g. /report?lab=LAB-101) through login redirect
    const fullPath = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(fullPath)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center max-w-md">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center mx-auto text-xl font-bold mb-4">
            🚫
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Access Restricted</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Your role (<span className="font-semibold">{user.role}</span>) does not have authorization to access this area.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
