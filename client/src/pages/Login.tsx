import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { devLogin } = useAuth();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preserve deep link
  const redirectTarget = searchParams.get('redirect') || '/report';

  const seededAccounts = [
    {
      name: 'Rahul Deshmukh',
      email: 'student@pccoe.org',
      role: 'STUDENT' as UserRole,
      badge: 'Student',
      description: 'Report computer defects in assigned lab',
      icon: '🎓',
    },
    {
      name: 'Lab Assistant Sharma',
      email: 'assistant@pccoe.org',
      role: 'LAB_ASSISTANT' as UserRole,
      badge: 'Lab Assistant',
      description: 'Accept, service & close Lab 101 tickets',
      icon: '🛠️',
    },
    {
      name: 'Dept Authority Patil',
      email: 'authority@pccoe.org',
      role: 'DEPT_AUTHORITY' as UserRole,
      badge: 'Dept Authority',
      description: 'Component approvals & escalations',
      icon: '🏛️',
    },
    {
      name: 'HOD Computer Engg',
      email: 'hod@pccoe.org',
      role: 'HOD' as UserRole,
      badge: 'HOD',
      description: 'Departmental analytics & overview',
      icon: '👨‍🏫',
    },
    {
      name: 'System Administrator',
      email: 'admin@pccoe.org',
      role: 'ADMIN' as UserRole,
      badge: 'Admin',
      description: 'Full campus system control',
      icon: '👑',
    },
  ];

  const handleImpersonate = async (email: string, role: UserRole) => {
    try {
      setLoadingEmail(email);
      setErrorMessage(null);
      await devLogin(email, role);
      navigate(redirectTarget, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMessage(error.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-blue-500/30">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Fixify</h1>
          <p className="text-sm text-slate-400">
            Institutional IT Asset & Maintenance Management
          </p>
          {redirectTarget !== '/report' && (
            <div className="inline-block px-3 py-1 bg-blue-950/60 border border-blue-800 text-blue-300 rounded-full text-xs font-medium">
              Redirecting to: {redirectTarget}
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs">
            {errorMessage}
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="space-y-3">
          <button
            onClick={() => handleImpersonate('student@pccoe.org', 'STUDENT')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Sign in with Institutional Google SSO
          </button>
        </div>

        {/* Development Impersonation Switcher */}
        <div className="pt-4 border-t border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Developer Impersonation
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
              DEV MODE
            </span>
          </div>

          <div className="space-y-2">
            {seededAccounts.map((account) => (
              <button
                key={account.email}
                disabled={loadingEmail !== null}
                onClick={() => handleImpersonate(account.email, account.role)}
                className="w-full text-left p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 transition flex items-center justify-between group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{account.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition">
                      {account.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{account.description}</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {account.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* SRS 6.2 Institutional Privacy Notice */}
        <div className="pt-3 border-t border-slate-700/80">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>🔒</span> Institutional Privacy Notice (SRS 6.2)
            </div>
            <p className="leading-relaxed">
              Fixify exclusively admits verified institutional accounts ending with{' '}
              <span className="text-blue-400 font-mono">@pccoe.org</span>. We access only your
              name, institutional email address, and avatar strictly for defect attribution and
              laboratory access. No personal passwords or third-party tracking cookies are used.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
