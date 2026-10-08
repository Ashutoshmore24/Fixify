import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { AuthService } from '../src/modules/auth/auth.service';
import { User } from '../src/modules/auth/auth.model';
import { DeactivationRequest } from '../src/modules/profile/deactivation-request.model';
import { CloudinaryService } from '../src/common/services/cloudinary.service';
import { AuditService } from '../src/modules/audit/audit.service';

describe('Profile API Endpoints (/api/v1/profile)', () => {
  const app = createApp();
  let studentToken: string;
  let facultyToken: string;
  let assistantToken: string;

  const mockStudentUser = {
    _id: '507f1f77bcf86cd799439011',
    firebaseUid: 'firebase_student_123',
    firstName: 'Rahul',
    lastName: 'Sharma',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@pccoe.org',
    role: 'STUDENT',
    course: 'B.Tech Computer Engineering',
    year: 'TE',
    division: 'A',
    prn: '124B1F001',
    phone: '9876543210',
    bio: 'CS student at PCCoE',
    picture: 'https://lh3.googleusercontent.com/a/student-default-photo',
    avatar: { url: 'https://res.cloudinary.com/demo/image/upload/v1/fixify/avatars/avatar1.jpg', publicId: 'fixify/avatars/avatar1' },
    banner: { url: 'https://res.cloudinary.com/demo/image/upload/v1/fixify/banners/banner1.jpg', publicId: 'fixify/banners/banner1' },
    department: { _id: '507f1f77bcf86cd799439099', name: 'Computer Engineering', code: 'COMP' },
    assignedLabs: [],
    profileComplete: true,
    approvalStatus: 'APPROVED',
    save: vi.fn().mockResolvedValue(true),
    populate: vi.fn().mockImplementation(() => Promise.resolve(mockStudentUser)),
  };

  const mockAssistantUser = {
    _id: '507f1f77bcf86cd799439022',
    name: 'Santosh Patil',
    email: 'assistant@pccoe.org',
    role: 'LAB_ASSISTANT',
    prn: undefined,
    phone: '9876500000',
    picture: 'https://lh3.googleusercontent.com/a/assistant-photo',
    avatar: { url: 'https://res.cloudinary.com/demo/image/upload/v1/fixify/avatars/asst.jpg', publicId: 'fixify/avatars/asst' },
    banner: { url: 'https://res.cloudinary.com/demo/image/upload/v1/fixify/banners/asst_banner.jpg', publicId: 'fixify/banners/asst_banner' },
    department: { _id: '507f1f77bcf86cd799439099', name: 'Computer Engineering', code: 'COMP' },
    assignedLabs: [{ _id: '507f1f77bcf86cd799439088', name: 'Software Lab 1', code: 'SL-1' }],
    profileComplete: true,
    approvalStatus: 'APPROVED',
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    studentToken = AuthService.generateTokenFromPayload({
      id: '507f1f77bcf86cd799439011',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@pccoe.org',
      role: 'STUDENT',
      profileComplete: true,
      approvalStatus: 'APPROVED',
      sessionStartedAt: Date.now(),
    });

    facultyToken = AuthService.generateTokenFromPayload({
      id: '507f1f77bcf86cd799439033',
      name: 'Prof. Kulkarni',
      email: 'faculty@pccoe.org',
      role: 'FACULTY',
      profileComplete: true,
      approvalStatus: 'APPROVED',
      sessionStartedAt: Date.now(),
    });

    assistantToken = AuthService.generateTokenFromPayload({
      id: '507f1f77bcf86cd799439022',
      name: 'Santosh Patil',
      email: 'assistant@pccoe.org',
      role: 'LAB_ASSISTANT',
      profileComplete: true,
      approvalStatus: 'APPROVED',
      sessionStartedAt: Date.now(),
    });
  });

  describe('Security & Authentication Enforcements', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/profile/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects state-changing requests without CSRF verification header with 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ firstName: 'Amit' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });
  });

  describe('GET /api/v1/profile/me', () => {
    it('returns full own profile for authenticated user', async () => {
      const queryMock = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => resolve(mockStudentUser)),
      };
      vi.spyOn(User, 'findById').mockReturnValue(queryMock as any);

      const res = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('rahul.sharma@pccoe.org');
      expect(res.body.data.prn).toBe('124B1F001');
      expect(res.body.data.course).toBe('B.Tech Computer Engineering');
    });
  });

  describe('PATCH /api/v1/profile/me (Tamper-Proof & Editable Fields Enforcement)', () => {
    it('updates editable fields and logs audit event', async () => {
      const userInstance = {
        ...mockStudentUser,
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(User, 'findById').mockResolvedValue(userInstance as any);
      const auditSpy = vi.spyOn(AuditService, 'logEvent').mockResolvedValue({} as any);

      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          firstName: 'Vikram',
          lastName: 'Deshmukh',
          phone: '9988776655',
          bio: 'Aspiring Cloud Developer',
          year: 'BE',
          division: 'B',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(userInstance.firstName).toBe('Vikram');
      expect(userInstance.lastName).toBe('Deshmukh');
      expect(userInstance.name).toBe('Vikram Deshmukh');
      expect(userInstance.phone).toBe('9988776655');
      expect(userInstance.bio).toBe('Aspiring Cloud Developer');
      expect(userInstance.year).toBe('BE');
      expect(userInstance.division).toBe('B');
      expect(userInstance.save).toHaveBeenCalled();
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PROFILE_UPDATED',
          entityType: 'User',
        })
      );
    });

    it('ignores student fields (course, year, division) when updated by FACULTY', async () => {
      const mockFaculty = {
        _id: '507f1f77bcf86cd799439033',
        name: 'Prof. Kulkarni',
        email: 'faculty@pccoe.org',
        role: 'FACULTY',
        bio: '',
        course: undefined,
        year: undefined,
        division: undefined,
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(User, 'findById').mockResolvedValue(mockFaculty as any);

      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', `Bearer ${facultyToken}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          bio: 'Professor of Computer Engineering',
          course: 'B.Tech IT',
          year: 'BE',
          division: 'C',
        });

      expect(res.status).toBe(200);
      expect(mockFaculty.bio).toBe('Professor of Computer Engineering');
      // For faculty, course, year, and division MUST NOT be updated
      expect(mockFaculty.course).toBeUndefined();
      expect(mockFaculty.year).toBeUndefined();
      expect(mockFaculty.division).toBeUndefined();
    });

    it('allows LAB_ASSISTANT to update phone and bio', async () => {
      const mockAsst = {
        ...mockAssistantUser,
        phone: '9876500000',
        bio: '',
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(User, 'findById').mockResolvedValue(mockAsst as any);

      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', `Bearer ${assistantToken}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          phone: '9123456789',
          bio: 'Lab Assistant for Software Lab 1',
        });

      expect(res.status).toBe(200);
      expect(mockAsst.phone).toBe('9123456789');
      expect(mockAsst.bio).toBe('Lab Assistant for Software Lab 1');
    });

    it('PREVENTS crafted payload from altering restricted fields (email, role, department, prn, approvalStatus, firebaseUid)', async () => {
      const userInstance = {
        ...mockStudentUser,
        email: 'rahul.sharma@pccoe.org',
        role: 'STUDENT',
        department: '507f1f77bcf86cd799439099',
        prn: '124B1F001',
        approvalStatus: 'APPROVED',
        firebaseUid: 'firebase_student_123',
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(User, 'findById').mockResolvedValue(userInstance as any);

      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          firstName: 'Rahul',
          // CRAFTED MALICIOUS ATTRIBUTES:
          email: 'hacked_admin@pccoe.org',
          role: 'ADMIN',
          department: '999999999999999999999999',
          prn: 'MODIFIED_PRN',
          approvalStatus: 'REJECTED',
          firebaseUid: 'crafted_foreign_uid',
        });

      expect(res.status).toBe(200);
      // Restricted fields MUST remain completely unaltered
      expect(userInstance.email).toBe('rahul.sharma@pccoe.org');
      expect(userInstance.role).toBe('STUDENT');
      expect(userInstance.department).toBe('507f1f77bcf86cd799439099');
      expect(userInstance.prn).toBe('124B1F001');
      expect(userInstance.approvalStatus).toBe('APPROVED');
      expect(userInstance.firebaseUid).toBe('firebase_student_123');
    });

    it('rejects bio exceeding 160 characters with 400 Bad Request', async () => {
      const longBio = 'a'.repeat(161);
      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ bio: longBio });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/profile/me/avatar & /banner (Magic Bytes & Uploads)', () => {
    // Valid magic byte buffers
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const fakeExeBuffer = Buffer.from('MZ_THIS_IS_AN_EXE_NOT_AN_IMAGE_FILE_BUFFER');

    it('rejects avatar uploads with fake extension but invalid magic bytes', async () => {
      const res = await request(app)
        .post('/api/v1/profile/me/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .attach('avatar', fakeExeBuffer, { filename: 'malicious.png', contentType: 'image/png' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/magic bytes/i);
    });

    it('rejects avatar files exceeding 2 MB', async () => {
      const oversizedBuffer = Buffer.concat([validJpgBuffer, Buffer.alloc(2.5 * 1024 * 1024)]);

      const res = await request(app)
        .post('/api/v1/profile/me/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .attach('avatar', oversizedBuffer, { filename: 'large.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
    });

    it('successfully uploads avatar, deletes previous Cloudinary asset, and writes audit log', async () => {
      const userInstance = {
        ...mockStudentUser,
        avatar: { url: 'https://old-url', publicId: 'fixify/avatars/old_avatar_123' },
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(User, 'findById').mockResolvedValue(userInstance as any);
      const deleteSpy = vi.spyOn(CloudinaryService, 'deleteImage').mockResolvedValue(true);
      const uploadSpy = vi.spyOn(CloudinaryService, 'uploadBuffer').mockResolvedValue({
        url: 'http://new-avatar',
        secureUrl: 'https://new-avatar',
        publicId: 'fixify/avatars/new_123',
        format: 'jpg',
        bytes: 1024,
      });
      const auditSpy = vi.spyOn(AuditService, 'logEvent').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/profile/me/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .attach('avatar', validJpgBuffer, { filename: 'avatar.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(uploadSpy).toHaveBeenCalledWith(
        expect.any(Buffer),
        'avatar.jpg',
        'image/jpeg',
        expect.objectContaining({
          folder: 'fixify/avatars',
          transformation: expect.arrayContaining([
            expect.objectContaining({ width: 400, height: 400 }),
          ]),
        })
      );
      // Confirmed deletion of previous asset
      expect(deleteSpy).toHaveBeenCalledWith('fixify/avatars/old_avatar_123');
      expect(userInstance.avatar.publicId).toBe('fixify/avatars/new_123');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AVATAR_UPDATED', entityType: 'User' })
      );
    });

    it('successfully uploads banner with 1500x500 transformation and clears old asset', async () => {
      const userInstance = {
        ...mockStudentUser,
        banner: { url: 'https://old-banner', publicId: 'fixify/banners/old_banner_123' },
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(User, 'findById').mockResolvedValue(userInstance as any);
      const deleteSpy = vi.spyOn(CloudinaryService, 'deleteImage').mockResolvedValue(true);
      const uploadSpy = vi.spyOn(CloudinaryService, 'uploadBuffer').mockResolvedValue({
        url: 'http://new-banner',
        secureUrl: 'https://new-banner',
        publicId: 'fixify/banners/new_banner_123',
        format: 'png',
        bytes: 2048,
      });

      const res = await request(app)
        .post('/api/v1/profile/me/banner')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .attach('banner', validPngBuffer, { filename: 'banner.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(uploadSpy).toHaveBeenCalledWith(
        expect.any(Buffer),
        'banner.png',
        'image/png',
        expect.objectContaining({
          folder: 'fixify/banners',
          transformation: expect.arrayContaining([
            expect.objectContaining({ width: 1500, height: 500 }),
          ]),
        })
      );
      expect(deleteSpy).toHaveBeenCalledWith('fixify/banners/old_banner_123');
    });

    it('DELETE /api/v1/profile/me/avatar removes asset and clears field', async () => {
      const userInstance = {
        ...mockStudentUser,
        avatar: { url: 'https://avatar', publicId: 'fixify/avatars/to_delete' },
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(User, 'findById').mockResolvedValue(userInstance as any);
      const deleteSpy = vi.spyOn(CloudinaryService, 'deleteImage').mockResolvedValue(true);
      const auditSpy = vi.spyOn(AuditService, 'logEvent').mockResolvedValue({} as any);

      const res = await request(app)
        .delete('/api/v1/profile/me/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(deleteSpy).toHaveBeenCalledWith('fixify/avatars/to_delete');
      expect(userInstance.avatar).toEqual({ url: '', publicId: '' });
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AVATAR_REMOVED' })
      );
    });
  });

  describe('POST /api/v1/profile/me/deactivation-request', () => {
    it('creates deactivation request and DOES NOT delete user', async () => {
      const userInstance = {
        ...mockStudentUser,
        save: vi.fn(),
      };
      vi.spyOn(User, 'findById').mockResolvedValue(userInstance as any);
      vi.spyOn(DeactivationRequest, 'findOne').mockResolvedValue(null);
      const createSpy = vi.spyOn(DeactivationRequest, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439077',
        user: userInstance._id,
        reason: 'Graduating this semester from PCCoE',
        status: 'PENDING',
      } as any);
      const auditSpy = vi.spyOn(AuditService, 'logEvent').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/profile/me/deactivation-request')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ reason: 'Graduating this semester from PCCoE' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'Graduating this semester from PCCoE',
          status: 'PENDING',
        })
      );
      // User is NOT deleted
      expect(userInstance.save).not.toHaveBeenCalled();
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DEACTIVATION_REQUESTED' })
      );
    });

    it('rejects deactivation request if reason is omitted or too short', async () => {
      const res = await request(app)
        .post('/api/v1/profile/me/deactivation-request')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ reason: '' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/profile/:id/public (Strict Scoping & Privacy)', () => {
    it('returns limited card only and NEVER exposes email, PRN, or phone', async () => {
      const queryMock = {
        populate: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => resolve(mockAssistantUser)),
      };
      vi.spyOn(User, 'findById').mockReturnValue(queryMock as any);

      const res = await request(app)
        .get(`/api/v1/profile/${mockAssistantUser._id}/public`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const card = res.body.data;

      // Card includes public fields:
      expect(card.name).toBe('Santosh Patil');
      expect(card.role).toBe('LAB_ASSISTANT');
      expect(card.avatar.url).toBe(mockAssistantUser.avatar.url);
      expect(card.department.name).toBe('Computer Engineering');
      expect(card.assignedLabs).toHaveLength(1);

      // Card NEVER exposes private fields:
      expect(card.email).toBeUndefined();
      expect(card.prn).toBeUndefined();
      expect(card.phone).toBeUndefined();
      expect(card.firebaseUid).toBeUndefined();
      expect(card.approvalStatus).toBeUndefined();
    });
  });
});
