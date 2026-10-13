import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
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
  const { loginWithEmailPassword, loginWithGoogle } = useAuth();
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

  // Raw requested redirect from URL query parameters (if any)
  const requestedRedirect = searchParams.get('redirect');

  // Helper: Safely resolves post-login destination URL
  // - LAB_ASSISTANT, DEPT_AUTHORITY, HOD -> /assistant
  // - ADMIN -> /admin
  // - STUDENT, FACULTY -> /report
  // - Preserves explicit internal deep links (e.g. /report?lab=LAB-5401, /my-complaints, /profile)
  // - Guards against open-redirect vulnerabilities
  const resolvePostLoginRedirect = (role?: UserRole, redirectParam?: string | null): string => {
    const isSafeInternalPath =
      typeof redirectParam === 'string' &&
      redirectParam.startsWith('/') &&
      !redirectParam.startsWith('//') &&
      !redirectParam.includes('\\') &&
      !redirectParam.split('?')[0].includes(':');

    // If an explicit destination was supplied that is NOT the generic default '/report'
    if (isSafeInternalPath && redirectParam !== '/report') {
      return redirectParam;
    }

    // Role-specific default destinations
    switch (role) {
      case 'LAB_ASSISTANT':
      case 'DEPT_AUTHORITY':
      case 'HOD':
        return '/assistant';
      case 'ADMIN':
        return '/admin';
      case 'STUDENT':
      case 'FACULTY':
      default:
        return '/report';
    }
  };

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
      const destination = resolvePostLoginRedirect(result.user?.role, searchParams.get('redirect'));

      if (result.requiresProfileCompletion) {
        navigate(`/complete-profile?redirect=${encodeURIComponent(destination)}`, { replace: true });
      } else if (result.isPendingApproval) {
        navigate(`/pending-approval?redirect=${encodeURIComponent(destination)}`, { replace: true });
      } else {
        navigate(destination, { replace: true });
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
      const destination = resolvePostLoginRedirect(result.user?.role, searchParams.get('redirect'));

      if (result.requiresProfileCompletion) {
        navigate(`/complete-profile?redirect=${encodeURIComponent(destination)}`, { replace: true });
      } else if (result.isPendingApproval) {
        navigate(`/pending-approval?redirect=${encodeURIComponent(destination)}`, { replace: true });
      } else {
        navigate(destination, { replace: true });
      }
    } catch (err: unknown) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err);
      setErrorMessage(friendlyMsg);
    } finally {
      setIsGoogleLoading(false);
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
            {requestedRedirect && requestedRedirect !== '/report' && (
              <div className="inline-block mt-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-xs font-medium">
                Redirecting to: {requestedRedirect}
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
                      to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}${requestedRedirect ? `&redirect=${encodeURIComponent(requestedRedirect)}` : ''}`}
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
                placeholder="your email address"
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
              to={`/signup${requestedRedirect ? `?redirect=${encodeURIComponent(requestedRedirect)}` : ''}`}
              className="text-primary hover:underline font-semibold"
            >
              Create an account
            </Link>
          </div>



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
