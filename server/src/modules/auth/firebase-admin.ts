import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { env } from '../../common/config/env';
import { logger } from '../../common/utils/logger';
import { UnauthorizedError } from '../../common/errors/app-error';

let firebaseApp: App | null = null;

export interface VerifiedFirebaseToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export type TokenVerifier = (idToken: string) => Promise<VerifiedFirebaseToken>;

let customVerifier: TokenVerifier | null = null;

/**
 * Injects a custom verifier for unit testing and offline development.
 */
export function setFirebaseTokenVerifier(verifier: TokenVerifier | null): void {
  customVerifier = verifier;
}

/**
 * Initializes or returns the singleton Firebase Admin app.
 */
export function getFirebaseAdminApp(): App {
  if (firebaseApp) return firebaseApp;

  const existing = getApps();
  if (existing.length > 0 && existing[0]) {
    firebaseApp = existing[0];
    return firebaseApp;
  }

  // 1. Check if raw JSON string is provided in env
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });
      logger.info('Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_JSON');
      return firebaseApp;
    } catch (err) {
      logger.error(err, 'Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON');
    }
  }

  // 2. Check if file path is provided in env
  if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const resolvedPath = path.isAbsolute(env.FIREBASE_SERVICE_ACCOUNT_PATH)
        ? env.FIREBASE_SERVICE_ACCOUNT_PATH
        : path.resolve(process.cwd(), env.FIREBASE_SERVICE_ACCOUNT_PATH);

      if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        const serviceAccount = JSON.parse(fileContent);
        firebaseApp = initializeApp({
          credential: cert(serviceAccount),
        });
        logger.info({ resolvedPath }, 'Firebase Admin initialized from service account file');
        return firebaseApp;
      } else {
        logger.warn({ resolvedPath }, 'Firebase service account file not found at path');
      }
    } catch (err) {
      logger.error(err, 'Failed to initialize Firebase Admin from service account file path');
    }
  }

  // 3. Fallback for offline dev and test suites
  try {
    firebaseApp = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'fixify-dev',
    });
    logger.info('Firebase Admin initialized with default project ID');
    return firebaseApp;
  } catch (err) {
    logger.warn(err, 'Firebase Admin default initialization fallback');
    const apps = getApps();
    if (apps.length > 0 && apps[0]) {
      firebaseApp = apps[0];
      return firebaseApp;
    }
    throw err;
  }
}

/**
 * Verifies a Firebase ID token.
 * Passes checkRevoked = true to invalidate tokens after logout or password reset.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken> {
  // Use mock verifier if injected (e.g., during tests)
  if (customVerifier) {
    return customVerifier(idToken);
  }

  try {
    const app = getFirebaseAdminApp();
    const auth = getAuth(app);
    // checkRevoked = true
    const decoded = await auth.verifyIdToken(idToken, true);
    return {
      uid: decoded.uid,
      email: decoded.email,
      email_verified: decoded.email_verified,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'auth/id-token-revoked') {
      throw new UnauthorizedError('Session token has been revoked. Please sign in again.');
    }
    if (error.code === 'auth/id-token-expired') {
      throw new UnauthorizedError('Session token has expired. Please sign in again.');
    }
    throw new UnauthorizedError(error.message || 'Invalid or unverifiable authentication token.');
  }
}
