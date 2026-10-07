import { Router } from 'express';
import { UploadController } from './upload.controller';
import { authenticate } from '../auth/auth.middleware';
import {
  uploadTicketImages,
  uploadSingleImage,
} from '../../common/middleware/upload.middleware';

const router = Router();

// Authentication required for all media uploads
router.use(authenticate);

router.post('/images', uploadTicketImages, UploadController.uploadImages);
router.post('/single', uploadSingleImage, UploadController.uploadSingle);
router.delete('/', UploadController.deleteImage);
router.delete('/:publicId(*)', UploadController.deleteImage);

export const uploadRoutes = router;
