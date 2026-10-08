import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/axios';
import { User } from '../types';
import { ProfileBannerAvatar } from '../components/profile/ProfileBannerAvatar';
import { ProfileForm } from '../components/profile/ProfileForm';
import { ChangePasswordCard } from '../components/profile/ChangePasswordCard';
import { DeactivationRequestModal } from '../components/profile/DeactivationRequestModal';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import {
  Wrench,
  AlertCircle,
  Building,
  GraduationCap,
  Briefcase,
  ShieldAlert,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user: authUser, refreshUser } = useAuth();

  const [profileData, setProfileData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assistant open tickets count
  const [openTicketsCount, setOpenTicketsCount] = useState<number | null>(null);

  // Deactivation dialog state
  const [isDeactivationOpen, setIsDeactivationOpen] = useState(false);
  const [hasPendingDeactivation, setHasPendingDeactivation] = useState(false);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get('/profile/me');
      if (res.data?.success) {
        setProfileData(res.data.data);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message || 'Failed to load profile data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // For LAB_ASSISTANT, load active tickets count
  useEffect(() => {
    if (authUser?.role === 'LAB_ASSISTANT') {
      api
        .get('/tickets?isActive=true')
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setOpenTicketsCount(res.data.data.length);
          }
        })
        .catch(() => {});
    }
  }, [authUser]);

  const currentUser = profileData || authUser;

  const handleUserUpdated = (updatedFields: Partial<User>) => {
    if (profileData) {
      setProfileData({ ...profileData, ...updatedFields });
    }
    refreshUser();
  };

  if (isLoading && !currentUser) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in-0 duration-200">
        <div className="h-56 rounded-3xl bg-muted/60 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-4">
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error && !currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl border border-destructive/20 bg-card text-center space-y-4 shadow-soft">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Failed to Load Profile</h2>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
        <Button size="sm" onClick={fetchProfile}>
          Retry Loading
        </Button>
      </div>
    );
  }

  if (!currentUser) return null;

  const roleLabelMap: Record<string, { label: string; icon: React.ReactNode }> = {
    STUDENT: { label: 'Student', icon: <GraduationCap className="w-4 h-4" /> },
    FACULTY: { label: 'Faculty Member', icon: <Briefcase className="w-4 h-4" /> },
    LAB_ASSISTANT: { label: 'Laboratory Assistant', icon: <Wrench className="w-4 h-4" /> },
    DEPT_AUTHORITY: { label: 'Department Authority', icon: <ShieldAlert className="w-4 h-4" /> },
    HOD: { label: 'Head of Department', icon: <BarChart3 className="w-4 h-4" /> },
    ADMIN: { label: 'System Administrator', icon: <ShieldCheck className="w-4 h-4" /> },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 selection:bg-primary/20">
      {/* Deactivation Modal */}
      <DeactivationRequestModal
        isOpen={isDeactivationOpen}
        onClose={() => setIsDeactivationOpen(false)}
        onRequestSubmitted={() => setHasPendingDeactivation(true)}
      />

      {/* ============================================================ */}
      {/* 1. HERO BANNER & OVERLAPPING AVATAR */}
      {/* ============================================================ */}
      <ProfileBannerAvatar user={currentUser} onUserUpdated={handleUserUpdated} />

      {/* ============================================================ */}
      {/* 2. ROLE HIGHLIGHT & METRICS SUMMARY */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Role Overview */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-soft flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {roleLabelMap[currentUser.role]?.icon || <GraduationCap className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block tracking-wider">
              Assigned Role
            </span>
            <span className="text-sm font-bold text-foreground truncate block">
              {roleLabelMap[currentUser.role]?.label || currentUser.role}
            </span>
          </div>
        </div>

        {/* Approval / Verification Status */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-soft flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block tracking-wider">
              Institutional Status
            </span>
            <span className="text-sm font-bold text-foreground truncate block">
              {currentUser.approvalStatus === 'APPROVED' ? 'Verified & Active' : currentUser.approvalStatus}
            </span>
          </div>
        </div>

        {/* Lab Assistant Specific Metric: Open tickets */}
        {currentUser.role === 'LAB_ASSISTANT' && (
          <div className="p-4 rounded-2xl bg-card border border-border shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block tracking-wider">
                Open Work Orders
              </span>
              <span className="text-sm font-bold text-foreground truncate block">
                {openTicketsCount !== null ? `${openTicketsCount} Active` : 'Checking...'}
              </span>
            </div>
          </div>
        )}

        {/* Lab Assistant Specific Metric: Assigned Labs */}
        {currentUser.role === 'LAB_ASSISTANT' && (
          <div className="p-4 rounded-2xl bg-card border border-border shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block tracking-wider">
                Managed Labs
              </span>
              <span className="text-sm font-bold text-foreground truncate block">
                {currentUser.assignedLabs?.length || 0} Laboratories
              </span>
            </div>
          </div>
        )}

        {/* Student Specific PRN summary */}
        {currentUser.role === 'STUDENT' && (
          <div className="p-4 rounded-2xl bg-card border border-border shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block tracking-wider">
                Academic Roll PRN
              </span>
              <span className="text-sm font-bold text-foreground font-mono truncate block">
                {currentUser.prn || 'Unregistered'}
              </span>
            </div>
          </div>
        )}

        {/* Department summary for Faculty / Authorities */}
        {(currentUser.role === 'FACULTY' ||
          currentUser.role === 'DEPT_AUTHORITY' ||
          currentUser.role === 'HOD') && (
          <div className="p-4 rounded-2xl bg-card border border-border shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block tracking-wider">
                Department
              </span>
              <span className="text-sm font-bold text-foreground truncate block">
                {typeof currentUser.department === 'object' && currentUser.department
                  ? currentUser.department.code
                  : 'Institutional'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pending Deactivation Banner */}
      {hasPendingDeactivation && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              <strong>Deactivation Request Pending:</strong> An account deactivation request for your profile has been logged and is awaiting administrator approval.
            </span>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MAIN PROFILE EDIT SECTION & SIDEBAR CARDS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Role-Aware Edit Form */}
        <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6">
          <div className="space-y-1 pb-4 border-b border-border/70">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Institutional Profile Details
            </h2>
            <p className="text-xs text-muted-foreground">
              Update your personal details. Restricted academic rolls require administrator authorization.
            </p>
          </div>

          <ProfileForm
            mode="edit"
            user={currentUser}
            onSuccess={(updated) => handleUserUpdated(updated)}
          />
        </div>

        {/* Right Column: Security & Deactivation */}
        <div className="lg:col-span-4 space-y-6">
          {/* Change Password Card (email/password only) */}
          <ChangePasswordCard user={currentUser} />

          {/* Account Deactivation Card */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-soft space-y-3">
            <h3 className="text-sm font-bold text-destructive">Account Management</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Need to archive or close your Fixify profile upon graduation or role change?
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeactivationOpen(true)}
              className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              Request Account Deactivation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
