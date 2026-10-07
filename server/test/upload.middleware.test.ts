import { describe, it, expect } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import {
  uploadTicketImages,
  uploadSingleImage,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_COUNT,
  ALLOWED_MIME_TYPES,
} from '../src/common/middleware/upload.middleware';
import { errorHandler } from '../src/common/middleware/error-handler.middleware';

describe('REQ-1.6 Upload Middleware Specifications', () => {
  const createTestApp = () => {
    const app = express();
    app.use(express.json());

    app.post('/test/upload-images', uploadTicketImages, (req: Request, res: Response) => {
      const files = req.files as Express.Multer.File[];
      res.status(200).json({
        success: true,
        count: files?.length || 0,
        files: files?.map((f) => ({
          filename: f.originalname,
          size: f.size,
          mimetype: f.mimetype,
        })),
      });
    });

    app.post('/test/upload-single', uploadSingleImage, (req: Request, res: Response) => {
      const file = req.file as Express.Multer.File;
      res.status(200).json({
        success: true,
        file: {
          filename: file?.originalname,
          size: file?.size,
          mimetype: file?.mimetype,
        },
      });
    });

    app.use(errorHandler);
    return app;
  };

  const app = createTestApp();

  it('exposes correct REQ-1.6 constants', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
    expect(MAX_FILES_COUNT).toBe(3);
    expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
    expect(ALLOWED_MIME_TYPES).toContain('image/png');
    expect(ALLOWED_MIME_TYPES).toContain('image/webp');
  });

  it('accepts valid JPEG, PNG, and WEBP image uploads (up to 3 files)', async () => {
    const fakeJpg = Buffer.from('fake jpg content');
    const fakePng = Buffer.from('fake png content');

    const res = await request(app)
      .post('/test/upload-images')
      .attach('images', fakeJpg, { filename: 'screen.jpg', contentType: 'image/jpeg' })
      .attach('images', fakePng, { filename: 'motherboard.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
  });

  it('rejects upload exceeding 3 images limit with TOO_MANY_FILES', async () => {
    const fakeImg = Buffer.from('image content');

    const res = await request(app)
      .post('/test/upload-images')
      .attach('images', fakeImg, { filename: '1.jpg', contentType: 'image/jpeg' })
      .attach('images', fakeImg, { filename: '2.jpg', contentType: 'image/jpeg' })
      .attach('images', fakeImg, { filename: '3.jpg', contentType: 'image/jpeg' })
      .attach('images', fakeImg, { filename: '4.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOO_MANY_FILES');
    expect(res.body.error.message).toContain('Maximum allowed is 3 images');
  });

  it('rejects disallowed MIME types (e.g. application/pdf, text/plain) with INVALID_FILE_TYPE', async () => {
    const fakeDoc = Buffer.from('document content');

    const res = await request(app)
      .post('/test/upload-images')
      .attach('images', fakeDoc, { filename: 'report.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    expect(res.body.error.message).toContain('Allowed types: JPEG, PNG, WEBP, GIF');
  });

  it('rejects files exceeding 5MB with FILE_TOO_LARGE', async () => {
    // 5.1 MB buffer
    const largeBuffer = Buffer.alloc(5.1 * 1024 * 1024, 0);

    const res = await request(app)
      .post('/test/upload-images')
      .attach('images', largeBuffer, { filename: 'huge.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
    expect(res.body.error.message).toContain('Maximum allowed file size is 5MB');
  });

  it('rejects unexpected field names with UNEXPECTED_FIELD', async () => {
    const fakeImg = Buffer.from('image content');

    const res = await request(app)
      .post('/test/upload-images')
      .attach('wrongField', fakeImg, { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNEXPECTED_FIELD');
  });

  it('handles single image upload correctly', async () => {
    const fakeImg = Buffer.from('single image content');

    const res = await request(app)
      .post('/test/upload-single')
      .attach('image', fakeImg, { filename: 'avatar.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.file.filename).toBe('avatar.png');
  });
});
