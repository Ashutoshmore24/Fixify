import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  QrCode,
  Activity,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { FixifyLogo } from '../components/layout/FixifyLogo';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { getFriendlyAuthErrorMessage } from '../lib/firebase';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithEmailPassword, loginWithGoogle, devLogin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative selection:bg-primary/20">
      {/* Top action bar: theme toggle */}
      <div className="w-full max-w-5xl flex items-center justify-between pb-4 sm:pb-6">
        <Link to="/" className="lg:hidden flex items-center">
          <FixifyLogo size={32} />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            aria-label="Toggle theme"
            data-testid="theme-toggle"
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-700" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main split grid layout */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* DESKTOP BRAND PANEL (Left column, >= 1024px) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-3xl bg-primary/5 border border-primary/15 relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <FixifyLogo size={42} />

            <div className="space-y-2 pt-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
                Laboratory IT Asset & Maintenance Platform
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Streamlining computer repair workflows across PCCOE engineering laboratories with zero paperwork.
              </p>
            </div>

            {/* 3 Benefit lines */}
            <div className="space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Instant QR Defect Reporting</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Scan any workstation QR code to auto-assign defect tickets directly to lab assistants.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Real-time Lifecycle Tracking</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Track repair milestones with sequential FIX ticket IDs, SLA countdowns, and closure logs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Secure Institutional Access</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Restricted exclusively to authorized campus accounts with role-based dashboard views.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional footer in brand panel */}
          <div className="pt-6 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>PCCoE Campus System</span>
            <span className="font-semibold text-primary">v1.0 Institutional</span>
          </div>
        </div>

        {/* FORM CARD (Right column on desktop, single card on mobile) */}
        <div className="lg:col-span-7 w-full max-w-md lg:max-w-none mx-auto bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6 relative">
          {/* Header */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sign In to Fixify
            </h1>
            <p className="text-xs text-muted-foreground">
              Institutional IT Asset & Maintenance Management
            </p>
            {redirectTarget !== '/report' && (
              <div className="inline-block mt-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-xs font-medium">
                Redirecting to: {redirectTarget}
              </div>
            )}
          </div>

          {/* Error alert */}
          {errorMessage && (
            <div
              className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs space-y-1"
              role="alert"
            >
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{errorMessage}</p>
                  {unverifiedEmail && (
                    <Link
                      to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}&redirect=${encodeURIComponent(redirectTarget)}`}
                      className="inline-block text-primary underline font-medium hover:underline"
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
                className="text-xs font-semibold text-foreground block"
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
                leftIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold text-foreground block"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs text-primary hover:underline transition font-medium"
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
                leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
                rightIcon={
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-1 text-muted-foreground hover:text-foreground transition focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2.5 rounded-xl shadow-md transition"
              isLoading={isLoading}
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-card px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground shrink-0">
              or continue with
            </span>
            <div className="border-t border-border w-full" />
          </div>

          {/* Continue with Google button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            isLoading={isGoogleLoading}
            className="w-full font-semibold py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2.5 border-border"
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
          <div className="text-center text-xs text-muted-foreground">
            New to Fixify?{' '}
            <Link
              to={`/signup?redirect=${encodeURIComponent(redirectTarget)}`}
              className="text-primary hover:underline font-semibold"
            >
              Create an account
            </Link>
          </div>

          {/* Collapsed Developer Access section in development only */}
          {import.meta.env.DEV && (
            <div className="pt-3 border-t border-border space-y-3">
              <button
                type="button"
                onClick={() => setDevAccessOpen((prev) => !prev)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-muted/50 hover:bg-muted/80 border border-border text-left transition group"
                aria-expanded={devAccessOpen}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition">
                    Developer Access
                  </span>
                  <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                    DEV MODE
                  </span>
                </div>
                <div className="text-muted-foreground group-hover:text-foreground">
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
                      className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-card hover:bg-muted/60 border border-border hover:border-primary/40 transition flex items-center justify-between group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="text-lg sm:text-xl">{account.icon}</span>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition">
                            {account.name}
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-muted-foreground">
                            {account.description}
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border shrink-0">
                        {account.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SRS 6.2 Institutional Privacy Notice */}
          <div className="pt-3 border-t border-border">
            <div className="bg-muted/40 rounded-xl p-3 border border-border text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <span>🔒</span> Institutional Privacy Notice (SRS 6.2)
              </div>
              <p className="leading-relaxed">
                Passwords are handled securely by Firebase Authentication and never stored by Fixify; we keep only name, institutional email, PRN/course details and role; no third-party tracking.
              </p>
            </div>
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
