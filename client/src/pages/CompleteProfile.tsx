import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Sun,
  Moon,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { FixifyLogo } from '../components/layout/FixifyLogo';
import { ProfileForm } from '../components/profile/ProfileForm';
import { getFriendlyAuthErrorMessage } from '../lib/firebase';

export const CompleteProfile: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, registerProfile, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Preserves deep link like /report?lab=<code>
  const redirectTarget = searchParams.get('redirect') || '/report';

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleCompleteSubmit = async (payload: any) => {
    try {
      setIsLoading(true);
      setServerError(null);
      const result = await registerProfile(payload);
      await refreshUser();

      if (result.isPendingApproval) {
        navigate(
          `/pending-approval?redirect=${encodeURIComponent(redirectTarget)}`,
          { replace: true }
        );
      } else {
        navigate(redirectTarget, { replace: true });
      }
    } catch (err: unknown) {
      setServerError(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative selection:bg-primary/20">
      <div className="w-full max-w-5xl flex items-center justify-between pb-4 sm:pb-6">
        <div className="lg:hidden flex items-center">
          <FixifyLogo size={32} />
        </div>
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

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-3xl bg-primary/5 border border-primary/15 relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <FixifyLogo size={42} />

            <div className="space-y-2 pt-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
                Complete Institutional Profile
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your institutional record to link lab assignments and maintenance reporting privileges.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Verified Identity</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Secure institutional binding with PCCoE academic rolls.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Workstation Routing</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Assigned laboratory access configured instantly after completion.
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

        <div className="lg:col-span-7 w-full max-w-lg lg:max-w-none mx-auto bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6 relative">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Complete Your Profile
            </h1>
            <p className="text-xs text-muted-foreground">
              Link your institutional details to finalize campus IT access
            </p>
          </div>

          {serverError && (
            <div
              className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs flex items-start gap-2"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Reusable Institutional Profile Form */}
          <ProfileForm
            mode="complete"
            user={user || ({} as any)}
            redirectTarget={redirectTarget}
            onCompleteSubmit={handleCompleteSubmit}
            isLoadingExternal={isLoading}
          />

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
    </div>
  );
};

export default CompleteProfile;
