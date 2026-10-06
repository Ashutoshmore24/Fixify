import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../lib/axios';
import { NotificationItem, UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, devLogin } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    api
      .get('/notifications')
      .then((res) => {
        if (res.data?.success) {
          setNotifications(res.data.data);
        }
      })
      .catch(() => {});

    // Listen to real-time notifications via socket
    if (socket) {
      const handleNewNotification = (item: NotificationItem) => {
        setNotifications((prev) => [item, ...prev]);
      };

      socket.on('notification:new', handleNewNotification);
      return () => {
        socket.off('notification:new', handleNewNotification);
      };
    }
  }, [user, socket]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Ignore
    }
  };

  const roleColors: Record<UserRole, string> = {
    STUDENT: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    FACULTY: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    LAB_ASSISTANT: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    DEPT_AUTHORITY: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    HOD: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    ADMIN: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-md shadow-blue-500/20">
                F
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100">
                Fixify
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/report"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  location.pathname.startsWith('/report')
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Report Issue
              </Link>

              <Link
                to="/my-complaints"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  location.pathname === '/my-complaints'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                My Complaints
              </Link>

              {(user.role === 'LAB_ASSISTANT' || user.role === 'ADMIN') && (
                <Link
                  to="/assistant"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    location.pathname === '/assistant'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Assistant Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Right Section: Role Badge, Notifications, User Menu */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${roleColors[user.role] || ''}`}
            >
              {user.role.replace('_', ' ')}
            </span>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Notifications"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-3 px-4 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`p-2.5 rounded-xl text-xs transition ${
                            n.read
                              ? 'bg-transparent text-slate-500'
                              : 'bg-blue-50/60 dark:bg-blue-950/40 text-slate-900 dark:text-slate-100 font-medium'
                          }`}
                        >
                          <div className="font-semibold">{n.title}</div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                            {n.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Quick Dev Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>

                  {/* Dev Fast Switcher */}
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-1.5">
                      Fast Dev Role Switch
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <button
                        onClick={async () => {
                          await devLogin('student@pccoe.org', 'STUDENT');
                          setShowUserMenu(false);
                        }}
                        className="p-1 rounded text-left hover:bg-slate-100 dark:hover:bg-slate-700 truncate"
                      >
                        🎓 Student
                      </button>
                      <button
                        onClick={async () => {
                          await devLogin('assistant@pccoe.org', 'LAB_ASSISTANT');
                          setShowUserMenu(false);
                        }}
                        className="p-1 rounded text-left hover:bg-slate-100 dark:hover:bg-slate-700 truncate"
                      >
                        🛠️ Assistant
                      </button>
                      <button
                        onClick={async () => {
                          await devLogin('authority@pccoe.org', 'DEPT_AUTHORITY');
                          setShowUserMenu(false);
                        }}
                        className="p-1 rounded text-left hover:bg-slate-100 dark:hover:bg-slate-700 truncate"
                      >
                        🏛️ Authority
                      </button>
                      <button
                        onClick={async () => {
                          await devLogin('admin@pccoe.org', 'ADMIN');
                          setShowUserMenu(false);
                        }}
                        className="p-1 rounded text-left hover:bg-slate-100 dark:hover:bg-slate-700 truncate"
                      >
                        👑 Admin
                      </button>
                    </div>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={() => logout()}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
