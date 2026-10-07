import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { getFriendlyAuthErrorMessage } from '../lib/firebase';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithEmailPassword, loginWithGoogle, devLogin } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Forgot password modal state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Developer access accordion: starts collapsed in dev, but defaults open under Playwright test runners
  const isAutomatedTest =
    typeof navigator !== 'undefined' && Boolean(navigator.webdriver);
  const [devAccessOpen, setDevAccessOpen] = useState(isAutomatedTest);
  const [loadingDevEmail, setLoadingDevEmail] = useState<string | null>(null);

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

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both your institutional email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setUnverifiedEmail(null);

      const result = await loginWithEmailPassword(email.trim(), password);

      if (result.requiresProfileCompletion) {
        navigate(`/complete-profile?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
      } else if (result.isPendingApproval) {
        navigate(`/pending-approval?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
      } else {
        navigate(redirectTarget, { replace: true });
      }
    } catch (err: unknown) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err);
      setErrorMessage(friendlyMsg);

      const errorObj = err as { code?: string };
      if (
        errorObj?.code === 'auth/unverified-email' ||
        friendlyMsg.toLowerCase().includes('verify')
      ) {
        setUnverifiedEmail(email.trim());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage(null);
      setUnverifiedEmail(null);

      const result = await loginWithGoogle();

      if (result.requiresProfileCompletion) {
        navigate(`/complete-profile?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
      } else if (result.isPendingApproval) {
        navigate(`/pending-approval?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
      } else {
        navigate(redirectTarget, { replace: true });
      }
    } catch (err: unknown) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err);
      setErrorMessage(friendlyMsg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleImpersonate = async (targetEmail: string, role: UserRole) => {
    try {
      setLoadingDevEmail(targetEmail);
      setErrorMessage(null);
      await devLogin(targetEmail, role);
      navigate(redirectTarget, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMessage(error.response?.data?.error?.message || 'Dev impersonation failed');
    } finally {
      setLoadingDevEmail(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-blue-500/30">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Fixify</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Institutional IT Asset & Maintenance Management
          </p>
          {redirectTarget !== '/report' && (
            <div className="inline-block px-3 py-1 bg-blue-950/60 border border-blue-800 text-blue-300 rounded-full text-xs font-medium">
              Redirecting to: {redirectTarget}
            </div>
          )}
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div
            className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs space-y-1"
            role="alert"
          >
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="space-y-1">
                <p>{errorMessage}</p>
                {unverifiedEmail && (
                  <Link
                    to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}&redirect=${encodeURIComponent(redirectTarget)}`}
                    className="inline-block text-blue-400 underline font-medium hover:text-blue-300"
                  >
                    Go to email verification page →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Email + Password Sign In Form */}
        <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="text-xs font-semibold text-slate-300 block"
            >
              Institutional Email
            </label>
            <Input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name.dept@pccoe.org"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="text-xs font-semibold text-slate-300 block"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(true)}
                className="text-xs text-blue-400 hover:text-blue-300 transition underline-offset-2 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              rightIcon={
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition"
            isLoading={isLoading}
          >
            Sign in
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-700/80 w-full" />
          <span className="bg-slate-800 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 shrink-0">
            or continue with
          </span>
          <div className="border-t border-slate-700/80 w-full" />
        </div>

        {/* Continue with Google button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
          isLoading={isGoogleLoading}
          className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-2.5 rounded-xl border-transparent shadow-md transition flex items-center justify-center gap-2.5"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
          Continue with Google
        </Button>

        {/* Link to Sign up */}
        <div className="text-center text-xs text-slate-400">
          New to Fixify?{' '}
          <Link
            to={`/signup?redirect=${encodeURIComponent(redirectTarget)}`}
            className="text-blue-400 hover:text-blue-300 font-semibold underline-offset-2 hover:underline"
          >
            Create an account
          </Link>
        </div>

        {/* Collapsed Developer Access section in development only */}
        {import.meta.env.DEV && (
          <div className="pt-3 border-t border-slate-700/80 space-y-3">
            <button
              type="button"
              onClick={() => setDevAccessOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-700/60 text-left transition group"
              aria-expanded={devAccessOpen}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 group-hover:text-blue-400 transition">
                  Developer Access
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  DEV MODE
                </span>
              </div>
              <div className="text-slate-400 group-hover:text-slate-200">
                {devAccessOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {devAccessOpen && (
              <div className="space-y-2 pt-1 animate-in fade-in-0 duration-150">
                {seededAccounts.map((account) => (
                  <button
                    key={account.email}
                    disabled={loadingDevEmail !== null}
                    onClick={() => handleImpersonate(account.email, account.role)}
                    className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 transition flex items-center justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="text-lg sm:text-xl">{account.icon}</span>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-blue-400 transition">
                          {account.name}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400">
                          {account.description}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                      {account.badge}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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

      {/* Forgot Password Dialog */}
      <ForgotPasswordModal
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
        initialEmail={email}
      />
    </div>
  );
};

export default Login;
