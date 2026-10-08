import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../common/errors/app-error';

// Multer memory storage
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const detectImageMimeType = (
  buffer: Buffer
): 'image/jpeg' | 'image/png' | 'image/webp' | null => {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF .... WEBP
  const riff = buffer.subarray(0, 4).toString('ascii');
  const webp = buffer.subarray(8, 12).toString('ascii');
  if (riff === 'RIFF' && webp === 'WEBP') {
    return 'image/webp';
  }

  return null;
};

// 2 MB max for Avatar
export const avatarUploadMiddleware = [
  multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestError('Only JPEG, PNG, and WebP images are permitted'));
      }
    },
  }).single('avatar'),
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new BadRequestError('Avatar file is required'));
    }
    const realType = detectImageMimeType(req.file.buffer);
    if (!realType) {
      return next(
        new BadRequestError('File content is invalid or corrupted. Magic bytes do not match JPEG, PNG, or WebP.')
      );
    }
    // Update req.file.mimetype with the verified mime type
    req.file.mimetype = realType;
    next();
  },
];

// 5 MB max for Banner
export const bannerUploadMiddleware = [
  multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestError('Only JPEG, PNG, and WebP images are permitted'));
      }
    },
  }).single('banner'),
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new BadRequestError('Banner file is required'));
    }
    const realType = detectImageMimeType(req.file.buffer);
    if (!realType) {
      return next(
        new BadRequestError('File content is invalid or corrupted. Magic bytes do not match JPEG, PNG, or WebP.')
      );
    }
    req.file.mimetype = realType;
    next();
  },
];
