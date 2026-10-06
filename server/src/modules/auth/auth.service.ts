import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../common/config/env';
import { UnauthorizedError, ForbiddenError } from '../../common/errors/app-error';
import { User, IUser, UserRole } from './auth.model';
import { logger } from '../../common/utils/logger';

let googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface JwtTokenPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  sessionStartedAt: number;
}

export class AuthService {
  /**
   * Allows injecting a custom or mocked OAuth2Client for testing.
   */
  public static setOAuth2Client(client: OAuth2Client): void {
    googleClient = client;
  }

  /**
   * Validates whether an email domain is allowed by institutional policy (BR-10).
   * Enforces exact match on the part after '@'. hd alone must NOT pass.
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
   * Verifies Google OAuth ID token, checks institutional domain, and provisions or updates user.
   */
  public static async loginWithGoogle(idToken: string): Promise<{ user: IUser; token: string }> {
    let payload: {
      email?: string;
      name?: string;
      picture?: string;
      hd?: string;
      email_verified?: boolean;
    } | undefined;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      logger.warn(error, 'Google ID token verification failed');
      throw new UnauthorizedError('Invalid or expired Google authentication token');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedError('Google authentication payload did not contain email');
    }

    if (payload.email_verified !== true) {
      throw new UnauthorizedError('Google email is not verified', 'UNVERIFIED_EMAIL');
    }

    const email = payload.email.toLowerCase().trim();

    // Enforce BR-10 institutional email domain constraint: exact match on email domain
    if (!this.isDomainAllowed(email)) {
      throw new ForbiddenError(
        `Access denied: Institutional account required. Domain "${email.split('@')[1]}" is not authorized.`,
        'UNAUTHORIZED_DOMAIN'
      );
    }

    // Find or provision user
    let user = await User.findOne({ email });

    if (!user) {
      // First login role allocation
      let initialRole: UserRole = 'STUDENT';
      if (email === env.ADMIN_EMAIL.toLowerCase().trim()) {
        initialRole = 'ADMIN';
      } else if (email.includes('faculty') || email.includes('prof')) {
        initialRole = 'FACULTY';
      }

      user = new User({
        name: payload.name || email.split('@')[0],
        email,
        picture: payload.picture || '',
        role: initialRole,
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

      // Upgrade to admin if email matches ADMIN_EMAIL
      if (email === env.ADMIN_EMAIL.toLowerCase().trim() && user.role !== 'ADMIN') {
        user.role = 'ADMIN';
      }

      user.name = payload.name || user.name;
      user.picture = payload.picture || user.picture;
      user.lastLoginAt = new Date();
      await user.save();
    }

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
   * Development-only login bypass for test fixtures.
   */
  public static async devLogin(email: string, name?: string, role?: UserRole): Promise<{ user: IUser; token: string }> {
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
        isActive: true,
        lastLoginAt: new Date(),
      });
      await user.save();
    } else {
      if (role && user.role !== role) {
        user.role = role;
      }
      user.lastLoginAt = new Date();
      await user.save();
    }

    const token = this.generateToken(user);
    return { user, token };
  }
}
