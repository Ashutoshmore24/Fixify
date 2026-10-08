import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  aspectRatio: number; // e.g. 1 for avatar (1:1), 3 for banner (1500:500 = 3:1)
  targetWidth: number; // e.g. 400 for avatar, 1500 for banner
  targetHeight: number; // e.g. 400 for avatar, 500 for banner
  title: string;
  onConfirm: (croppedBlob: Blob, previewUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageFile,
  aspectRatio,
  targetWidth,
  targetHeight,
  title,
  onConfirm,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      return () => URL.revokeObjectURL(url);
    } else {
      setImageSrc(null);
    }
  }, [imageFile]);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Center and transform
    ctx.translate(width / 2 + position.x, height / 2 + position.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Draw image centered
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawWidth = width;
    let drawHeight = height;

    if (imgAspect > aspectRatio) {
      drawHeight = height;
      drawWidth = height * imgAspect;
    } else {
      drawWidth = width;
      drawHeight = width / imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }, [aspectRatio, position, rotation, scale]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = targetWidth;
    outputCanvas.height = targetHeight;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.translate(targetWidth / 2 + (position.x * targetWidth) / 400, targetHeight / 2 + (position.y * targetHeight) / (400 / aspectRatio));
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawWidth = targetWidth;
    let drawHeight = targetHeight;

    if (imgAspect > aspectRatio) {
      drawHeight = targetHeight;
      drawWidth = targetHeight * imgAspect;
    } else {
      drawWidth = targetWidth;
      drawHeight = targetWidth / imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          const preview = URL.createObjectURL(blob);
          onConfirm(blob, preview);
          onClose();
        }
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Position and zoom your photo to fit the frame, then confirm to upload.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {imageSrc && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Source"
              className="hidden"
              onLoad={drawPreview}
            />
          )}

          {/* Canvas Viewport */}
          <div
            className="relative overflow-hidden rounded-xl border border-border bg-muted/40 flex items-center justify-center cursor-move select-none"
            style={{
              aspectRatio: `${aspectRatio}`,
              maxHeight: '260px',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={400}
              height={Math.round(400 / aspectRatio)}
              className="w-full h-full object-cover"
            />
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none border-2 border-primary/40 border-dashed rounded-xl" />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-3 p-2 bg-muted/30 rounded-xl border border-border/60">
            <div className="flex items-center gap-2 flex-1">
              <ZoomOut className="w-4 h-4 text-muted-foreground" />
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label="Zoom level"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="h-8 px-2.5 text-xs flex items-center gap-1 shrink-0"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={handleConfirm}>
            Apply & Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
