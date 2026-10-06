import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4">
        <header className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md shadow-blue-500/20">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Fixify</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Institutional IT Asset & Maintenance Management System
          </p>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Core System Ready
            </span>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Navigate to="/report" replace />} />
          <Route
            path="/report"
            element={
              <div className="mt-6 text-xs text-slate-400 text-center">
                Scan laboratory QR code to report equipment issues
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
