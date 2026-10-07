import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const PendingApproval: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();

  const redirectTarget = searchParams.get('redirect') || '/report';

  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    try {
      setIsChecking(true);
      setStatusMessage(null);
      await refreshUser();

      if (user && user.approvalStatus === 'APPROVED') {
        setStatusMessage('Your faculty account has been approved! Redirecting...');
        setTimeout(() => {
          navigate(redirectTarget, { replace: true });
        }, 1200);
      } else {
        setStatusMessage('Your account is still pending administrator review.');
      }
    } catch {
      setStatusMessage('Unable to check status right now. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10 text-center">
        {/* Pending Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Approval Pending
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Thank you, <span className="font-semibold text-white">{user?.name || user?.email}</span>.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your faculty registration has been received and is awaiting administrator verification. Once an administrator approves your account, you will have full access to Fixify.
          </p>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 text-left ${
              statusMessage.includes('approved')
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                : 'bg-slate-900/80 border border-slate-700 text-slate-300'
            }`}
          >
            {statusMessage.includes('approved') ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <Clock className="w-4 h-4 shrink-0 text-amber-400" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleCheckStatus}
            isLoading={isChecking}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Check Approval Status
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={logout}
            className="w-full bg-slate-700/50 hover:bg-slate-700 border-slate-600 text-slate-200 py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
