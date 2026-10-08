import React, { useState } from 'react';
import { KeyRound, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
import { auth, updatePassword, sendPasswordResetEmail } from '../../lib/firebase';
import { User } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface ChangePasswordCardProps {
  user: User;
}

export const ChangePasswordCard: React.FC<ChangePasswordCardProps> = ({ user }) => {
  const { toast } = useToast();

  const currentUser = auth.currentUser;
  const isGoogleUser = currentUser?.providerData.some((p) => p.providerId === 'google.com');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!currentUser) {
      setError('No active authenticated session found.');
      return;
    }

    try {
      setIsLoading(true);
      await updatePassword(currentUser, newPassword);
      toast.success('Your password has been changed successfully.', 'Password Updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/requires-recent-login') {
        setError(
          'For security, changing your password requires recent authentication. Please sign out and sign back in, then retry.'
        );
      } else {
        setError(fbErr.message || 'Failed to update password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user.email) return;
    try {
      setIsSendingReset(true);
      await sendPasswordResetEmail(auth, user.email);
      toast.success(
        `A secure password reset link was sent to ${user.email}.`,
        'Reset Email Dispatched'
      );
    } catch {
      toast.error('Failed to send password reset email.', 'Error');
    } finally {
      setIsSendingReset(false);
    }
  };

  if (isGoogleUser) {
    return (
      <div className="p-6 rounded-3xl bg-card border border-border shadow-soft space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Institutional Single Sign-On</h3>
            <p className="text-xs text-muted-foreground">Managed via Google Workspace</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
          Your account is authenticated using official college Google Single Sign-On ({user.email}). Passwords and multi-factor authentication are managed through your Google Account settings.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-card border border-border shadow-soft space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Change Password</h3>
            <p className="text-xs text-muted-foreground">Update your institutional password</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSendResetEmail}
          isLoading={isSendingReset}
          className="text-xs flex items-center gap-1.5"
          title="Send password reset link to your email"
        >
          <Mail className="w-3.5 h-3.5 text-primary" />
          <span>Email Reset Link</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleChangePassword} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              New Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError(null);
              }}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Confirm New Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError(null);
              }}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          size="sm"
          className="font-semibold"
          isLoading={isLoading}
        >
          Update Password
        </Button>
      </form>
    </div>
  );
};
