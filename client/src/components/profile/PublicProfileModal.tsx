import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Building, Wrench, Shield, Loader2 } from 'lucide-react';
import { api } from '../../lib/axios';
import { PublicProfileCard, UserRole } from '../../types';

interface PublicProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [profile, setProfile] = useState<PublicProfileCard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !isOpen) {
      setProfile(null);
      setError(null);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);

    api
      .get(`/profile/${userId}/public`)
      .then((res) => {
        if (mounted && res.data?.success) {
          setProfile(res.data.data);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.response?.data?.error?.message || 'Could not load public profile.');
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [userId, isOpen]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const roleBadgeVariant: Record<
    UserRole,
    'status_open' | 'status_assigned' | 'status_accepted' | 'status_in_progress' | 'status_resolved' | 'status_escalated'
  > = {
    STUDENT: 'status_open',
    FACULTY: 'status_accepted',
    LAB_ASSISTANT: 'status_assigned',
    DEPT_AUTHORITY: 'status_in_progress',
    HOD: 'status_resolved',
    ADMIN: 'status_escalated',
  };

  const avatarSrc = profile?.avatar?.url || profile?.picture;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border border-border shadow-soft-lg">
        <DialogTitle className="sr-only">Public Profile</DialogTitle>
        <DialogDescription className="sr-only">Public institutional details</DialogDescription>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading institutional profile...</p>
          </div>
        ) : error || !profile ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Profile Unavailable</h3>
            <p className="text-xs text-muted-foreground">{error || 'Could not find public details.'}</p>
          </div>
        ) : (
          <div>
            {/* Header Banner */}
            <div className="relative h-28 sm:h-32 bg-linear-to-r from-primary/25 via-primary/10 to-indigo-500/20 overflow-hidden">
              {profile.banner?.url ? (
                <img
                  src={profile.banner.url}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-tr from-slate-900 via-primary/20 to-slate-800" />
              )}
            </div>

            {/* Overlapping Avatar & Summary */}
            <div className="px-6 pb-6 pt-0 space-y-4">
              <div className="flex items-end justify-between -mt-12 sm:-mt-14">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-card ring-2 ring-border/80 shadow-soft-lg bg-card">
                  {avatarSrc && <AvatarImage src={avatarSrc} alt={profile.name} />}
                  <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>

                <Badge
                  variant={roleBadgeVariant[profile.role] || 'status_open'}
                  size="sm"
                  className="mb-1"
                >
                  {profile.role.replace('_', ' ')}
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
                {profile.department && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {profile.department.name} ({profile.department.code})
                    </span>
                  </p>
                )}
              </div>

              {/* Lab Assistant Assigned Labs (Only for LAB_ASSISTANT) */}
              {profile.role === 'LAB_ASSISTANT' && profile.assignedLabs && profile.assignedLabs.length > 0 && (
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Wrench className="w-3.5 h-3.5 text-primary" />
                    <span>Assigned Laboratories</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.assignedLabs.map((lab) => (
                      <span
                        key={lab._id}
                        className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-medium text-foreground border border-border/80"
                      >
                        {lab.name} ({lab.code})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
