import jwt from 'jsonwebtoken';
import { env } from '../../common/config/env';
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../common/errors/app-error';
import mongoose, { Types } from 'mongoose';
import { User, IUser, UserRole, ApprovalStatus } from './auth.model';
import { verifyFirebaseIdToken, setFirebaseTokenVerifier, TokenVerifier } from './firebase-admin';
import { RegisterProfileInput } from './auth.schema';

export interface JwtTokenPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  profileComplete?: boolean;
  approvalStatus?: ApprovalStatus;
  tokenVersion?: number;
  sessionStartedAt?: number;
}

export class AuthService {
  /**
   * Injects a custom verifier for unit testing and offline development.
   */
  public static setTokenVerifier(verifier: TokenVerifier | null): void {
    setFirebaseTokenVerifier(verifier);
  }

  /**
   * Validates whether an email domain is allowed by institutional policy (BR-10).
   * Enforces exact match on the part after '@'. Subdomains or lookalike prefixes must NOT pass.
   */
  public static isDomainAllowed(email: string): boolean {
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1]?.toLowerCase().trim();
    if (!domain) return false;

    const allowed = env.allowedDomainsList;
    if (allowed.includes('*')) return true;

    // Strict exact match against configured institutional domain list
    return allowed.includes(domain);
  }

  /**
   * Verifies Firebase ID token, checks institutional domain and email verification, and provisions or updates user.
   */
  public static async loginWithFirebase(
    idToken: string
  ): Promise<{ user: IUser; token: string; profileComplete: boolean; approvalStatus: ApprovalStatus }> {
    const decoded = await verifyFirebaseIdToken(idToken);

    if (!decoded || !decoded.email) {
      throw new UnauthorizedError('Firebase authentication payload did not contain email');
    }

    const email = decoded.email.toLowerCase().trim();

    // 1. Enforce BR-10 verified email requirement: HTTP 403 with friendly message
    if (decoded.email_verified !== true) {
      throw new ForbiddenError(
        'Please verify your institutional email address before signing in.',
        'UNVERIFIED_EMAIL'
      );
    }

    // 2. Enforce BR-10 institutional email domain constraint: exact match on email domain
    if (!this.isDomainAllowed(email)) {
      const domain = email.split('@')[1] || '';
      throw new ForbiddenError(
        `Access denied: Institutional account required. Domain "${domain}" is not authorized.`,
        'UNAUTHORIZED_DOMAIN'
      );
    }

    // 3. Find or provision user
    let user = await User.findOne({
      $or: [{ firebaseUid: decoded.uid }, { email }],
    });

    if (!user) {
      // First login role allocation
      let initialRole: UserRole = 'STUDENT';
      let approvalStatus: ApprovalStatus = 'APPROVED';
      let profileComplete = false;

      if (email === env.ADMIN_EMAIL.toLowerCase().trim()) {
        initialRole = 'ADMIN';
        approvalStatus = 'APPROVED';
        profileComplete = true; // Admin bootstrap is auto-complete
      } else if (email.includes('faculty') || email.includes('prof')) {
        initialRole = 'FACULTY';
        approvalStatus = 'APPROVED';
      }

      user = new User({
        firebaseUid: decoded.uid,
        name: decoded.name || email.split('@')[0],
        email,
        picture: decoded.picture || '',
        role: initialRole,
        profileComplete,
        approvalStatus,
        isActive: true,
        lastLoginAt: new Date(),
      });
      await user.save();
    } else {
      if (!user.isActive) {
        throw new ForbiddenError('Your account has been deactivated. Please contact an administrator.');
      }
      if (user.deletedAt) {
        throw new ForbiddenError('Account not found or deleted.');
      }

      // Link firebaseUid if it was created via seed or dev-login
      if (!user.firebaseUid) {
        user.firebaseUid = decoded.uid;
      }

      // Upgrade to admin if email matches ADMIN_EMAIL
      if (email === env.ADMIN_EMAIL.toLowerCase().trim() && user.role !== 'ADMIN') {
        user.role = 'ADMIN';
        user.approvalStatus = 'APPROVED';
        user.profileComplete = true;
      }

      if (decoded.name && !user.name) {
        user.name = decoded.name;
      }
      if (decoded.picture && !user.picture) {
        user.picture = decoded.picture;
      }

      user.lastLoginAt = new Date();
      await user.save();
    }

    const token = this.generateToken(user);
    return {
      user,
      token,
      profileComplete: Boolean(user.profileComplete),
      approvalStatus: user.approvalStatus,
    };
  }

  /**
   * Backwards compatible alias for loginWithFirebase.
   */
  public static async loginWithGoogle(
    idToken: string
  ): Promise<{ user: IUser; token: string; profileComplete: boolean; approvalStatus: ApprovalStatus }> {
    return this.loginWithFirebase(idToken);
  }

  /**
   * Completes registration profile for newly created or Google accounts.
   */
  public static async registerProfile(
    userId: string,
    data: RegisterProfileInput
  ): Promise<{ user: IUser; token: string }> {
    const user = await User.findById(userId);
    if (!user || user.deletedAt) {
      throw new NotFoundError('User account not found');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Account is deactivated');
    }

    // Role escalation prevention: Only STUDENT or FACULTY allowed through public registration
    if (data.role !== 'STUDENT' && data.role !== 'FACULTY') {
      throw new ForbiddenError(
        'Public registration permits only STUDENT or FACULTY accounts.',
        'ROLE_ESCALATION_DENIED'
      );
    }

    const trimmedFirstName = data.firstName.trim();
    const trimmedLastName = data.lastName.trim();
    const fullName = `${trimmedFirstName} ${trimmedLastName}`.trim();

    user.firstName = trimmedFirstName;
    user.lastName = trimmedLastName;
    user.name = fullName;

    if (data.role === 'STUDENT') {
      const prn = data.prn?.trim().toUpperCase();
      if (!prn) {
        throw new BadRequestError('PRN is required for student registration', 'MISSING_PRN');
      }

      const prnRegex = new RegExp(env.PRN_REGEX, 'i');
      if (!prnRegex.test(prn)) {
        throw new BadRequestError(
          `Invalid PRN format. PRN must match institutional pattern: ${env.PRN_REGEX}`,
          'INVALID_PRN'
        );
      }

      // Check duplicate PRN
      const duplicatePrnUser = await User.findOne({
        prn,
        _id: { $ne: user._id },
      });
      if (duplicatePrnUser) {
        throw new ConflictError(
          'A student with this PRN is already registered in the system.',
          'DUPLICATE_PRN'
        );
      }

      user.role = 'STUDENT';
      user.course = data.course?.trim() || '';
      user.year = data.year?.trim() || '';
      user.division = data.division?.trim() || '';
      user.prn = prn;
      user.approvalStatus = 'APPROVED';
      user.profileComplete = true;
    } else if (data.role === 'FACULTY') {
      user.role = 'FACULTY';
      user.employeeId = data.employeeId?.trim() || '';

      if (data.department) {
        if (Types.ObjectId.isValid(data.department)) {
          user.department = new Types.ObjectId(data.department);
        } else {
          const DepartmentModel = mongoose.models.Department || mongoose.model('Department');
          const dept = await DepartmentModel.findOne({
            $or: [
              { code: data.department.toUpperCase() },
              { name: data.department },
            ],
          });
          if (dept) {
            user.department = dept._id;
          }
        }
      }

      // Check faculty domain rule from ASSUMPTIONS.md:
      // Auto-approved only if email matches faculty pattern, otherwise PENDING_APPROVAL
      const email = user.email.toLowerCase();
      const isFacultyDomain =
        email.includes('faculty') ||
        email.includes('prof') ||
        email.endsWith('@faculty.pccoe.org') ||
        email.endsWith('@pccoepune.org');

      user.approvalStatus = isFacultyDomain ? 'APPROVED' : 'PENDING_APPROVAL';
      user.profileComplete = true;
    }

    await user.save();
    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Generates a signed JWT with 15-minute sliding session validity and absolute max lifetime.
   */
  public static generateToken(user: IUser, sessionStartedAt?: number): string {
    const payload: JwtTokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      profileComplete: user.profileComplete,
      approvalStatus: user.approvalStatus,
      tokenVersion: user.tokenVersion || 0,
      sessionStartedAt: sessionStartedAt || Date.now(),
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Generates a refreshed JWT preserving the original session start time.
   */
  public static generateTokenFromPayload(payload: JwtTokenPayload): string {
    const cleanPayload: JwtTokenPayload = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      profileComplete: payload.profileComplete,
      approvalStatus: payload.approvalStatus,
      tokenVersion: payload.tokenVersion || 0,
      sessionStartedAt: payload.sessionStartedAt || Date.now(),
    };
    return jwt.sign(cleanPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Verifies and decodes a JWT token string.
   */
  public static verifyToken(token: string): JwtTokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtTokenPayload;
    } catch {
      throw new UnauthorizedError('Session expired or invalid token', 'TOKEN_EXPIRED');
    }
  }

  /**
   * Development-only login bypass for test fixtures and seed personas.
   */
  public static async devLogin(
    email: string,
    name?: string,
    role?: UserRole
  ): Promise<{ user: IUser; token: string }> {
    if (env.NODE_ENV === 'production') {
      throw new ForbiddenError('Development login is disabled in production');
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      let initialRole: UserRole = role || 'STUDENT';
      if (!role) {
        if (normalizedEmail === env.ADMIN_EMAIL.toLowerCase().trim()) {
          initialRole = 'ADMIN';
        } else if (normalizedEmail.includes('faculty') || normalizedEmail.includes('prof')) {
          initialRole = 'FACULTY';
        }
      }

      user = new User({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: initialRole,
        profileComplete: true,
        approvalStatus: 'APPROVED',
        isActive: true,
        lastLoginAt: new Date(),
      });
      await user.save();
    } else {
      if (role && user.role !== role) {
        user.role = role;
      }
      user.profileComplete = true;
      user.approvalStatus = 'APPROVED';
      user.lastLoginAt = new Date();
      await user.save();
    }

    const token = this.generateToken(user);
    return { user, token };
  }
}
