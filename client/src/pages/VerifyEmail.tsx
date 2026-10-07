import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { auth, sendEmailVerification, getFriendlyAuthErrorMessage } from '../lib/firebase';
import { api } from '../lib/axios';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const emailParam = searchParams.get('email') || auth.currentUser?.email || '';
  const redirectTarget = searchParams.get('redirect') || '/report';

  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setIsResending(true);
      setError(null);
      setNotification(null);

      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setNotification('A fresh verification link has been sent to your institutional email.');
        setCooldown(60);
      } else {
        setError('No active session found. Please sign in to request a verification email.');
      }
    } catch (err) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerified = async () => {
    try {
      setIsChecking(true);
      setError(null);

      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          // Exchange verified ID token for session cookie
          const idToken = await auth.currentUser.getIdToken(true);
          const res = await api.post('/auth/session', { idToken });
          const user = res.data.data.user;

          // Check if pending profile exists to complete registration
          const storedPending = sessionStorage.getItem('fixify_pending_profile');
          if (storedPending && !user.profileComplete) {
            try {
              const parsed = JSON.parse(storedPending);
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

      setError('Email is not verified yet. Please check your inbox and click the verification link.');
    } catch (err) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10 text-center">
        {/* Verification Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Verify Your Email
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            We've sent a verification link to your institutional address:
          </p>
          {emailParam && (
            <p className="font-mono text-sm font-semibold text-blue-400 bg-slate-900/80 border border-slate-700 py-1.5 px-3 rounded-xl inline-block max-w-full truncate">
              {emailParam}
            </p>
          )}
        </div>

        {notification && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2 text-left">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleCheckVerified}
            isLoading={isChecking}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition"
          >
            I've Verified My Email
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            isLoading={isResending}
            className="w-full bg-slate-700/50 hover:bg-slate-700 border-slate-600 text-slate-200 py-2.5 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Link'}
          </Button>
        </div>

        <div className="pt-3 border-t border-slate-700/80">
          <Link
            to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
