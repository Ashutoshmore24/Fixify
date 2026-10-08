import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/axios';
import { useToast } from '../ui/Toast';

interface DeactivationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted?: () => void;
}

export const DeactivationRequestModal: React.FC<DeactivationRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestSubmitted,
}) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide a reason with at least 5 characters.');
      return;
    }

    if (!confirmed) {
      setError('Please acknowledge the confirmation checkbox before proceeding.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post(
        '/profile/me/deactivation-request',
        { reason: reason.trim() },
        { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
      );

      if (res.data?.success) {
        toast.success(
          'Your account deactivation request has been submitted for administrator review.',
          'Request Submitted'
        );
        setReason('');
        setConfirmed(false);
        onClose();
        if (onRequestSubmitted) {
          onRequestSubmitted();
        }
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } } };
      const message =
        errorObj.response?.data?.error?.message ||
        'Failed to submit deactivation request. Please try again.';
      setError(message);
      toast.error(message, 'Submission Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="w-10 h-10 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-1">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <DialogTitle className="text-destructive">Request Account Deactivation</DialogTitle>
          <DialogDescription>
            Submit an official request to deactivate your institutional Fixify access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Institutional Advisory Notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Administrative Approval Required</span>
            </div>
            <p className="leading-relaxed">
              In accordance with campus IT policy, accounts cannot be self-deleted. Once submitted, your request will be reviewed and processed by campus administrators.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Reason for Deactivation <span className="text-destructive">*</span>
            </label>
            <Textarea
              rows={3}
              placeholder="e.g. Graduation, course transfer, or leaving the institution..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              required
            />
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 text-xs text-muted-foreground select-none cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary accent-primary"
            />
            <span>
              I understand that this request is pending admin approval and my previous tickets and institutional audit history will remain archived.
            </span>
          </label>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              isLoading={isLoading}
              disabled={!confirmed || !reason.trim()}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
