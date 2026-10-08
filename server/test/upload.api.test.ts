import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { AuthService } from '../src/modules/auth/auth.service';
import { CloudinaryService } from '../src/common/services/cloudinary.service';

describe('Upload API Integration Endpoints (/api/v1/upload)', () => {
  const app = createApp();
  let userToken: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    userToken = AuthService.generateTokenFromPayload({
      id: '507f1f77bcf86cd799439011',
      name: 'Student User',
      email: 'student@pccoepune.org',
      role: 'STUDENT',
      profileComplete: true,
      approvalStatus: 'APPROVED',
      sessionStartedAt: Date.now(),
    });
  });

  it('rejects unauthenticated requests to /api/v1/upload/images with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/upload/images')
      .set('X-Requested-With', 'XMLHttpRequest')
      .attach('images', Buffer.from('fake'), { filename: 'test.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects requests without CSRF verification header with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/upload/images')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('images', Buffer.from('fake'), { filename: 'test.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
  });

  it('successfully uploads images to Cloudinary and returns URLs envelope', async () => {
    const mockUploadResults = [
      {
        url: 'http://res.cloudinary.com/dvx9cw0sy/image/upload/v1/fixify/tickets/img1.jpg',
        secureUrl: 'https://res.cloudinary.com/dvx9cw0sy/image/upload/v1/fixify/tickets/img1.jpg',
        publicId: 'fixify/tickets/img1',
        format: 'jpg',
        bytes: 1024,
      },
      {
        url: 'http://res.cloudinary.com/dvx9cw0sy/image/upload/v1/fixify/tickets/img2.png',
        secureUrl: 'https://res.cloudinary.com/dvx9cw0sy/image/upload/v1/fixify/tickets/img2.png',
        publicId: 'fixify/tickets/img2',
        format: 'png',
        bytes: 2048,
      },
    ];

    vi.spyOn(CloudinaryService, 'uploadMultiple').mockResolvedValue(mockUploadResults);

    const res = await request(app)
      .post('/api/v1/upload/images')
      .set('Authorization', `Bearer ${userToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .attach('images', Buffer.from('img1'), { filename: 'img1.jpg', contentType: 'image/jpeg' })
      .attach('images', Buffer.from('img2'), { filename: 'img2.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.images).toHaveLength(2);
    expect(res.body.data.urls).toEqual([
      'https://res.cloudinary.com/dvx9cw0sy/image/upload/v1/fixify/tickets/img1.jpg',
      'https://res.cloudinary.com/dvx9cw0sy/image/upload/v1/fixify/tickets/img2.png',
    ]);
  });

  it('rejects upload with no attached files with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/upload/images')
      .set('Authorization', `Bearer ${userToken}`)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('handles single image upload at /api/v1/upload/single', async () => {
    const mockSingle = {
      url: 'http://res.cloudinary.com/dvx9cw0sy/image/upload/v1/fixify/uploads/avatar.png',
      secureUrl: 'https://res.cloudinary.com/dvx9cw0sy/image/upload/v1/fixify/uploads/avatar.png',
      publicId: 'fixify/uploads/avatar',
      format: 'png',
      bytes: 4096,
    };

    vi.spyOn(CloudinaryService, 'uploadBuffer').mockResolvedValue(mockSingle);

    const res = await request(app)
      .post('/api/v1/upload/single')
      .set('Authorization', `Bearer ${userToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .attach('image', Buffer.from('avatar'), { filename: 'avatar.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.secureUrl).toBe(mockSingle.secureUrl);
  });

  it('handles image deletion at DELETE /api/v1/upload', async () => {
    vi.spyOn(CloudinaryService, 'deleteImage').mockResolvedValue(true);

    const res = await request(app)
      .delete('/api/v1/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ publicId: 'fixify/tickets/sample' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deleted).toBe(true);
  });
});
