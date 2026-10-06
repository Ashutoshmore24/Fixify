import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { IdleTimeoutModal } from './components/IdleTimeoutModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { ReportComplaint } from './pages/ReportComplaint';
import { MyComplaints } from './pages/MyComplaints';
import { AssistantDashboard } from './pages/AssistantDashboard';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
            <Navbar />
            <IdleTimeoutModal />

            <main className="flex-1">
              <Routes>
                {/* Public Authentication */}
                <Route path="/login" element={<Login />} />

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
                    <ProtectedRoute allowedRoles={['LAB_ASSISTANT', 'ADMIN']}>
                      <AssistantDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/report" replace />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
