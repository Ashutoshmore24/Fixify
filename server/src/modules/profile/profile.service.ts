import { Types } from 'mongoose';
import { User, IUser } from '../auth/auth.model';
import { DeactivationRequest, IDeactivationRequest } from './deactivation-request.model';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundError, ConflictError } from '../../common/errors/app-error';
import { UpdateProfileInput } from './profile.schema';

export interface PublicProfileCard {
  _id: string;
  name: string;
  role: string;
  avatar?: { url: string; publicId: string } | null;
  picture?: string;
  banner?: { url: string; publicId: string } | null;
  department?: { _id: string; name: string; code: string } | null;
  assignedLabs?: Array<{ _id: string; name: string; code: string }>;
}

export class ProfileService {
  /**
   * Retrieves full profile for the authenticated user.
   */
  static async getOwnProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId)
      .select('-__v')
      .populate('department', 'name code')
      .populate('assignedLabs', 'name code building');

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return user;
  }

  /**
   * Updates only permitted fields on user profile.
   * Server strictly ignores/rejects email, role, department, prn, approvalStatus, firebaseUid.
   */
  static async updateOwnProfile(
    userId: string,
    input: UpdateProfileInput,
    ip?: string
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const beforeState = {
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      phone: user.phone,
      bio: user.bio,
      course: user.course,
      year: user.year,
      division: user.division,
    };

    // Update firstName / lastName
    if (input.firstName !== undefined) {
      user.firstName = input.firstName.trim();
    }
    if (input.lastName !== undefined) {
      user.lastName = input.lastName.trim();
    }
    if (input.firstName !== undefined || input.lastName !== undefined) {
      user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;
    }

    // Update phone & bio
    if (input.phone !== undefined) {
      user.phone = input.phone.trim();
    }
    if (input.bio !== undefined) {
      user.bio = input.bio.trim();
    }

    // Role-dependent updates: course, year, division allowed ONLY for STUDENT
    if (user.role === 'STUDENT') {
      if (input.course !== undefined) {
        user.course = input.course.trim();
      }
      if (input.year !== undefined) {
        user.year = input.year;
      }
      if (input.division !== undefined) {
        user.division = input.division.trim().toUpperCase();
      }
    }

    // Restricted fields (email, role, department, prn, approvalStatus, firebaseUid)
    // are strictly NOT touched, ensuring crafted payloads cannot change them.

    await user.save();

    // Populate for response
    await user.populate('department', 'name code');
    await user.populate('assignedLabs', 'name code building');

    // Audit Log
    await AuditService.logEvent({
      actor: user._id,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: user._id.toString(),
      before: beforeState,
      after: {
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        phone: user.phone,
        bio: user.bio,
        course: user.course,
        year: user.year,
        division: user.division,
      },
      ip,
    });

    return user;
  }

  /**
   * Uploads and updates avatar image with 400x400 face crop.
   * Deletes previously uploaded Cloudinary asset if one existed.
   */
  static async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
    ip?: string
  ): Promise<{ url: string; publicId: string }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const previousPublicId = user.avatar?.publicId;

    const result = await CloudinaryService.uploadBuffer(
      file.buffer,
      file.originalname,
      file.mimetype,
      {
        folder: 'fixify/avatars',
        tags: ['fixify', 'profile-avatar'],
        transformation: [
          { width: 400, height: 400, crop: 'thumb', gravity: 'face' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      }
    );

    // Delete previous asset if present
    if (previousPublicId) {
      await CloudinaryService.deleteImage(previousPublicId);
    }

    const beforeAvatar = user.avatar;
    user.avatar = {
      url: result.secureUrl || result.url,
      publicId: result.publicId,
    };
    await user.save();

    // Audit Log
    await AuditService.logEvent({
      actor: user._id,
      action: 'AVATAR_UPDATED',
      entityType: 'User',
      entityId: user._id.toString(),
      before: { avatar: beforeAvatar },
      after: { avatar: user.avatar },
      ip,
    });

    return user.avatar;
  }

  /**
   * Removes avatar and clears user.avatar field.
   */
  static async deleteAvatar(userId: string, ip?: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const beforeAvatar = user.avatar;
    if (user.avatar?.publicId) {
      await CloudinaryService.deleteImage(user.avatar.publicId);
    }

    user.avatar = { url: '', publicId: '' };
    await user.save();

    // Audit Log
    await AuditService.logEvent({
      actor: user._id,
      action: 'AVATAR_REMOVED',
      entityType: 'User',
      entityId: user._id.toString(),
      before: { avatar: beforeAvatar },
      after: { avatar: user.avatar },
      ip,
    });
  }

  /**
   * Uploads and updates banner image with 1500x500 fill transformation.
   * Deletes previously uploaded Cloudinary asset if one existed.
   */
  static async uploadBanner(
    userId: string,
    file: Express.Multer.File,
    ip?: string
  ): Promise<{ url: string; publicId: string }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const previousPublicId = user.banner?.publicId;

    const result = await CloudinaryService.uploadBuffer(
      file.buffer,
      file.originalname,
      file.mimetype,
      {
        folder: 'fixify/banners',
        tags: ['fixify', 'profile-banner'],
        transformation: [
          { width: 1500, height: 500, crop: 'fill' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      }
    );

    // Delete previous asset if present
    if (previousPublicId) {
      await CloudinaryService.deleteImage(previousPublicId);
    }

    const beforeBanner = user.banner;
    user.banner = {
      url: result.secureUrl || result.url,
      publicId: result.publicId,
    };
    await user.save();

    // Audit Log
    await AuditService.logEvent({
      actor: user._id,
      action: 'BANNER_UPDATED',
      entityType: 'User',
      entityId: user._id.toString(),
      before: { banner: beforeBanner },
      after: { banner: user.banner },
      ip,
    });

    return user.banner;
  }

  /**
   * Removes banner and clears user.banner field.
   */
  static async deleteBanner(userId: string, ip?: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const beforeBanner = user.banner;
    if (user.banner?.publicId) {
      await CloudinaryService.deleteImage(user.banner.publicId);
    }

    user.banner = { url: '', publicId: '' };
    await user.save();

    // Audit Log
    await AuditService.logEvent({
      actor: user._id,
      action: 'BANNER_REMOVED',
      entityType: 'User',
      entityId: user._id.toString(),
      before: { banner: beforeBanner },
      after: { banner: user.banner },
      ip,
    });
  }

  /**
   * Creates an account deactivation request.
   * No self hard-delete: ADMIN reviews and approves in admin module.
   */
  static async createDeactivationRequest(
    userId: string,
    reason: string,
    ip?: string
  ): Promise<IDeactivationRequest> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const existing = await DeactivationRequest.findOne({
      user: new Types.ObjectId(userId),
      status: 'PENDING',
    });

    if (existing) {
      throw new ConflictError(
        'An account deactivation request is already pending administrator review'
      );
    }

    const request = await DeactivationRequest.create({
      user: user._id,
      reason,
      status: 'PENDING',
    });

    // Audit Log
    await AuditService.logEvent({
      actor: user._id,
      action: 'DEACTIVATION_REQUESTED',
      entityType: 'DeactivationRequest',
      entityId: request._id.toString(),
      after: { reason, status: 'PENDING' },
      ip,
    });

    return request;
  }

  /**
   * Returns limited public profile card only (accessible to authenticated users).
   * Never exposes email, PRN, or phone.
   */
  static async getPublicProfile(targetUserId: string): Promise<PublicProfileCard> {
    const user = await User.findById(targetUserId)
      .populate('department', 'name code')
      .populate('assignedLabs', 'name code');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const card: PublicProfileCard = {
      _id: user._id.toString(),
      name: user.name,
      role: user.role,
      avatar: user.avatar?.url ? user.avatar : null,
      picture: user.picture || '',
      banner: user.banner?.url ? user.banner : null,
      department: user.department as unknown as { _id: string; name: string; code: string } | null,
    };

    if (user.role === 'LAB_ASSISTANT') {
      card.assignedLabs = (user.assignedLabs || []) as unknown as Array<{
        _id: string;
        name: string;
        code: string;
      }>;
    }

    return card;
  }
}
