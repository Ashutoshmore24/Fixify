import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, Image as ImageIcon, Loader2, AlertCircle, Eye } from 'lucide-react';
import { api } from '../../lib/axios';

export interface ImageUploaderProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxImages?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
}

const DEFAULT_MAX_IMAGES = 3;
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB (REQ-1.6)

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value = [],
  onChange,
  maxImages = DEFAULT_MAX_IMAGES,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = value || [];

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (disabled || isUploading) return;
      setUploadError(null);

      const files = Array.from(fileList);
      if (files.length === 0) return;

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        setUploadError(`Maximum of ${maxImages} images allowed.`);
        return;
      }

      const filesToUpload = files.slice(0, remainingSlots);

      // Validate files client-side before sending
      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) {
          setUploadError(`"${file.name}" is not a supported image file.`);
          return;
        }
        if (file.size > maxSizeBytes) {
          const mbLimit = Math.round(maxSizeBytes / (1024 * 1024));
          setUploadError(`"${file.name}" exceeds the ${mbLimit}MB limit.`);
          return;
        }
      }

      const formData = new FormData();
      filesToUpload.forEach((file) => {
        formData.append('images', file);
      });

      setIsUploading(true);
      try {
        const response = await api.post('/upload/images', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data?.success && response.data?.data?.urls) {
          const newUrls = [...images, ...response.data.data.urls].slice(0, maxImages);
          onChange?.(newUrls);
        } else {
          setUploadError('Failed to upload image. Please try again.');
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: { message?: string } } } };
        const msg =
          error.response?.data?.error?.message ||
          'Upload failed. Please check network connection and try again.';
        setUploadError(msg);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [disabled, isUploading, maxImages, images, maxSizeBytes, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && images.length < maxImages) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (indexToRemove: number) => {
    if (disabled) return;
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange?.(updated);
  };

  return (
    <div className="space-y-3">
      {/* Upload Drop Zone & Thumbnails */}
      <div className="flex flex-wrap gap-2.5 items-center">
        {/* Render uploaded image thumbnails */}
        {images.map((url, idx) => (
          <div
            key={idx}
            className="group relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm transition hover:shadow-md"
          >
            <img
              src={url}
              alt={`Evidence snapshot ${idx + 1}`}
              className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewModalUrl(url)}
                aria-label="View photo full size"
                className="w-6 h-6 rounded-full bg-white/90 text-slate-800 hover:bg-white flex items-center justify-center shadow transition"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  aria-label="Remove photo"
                  className="w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="absolute bottom-1 right-1 text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
              #{idx + 1}
            </span>
          </div>
        ))}

        {/* Upload Trigger / Dropzone when less than maxImages */}
        {images.length < maxImages && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => {
              if (!disabled && !isUploading) {
                fileInputRef.current?.click();
              }
            }}
            className={`w-20 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition select-none ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 scale-95'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-400 hover:text-blue-600'
            } ${disabled || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple={maxImages - images.length > 1}
              disabled={disabled || isUploading}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(e.target.files);
                }
              }}
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-[9px] font-medium text-blue-600">Uploading...</span>
              </div>
            ) : (
              <>
                <UploadCloud className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold">Attach</span>
                <span className="text-[8px] text-slate-400">Max 5MB</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Helpful Hint or Error Message */}
      {uploadError ? (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <ImageIcon className="w-3 h-3 text-slate-400" />
          Optional proof photo (max 3, up to 5MB each, stored securely on Cloudinary)
        </p>
      )}

      {/* Image Preview Modal / Lightbox */}
      {previewModalUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewModalUrl}
              alt="Enlarged evidence snapshot"
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
