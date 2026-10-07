import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/app-error';

// REQ-1.6 constraints: max 3 images, 5MB per file
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES_COUNT = 3;
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'image/gif',
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid file type "${file.mimetype}". Allowed types: JPEG, PNG, WEBP, GIF`,
        'INVALID_FILE_TYPE'
      )
    );
  }
};

const storage = multer.memoryStorage();

const multerTicketImages = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_COUNT,
  },
  fileFilter,
}).array('images', MAX_FILES_COUNT);

const multerSingleImage = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter,
}).single('image');

/**
 * Middleware handling up to 3 complaint ticket images
 */
export const uploadTicketImages = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  multerTicketImages(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            return next(
              new BadRequestError(
                'File too large. Maximum allowed file size is 5MB.',
                'FILE_TOO_LARGE'
              )
            );
          case 'LIMIT_FILE_COUNT':
            return next(
              new BadRequestError(
                `Too many files. Maximum allowed is ${MAX_FILES_COUNT} images.`,
                'TOO_MANY_FILES'
              )
            );
          case 'LIMIT_UNEXPECTED_FILE':
            return next(
              new BadRequestError(
                `Unexpected field "${err.field}". Form field name must be "images".`,
                'UNEXPECTED_FIELD'
              )
            );
          default:
            return next(
              new BadRequestError(`Upload error: ${err.message}`, 'UPLOAD_ERROR')
            );
        }
      }
      return next(err);
    }
    next();
  });
};

/**
 * Middleware handling a single image upload
 */
export const uploadSingleImage = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  multerSingleImage(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new BadRequestError(
              'File too large. Maximum allowed file size is 5MB.',
              'FILE_TOO_LARGE'
            )
          );
        }
        return next(
          new BadRequestError(`Upload error: ${err.message}`, 'UPLOAD_ERROR')
        );
      }
      return next(err);
    }
    next();
  });
};
