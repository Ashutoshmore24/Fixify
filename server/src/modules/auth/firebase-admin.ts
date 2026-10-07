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
      if (typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });
      logger.info(
        { projectId: serviceAccount.project_id },
        'Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_JSON'
      );
      return firebaseApp;
    } catch (err) {
      logger.error(err, 'Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON');
    }
  }

  // 2. Check candidate service account file paths
  const candidatePaths = [
    env.FIREBASE_SERVICE_ACCOUNT_PATH,
    './serviceAccountKey.json',
    'serviceAccountKey.json',
    path.resolve(__dirname, '../../../serviceAccountKey.json'),
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(process.cwd(), 'server', 'serviceAccountKey.json'),
  ].filter(Boolean) as string[];

  for (const candidate of candidatePaths) {
    try {
      const resolvedPath = path.isAbsolute(candidate)
        ? candidate
        : path.resolve(process.cwd(), candidate);

      if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        const serviceAccount = JSON.parse(fileContent);
        if (typeof serviceAccount.private_key === 'string') {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        firebaseApp = initializeApp({
          credential: cert(serviceAccount),
        });
        logger.info(
          { resolvedPath, projectId: serviceAccount.project_id },
          'Firebase Admin successfully initialized from service account'
        );
        return firebaseApp;
      }
    } catch (err) {
      logger.error({ err, candidate }, 'Failed to initialize Firebase Admin from service account file');
    }
  }

  // 3. Fallback for offline dev and test suites
  // NOTE: Without a real service account, verifyIdToken() will fail. This
  // fallback only prevents the app from crashing on startup so dev-login and
  // test fixtures still work.
  const projectId = process.env.FIREBASE_PROJECT_ID || 'fixify-2026';
  try {
    firebaseApp = initializeApp({ projectId });
    logger.warn(
      { projectId },
      'Firebase Admin initialized WITHOUT service account credentials. ' +
      'Google sign-in and email/password login will fail because ID token ' +
      'verification requires a valid service account. Set FIREBASE_SERVICE_ACCOUNT_PATH ' +
      'or FIREBASE_SERVICE_ACCOUNT_JSON in your .env file.'
    );
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
    // Handle missing credentials / misconfigured Firebase Admin
    if (
      error.code === 'auth/invalid-credential' ||
      error.message?.includes('no matching kid') ||
      error.message?.includes('credential') ||
      error.message?.includes('INVALID_ARGUMENT')
    ) {
      logger.error(
        { code: error.code },
        'Firebase Admin cannot verify ID tokens. Ensure FIREBASE_SERVICE_ACCOUNT_PATH or ' +
        'FIREBASE_SERVICE_ACCOUNT_JSON is correctly configured in your server .env file.'
      );
      throw new UnauthorizedError(
        'Server authentication is misconfigured. Please contact the administrator.',
        'AUTH_MISCONFIGURED'
      );
    }
    throw new UnauthorizedError(error.message || 'Invalid or unverifiable authentication token.');
  }
}
