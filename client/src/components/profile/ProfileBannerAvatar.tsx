import React, { useState, useRef } from 'react';
import { Camera, Trash2, Upload, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { User } from '../../types';
import { api } from '../../lib/axios';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { ImageCropModal } from './ImageCropModal';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';

interface ProfileBannerAvatarProps {
  user: User;
  onUserUpdated: (updatedUser: Partial<User>) => void;
}

export const ProfileBannerAvatar: React.FC<ProfileBannerAvatarProps> = ({
  user,
  onUserUpdated,
}) => {
  const { toast } = useToast();

  const [avatarProgress, setAvatarProgress] = useState<number | null>(null);
  const [bannerProgress, setBannerProgress] = useState<number | null>(null);

  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'banner'>('avatar');
  const [isCropOpen, setIsCropOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if cancelled
    e.target.value = '';

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please choose a valid JPEG, PNG, or WebP image.', 'Invalid File Type');
      return;
    }

    // Validate size
    const maxBytes = type === 'avatar' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(
        `File is too large. Maximum size for ${type} is ${type === 'avatar' ? '2 MB' : '5 MB'}.`,
        'File Size Exceeded'
      );
      return;
    }

    setCropFile(file);
    setCropType(type);
    setIsCropOpen(true);
  };

  const handleCroppedUpload = async (blob: Blob) => {
    const isAvatar = cropType === 'avatar';
    const setProgress = isAvatar ? setAvatarProgress : setBannerProgress;

    try {
      setProgress(10);
      const formData = new FormData();
      const filename = `${cropType}-${Date.now()}.jpg`;
      formData.append(cropType, blob, filename);

      const endpoint = isAvatar ? '/profile/me/avatar' : '/profile/me/banner';

      const res = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Requested-With': 'XMLHttpRequest',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          }
        },
      });

      if (res.data?.success) {
        toast.success(
          `${isAvatar ? 'Profile avatar' : 'Profile banner'} updated successfully!`,
          'Upload Complete'
        );

        if (isAvatar) {
          onUserUpdated({ avatar: res.data.data });
        } else {
          onUserUpdated({ banner: res.data.data });
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(
        error.response?.data?.error?.message || `Failed to upload ${cropType}. Please try again.`,
        'Upload Failed'
      );
    } finally {
      setProgress(null);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user.avatar?.url) return;
    try {
      setAvatarProgress(50);
      const res = await api.delete('/profile/me/avatar', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (res.data?.success) {
        toast.success('Custom avatar removed. Using fallback photo.', 'Avatar Removed');
        onUserUpdated({ avatar: { url: '', publicId: '' } });
      }
    } catch {
      toast.error('Failed to remove avatar.', 'Error');
    } finally {
      setAvatarProgress(null);
    }
  };

  const handleRemoveBanner = async () => {
    if (!user.banner?.url) return;
    try {
      setBannerProgress(50);
      const res = await api.delete('/profile/me/banner', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (res.data?.success) {
        toast.success('Custom banner removed.', 'Banner Removed');
        onUserUpdated({ banner: { url: '', publicId: '' } });
      }
    } catch {
      toast.error('Failed to remove banner.', 'Error');
    } finally {
      setBannerProgress(null);
    }
  };

  // Determine avatar display URL:
  // 1. user.avatar?.url
  // 2. user.picture (Google photo)
  // 3. Fallback initials
  const avatarUrl = user.avatar?.url || user.picture;
  const hasCustomAvatar = Boolean(user.avatar?.url);
  const hasCustomBanner = Boolean(user.banner?.url);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-border/80 bg-card shadow-soft-lg transition-all">
      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'avatar')}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'banner')}
      />

      {/* Crop Modal */}
      <ImageCropModal
        isOpen={isCropOpen}
        onClose={() => setIsCropOpen(false)}
        imageFile={cropFile}
        aspectRatio={cropType === 'avatar' ? 1 : 3}
        targetWidth={cropType === 'avatar' ? 400 : 1500}
        targetHeight={cropType === 'avatar' ? 400 : 500}
        title={cropType === 'avatar' ? 'Adjust Profile Avatar' : 'Adjust Profile Banner'}
        onConfirm={handleCroppedUpload}
      />

      {/* ============================================================ */}
      {/* BANNER CONTAINER */}
      {/* ============================================================ */}
      <div className="relative w-full h-44 sm:h-56 lg:h-64 bg-linear-to-r from-primary/20 via-primary/10 to-indigo-500/20 overflow-hidden group">
        {hasCustomBanner ? (
          <img
            src={user.banner!.url}
            alt="Profile Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          /* Institutional default geometric banner */
          <div className="w-full h-full flex items-center justify-between px-8 bg-linear-to-tr from-slate-900 via-primary/20 to-slate-800 relative">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary/80 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                PCCoE Campus Identity
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white/90">
                {user.name}
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-white/30 text-xs">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Personalize with custom banner</span>
            </div>
          </div>
        )}

        {/* Banner Progress Bar */}
        {bannerProgress !== null && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-background/50 overflow-hidden z-20">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${bannerProgress}%` }}
            />
          </div>
        )}

        {/* Banner Action Buttons */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerProgress !== null}
            className="h-8 px-3 text-xs bg-card/80 backdrop-blur-md border border-border/80 hover:bg-card text-foreground shadow-soft flex items-center gap-1.5"
          >
            {bannerProgress !== null ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-primary" />
            )}
            <span>{hasCustomBanner ? 'Change Banner' : 'Upload Banner'}</span>
          </Button>

          {hasCustomBanner && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveBanner}
              disabled={bannerProgress !== null}
              className="h-8 w-8 p-0 bg-card/80 backdrop-blur-md border border-border/80 hover:bg-destructive/10 text-destructive hover:text-destructive shadow-soft"
              title="Remove Banner"
              aria-label="Remove Banner"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* AVATAR OVERLAY & ACTIONS */}
      {/* ============================================================ */}
      <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-end gap-4 -mt-16 sm:-mt-20 z-20">
          {/* Overlapping Avatar */}
          <div className="relative group/avatar">
            <Avatar className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-card ring-2 ring-border/80 shadow-soft-lg bg-card overflow-hidden">
              {avatarUrl && (
                <AvatarImage
                  src={avatarUrl}
                  alt={user.name}
                  className="object-cover w-full h-full"
                />
              )}
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            {/* Avatar Loading Overlay */}
            {avatarProgress !== null && (
              <div className="absolute inset-0 rounded-full bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-white z-30">
                <Loader2 className="w-6 h-6 animate-spin text-primary mb-1" />
                <span className="text-[10px] font-bold">{avatarProgress}%</span>
              </div>
            )}

            {/* Avatar Hover Actions */}
            <div className="absolute inset-0 rounded-full bg-slate-950/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarProgress !== null}
                className="p-2 rounded-full bg-primary text-primary-foreground hover:scale-105 transition shadow-soft focus:outline-none focus:ring-2 focus:ring-primary"
                title={hasCustomAvatar ? 'Change Photo' : 'Upload Photo'}
                aria-label="Upload Photo"
              >
                <Camera className="w-4 h-4" />
              </button>

              {hasCustomAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarProgress !== null}
                  className="p-2 rounded-full bg-destructive text-destructive-foreground hover:scale-105 transition shadow-soft focus:outline-none focus:ring-2 focus:ring-destructive"
                  title="Remove Custom Avatar"
                  aria-label="Remove Custom Avatar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* User Display Info */}
          <div className="pt-2 sm:pt-0 pb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {user.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Quick Avatar Trigger Button for Mobile / Touch Accessibility */}
        <div className="flex sm:hidden items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => avatarInputRef.current?.click()}
            className="flex-1 text-xs flex items-center justify-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-primary" />
            <span>Update Avatar</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => bannerInputRef.current?.click()}
            className="flex-1 text-xs flex items-center justify-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            <span>Update Banner</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
