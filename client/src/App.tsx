import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import { IdleTimeoutModal } from './components/IdleTimeoutModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SkeletonCard, SkeletonText } from './components/ui/Skeleton';

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Route-level code splitting
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const PendingApproval = lazy(() => import('./pages/PendingApproval'));
const ReportComplaint = lazy(() => import('./pages/ReportComplaint'));
const MyComplaints = lazy(() => import('./pages/MyComplaints'));
const AssistantDashboard = lazy(() => import('./pages/AssistantDashboard'));
const Profile = lazy(() => import('./pages/Profile'));

// Admin Module routes
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminDepartments = lazy(() => import('./pages/admin/AdminDepartments'));
const AdminLabs = lazy(() => import('./pages/admin/AdminLabs'));
const AdminComputers = lazy(() => import('./pages/admin/AdminComputers'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'));

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
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <ToastProvider>
                <AppShell>
                  <IdleTimeoutModal />

                  <Suspense fallback={<PageLoaderFallback />}>
                    <Routes>
                      {/* Public Authentication */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/complete-profile" element={<CompleteProfile />} />
                      <Route path="/pending-approval" element={<PendingApproval />} />

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

                      {/* Protected Profile Route for all authenticated roles */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Admin Module Routes (Strictly ADMIN only) */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/users"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminUsers />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/departments"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminDepartments />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/labs"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminLabs />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/computers"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminComputers />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/settings"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminSettings />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/audit"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminAudit />
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
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
