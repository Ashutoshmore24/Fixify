import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft, Sun, Moon, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { FixifyLogo } from '../components/layout/FixifyLogo';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, FirebaseUser, getFriendlyAuthErrorMessage } from '../lib/firebase';
import { getVerificationDelivery, getVerificationErrorMessage, requestVerificationEmail, safeVerificationRedirect } from '../lib/email-verification';
import { RegisterProfileData } from '../context/AuthContext';
import { api } from '../lib/axios';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);
  const emailParam = searchParams.get('email') || firebaseUser?.email || '';
  const redirectTarget = safeVerificationRedirect(searchParams.get('redirect'));
  const accountMatches = !!firebaseUser && firebaseUser.email?.toLowerCase() === emailParam.toLowerCase();
  const signInUrl = `/login?redirect=${encodeURIComponent(`/verify-email?email=${encodeURIComponent(emailParam)}&redirect=${encodeURIComponent(redirectTarget)}`)}`;

  const [delivery, setDelivery] = useState(() => getVerificationDelivery(emailParam));
  const [now, setNow] = useState(Date.now());
  const cooldown = Math.max(0, Math.ceil((delivery.nextAllowedAt - now) / 1000));
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const checkInProgress = useRef(false);
  const lastAutomaticCheck = useRef(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(() => getVerificationDelivery(emailParam).error);

  useEffect(() => onAuthStateChanged(auth, currentUser => {
    setFirebaseUser(currentUser);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    const sync = () => {
      const saved = getVerificationDelivery(emailParam);
      setDelivery(saved);
      setError(saved.error);
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [emailParam]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending || !accountMatches) return;
    try {
      setIsResending(true);
      setError(null);
      setNotification(null);

      if (!firebaseUser) return;
      await firebaseUser.reload();
      if (firebaseUser.emailVerified) {
        setNotification('Your email is already verified. Click “I\'ve Verified My Email” to continue.');
        return;
      }
      await requestVerificationEmail(firebaseUser, redirectTarget);
      setNotification('A verification link has been sent. Check your inbox and spam folder.');
    } catch (err) {
      setError(getVerificationErrorMessage(err));
    } finally {
      setIsResending(false);
      setDelivery(getVerificationDelivery(emailParam));
      setNow(Date.now());
    }
  };

  const handleCheckVerified = useCallback(async (manual = true) => {
    if (!accountMatches || checkInProgress.current) return;
    if (!manual && Date.now() - lastAutomaticCheck.current < 5000) return;
    lastAutomaticCheck.current = Date.now();
    checkInProgress.current = true;
    try {
      setIsChecking(true);
      if (manual) { setError(null); setNotification(null); }

      if (firebaseUser) {
        await firebaseUser.reload();
        if (firebaseUser.emailVerified) {
          setError(null);
          setNotification('Email verified. Completing sign-in...');
          // Exchange verified ID token for session cookie
          const idToken = await firebaseUser.getIdToken(true);
          const res = await api.post('/auth/session', { idToken });
          const user = res.data.data.user;

          // Check if pending profile exists to complete registration
          const storedPending = sessionStorage.getItem('fixify_pending_profile');
          if (storedPending && !user.profileComplete) {
            try {
              const parsed = JSON.parse(storedPending) as RegisterProfileData & { email?: string };
              if (parsed.email?.toLowerCase() !== firebaseUser.email?.toLowerCase()) throw new Error('Pending profile belongs to a different account');
              const profileRes = await api.post('/auth/register-profile', parsed);
              sessionStorage.removeItem('fixify_pending_profile');
              const updatedUser = profileRes.data.data.user;
              await refreshUser();
              if (updatedUser.approvalStatus === 'PENDING_APPROVAL') {
                navigate(`/pending-approval?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
                return;
              }
              navigate(redirectTarget, { replace: true });
              return;
            } catch {
              // Redirect to complete-profile if automated save fails
            }
          }

          await refreshUser();
          if (!user.profileComplete) {
            navigate(`/complete-profile?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
          } else if (user.approvalStatus === 'PENDING_APPROVAL') {
            navigate(`/pending-approval?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
          } else {
            navigate(redirectTarget, { replace: true });
          }
          return;
        }
      }

      if (manual) setError('Open the verification link inside the email first. This button checks whether that link has verified your address. If Gmail placed the email in Spam, choose “Not spam” and open its verification link.');
    } catch (err) {
      if (manual || firebaseUser?.emailVerified) {
        setNotification(null);
        setError(getFriendlyAuthErrorMessage(err));
      }
    } finally {
      setIsChecking(false);
      checkInProgress.current = false;
    }
  }, [accountMatches, firebaseUser, navigate, redirectTarget, refreshUser]);

  useEffect(() => {
    if (!authReady || !accountMatches) return;
    const check = () => { if (document.visibilityState === 'visible') void handleCheckVerified(false); };
    check();
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [authReady, accountMatches, handleCheckVerified]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative selection:bg-primary/20">
      {/* Top action bar */}
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
        {/* DESKTOP BRAND PANEL */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-3xl bg-primary/5 border border-primary/15 relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <FixifyLogo size={42} />

            <div className="space-y-2 pt-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
                Institutional Email Verification
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Confirm your email address before accessing Fixify’s reporting tools.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Anti-Spam Verification</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Ensures all submitted maintenance complaints originate from valid campus members.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Instant Activation</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Click the link in your email and immediately return to file or monitor complaints.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>PCCoE Campus System</span>
            <span className="font-semibold text-primary">v1.0 Institutional</span>
          </div>
        </div>

        {/* VERIFICATION CARD */}
        <div className="lg:col-span-7 w-full max-w-md lg:max-w-none mx-auto bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6 relative text-center">
          {/* Verification Icon */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Verify Your Email
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {delivery.lastSentAt ? 'A verification link was sent to:' : 'Verify your email address to continue:'}
            </p>
            {emailParam && (
              <p className="font-mono text-sm font-semibold text-primary bg-muted/60 border border-border py-1.5 px-3 rounded-xl inline-block max-w-full truncate">
                {emailParam}
              </p>
            )}
          </div>

          {notification && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2 text-left">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {error && (
            <div role="alert" className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {authReady && !accountMatches && (
            <p className="text-xs text-muted-foreground">
              Sign in as {emailParam || 'the account you want to verify'} to request a link or check verification.{' '}
              <Link to={signInUrl} className="text-primary underline">Sign in to this account</Link>
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Open the verification link inside the email. If it is in Gmail Spam, select “Not spam” first. Fixify checks verification automatically when you return to this tab.
          </p>

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => void handleCheckVerified(true)}
              disabled={!authReady || !accountMatches || isResending || isChecking}
              isLoading={isChecking}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2.5 rounded-xl shadow-md transition"
            >
              Check Verification & Continue
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={!authReady || !accountMatches || cooldown > 0 || isResending || isChecking}
              isLoading={isResending}
              className="w-full py-2.5 rounded-xl border-border"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : delivery.lastSentAt ? 'Resend Verification Link' : 'Send Verification Link'}
            </Button>
          </div>

          <div className="pt-3 border-t border-border">
            <Link
              to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline transition font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign in
            </Link>
          </div>

          {/* SRS 6.2 Institutional Privacy Notice */}
          <div className="pt-3 border-t border-border">
            <div className="bg-muted/40 rounded-xl p-3 border border-border text-[11px] text-muted-foreground space-y-1 text-left">
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
    </div>
  );
};

export default VerifyEmail;
