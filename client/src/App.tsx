import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import { IdleTimeoutModal } from './components/IdleTimeoutModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SkeletonCard, SkeletonText } from './components/ui/Skeleton';

// Route-level code splitting
const Login = lazy(() => import('./pages/Login'));
const ReportComplaint = lazy(() => import('./pages/ReportComplaint'));
const MyComplaints = lazy(() => import('./pages/MyComplaints'));
const AssistantDashboard = lazy(() => import('./pages/AssistantDashboard'));

// Dev-only lazy loaded design system preview
const DesignSystemPreview = import.meta.env.DEV
  ? lazy(() => import('./pages/DesignSystemPreview'))
  : null;

const PageLoaderFallback: React.FC = () => (
  <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 animate-in fade-in-0 duration-200">
    <div className="flex items-center justify-between pb-2 border-b border-border/40">
      <div className="h-6 w-40 rounded-md bg-muted/80 animate-pulse" />
      <div className="h-6 w-20 rounded-md bg-muted/80 animate-pulse" />
    </div>
    <SkeletonCard />
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <SkeletonText lines={3} />
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <AppShell>
              <IdleTimeoutModal />

              <Suspense fallback={<PageLoaderFallback />}>
                <Routes>
                  {/* Public Authentication */}
                  <Route path="/login" element={<Login />} />

                  {/* Dev-only Design System Preview (excluded in production) */}
                  {import.meta.env.DEV && DesignSystemPreview && (
                    <Route path="/design" element={<DesignSystemPreview />} />
                  )}

                  {/* Root Redirection */}
                  <Route path="/" element={<Navigate to="/report" replace />} />

                  {/* Protected Student / Universal Routes */}
                  <Route
                    path="/report"
                    element={
                      <ProtectedRoute>
                        <ReportComplaint />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/my-complaints"
                    element={
                      <ProtectedRoute>
                        <MyComplaints />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Assistant Routes */}
                  <Route
                    path="/assistant"
                    element={
                      <ProtectedRoute allowedRoles={['LAB_ASSISTANT', 'ADMIN', 'DEPT_AUTHORITY', 'HOD']}>
                        <AssistantDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/report" replace />} />
                </Routes>
              </Suspense>
            </AppShell>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
