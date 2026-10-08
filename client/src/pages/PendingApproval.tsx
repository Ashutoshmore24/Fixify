import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, RefreshCw, LogOut, CheckCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { FixifyLogo } from '../components/layout/FixifyLogo';

export const PendingApproval: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative selection:bg-primary/20">
      {/* Top action bar */}
      <div className="w-full max-w-md flex items-center justify-between pb-4 sm:pb-6">
        <FixifyLogo size={32} />
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

      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6 relative text-center">
        {/* Pending Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Approval Pending
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Thank you, <span className="font-semibold text-foreground">{user?.name || user?.email}</span>.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your faculty registration has been received and is awaiting administrator verification. Once an administrator approves your account, you will have full access to Fixify.
          </p>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 text-left ${
              statusMessage.includes('approved')
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted/60 border border-border text-foreground'
            }`}
          >
            {statusMessage.includes('approved') ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <Clock className="w-4 h-4 shrink-0 text-amber-500" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleCheckStatus}
            isLoading={isChecking}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2.5 rounded-xl shadow-md transition"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Check Approval Status
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={logout}
            className="w-full border-border py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-destructive" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
