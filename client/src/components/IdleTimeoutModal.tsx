import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/axios';

const IDLE_WARNING_TIME = 13 * 60 * 1000; // 13 minutes: show warning
const IDLE_LOGOUT_TIME = 15 * 60 * 1000; // 15 minutes: forced logout

export const IdleTimeoutModal: React.FC = () => {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(120);
  const lastActivityRef = useRef<number>(Date.now());

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  const handleStayActive = async () => {
    try {
      await api.get('/auth/me'); // Refreshes sliding cookie session
    } catch {
      // Ignore
    }
    resetActivity();
    setShowWarning(false);
  };

  useEffect(() => {
    if (!user) return;

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleEvent = () => {
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    events.forEach((e) => window.addEventListener(e, handleEvent));

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= IDLE_LOGOUT_TIME) {
        setShowWarning(false);
        logout();
      } else if (elapsed >= IDLE_WARNING_TIME) {
        const remaining = Math.max(0, Math.floor((IDLE_LOGOUT_TIME - elapsed) / 1000));
        setRemainingSeconds(remaining);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleEvent));
      clearInterval(checkInterval);
    };
  }, [user, showWarning, logout]);

  if (!showWarning || !user) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-xl font-bold">
          ⏱️
        </div>
        <h3 id="idle-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Inactivity Warning
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You have been idle for almost 15 minutes. For security reasons, your session will automatically expire in:
        </p>
        <div className="text-3xl font-mono font-bold text-amber-600 dark:text-amber-400 py-1">
          {Math.floor(remainingSeconds / 60)}:
          {String(remainingSeconds % 60).padStart(2, '0')}
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => logout()}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Log Out Now
          </button>
          <button
            onClick={handleStayActive}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md transition"
          >
            Stay Signed In
          </button>
        </div>
      </div>
    </div>
  );
};
