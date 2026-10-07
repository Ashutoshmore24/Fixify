import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dummy-dev-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fixify-dev.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fixify-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_PROJECT_ID
    ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`
    : 'fixify-dev.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

// Initialize Firebase singleton
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Translates Firebase Auth & API error codes into friendly, institutional messages.
 */
export function getFriendlyAuthErrorMessage(err: unknown): string {
  const error = err as {
    code?: string;
    message?: string;
    response?: { data?: { error?: { message?: string; code?: string } } };
  };

  // Backend API response errors take precedence
  if (error?.response?.data?.error) {
    const apiErr = error.response.data.error;
    if (apiErr.code === 'UNVERIFIED_EMAIL') {
      return 'Please verify your institutional email address before signing in.';
    }
    if (apiErr.code === 'UNAUTHORIZED_DOMAIN') {
      return apiErr.message || 'Access denied: Only authorized institutional email domains (@pccoe.org) are permitted.';
    }
    if (apiErr.code === 'DUPLICATE_PRN') {
      return 'A student with this PRN is already registered in the system.';
    }
    if (apiErr.code === 'INVALID_PRN') {
      return apiErr.message || 'PRN format is invalid. Please check your institutional registration number.';
    }
    if (apiErr.message) {
      return apiErr.message;
    }
  }

  const code = error?.code || '';
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password. Please verify your credentials and try again.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/email-already-in-use':
      return 'This institutional email is already in use. Please sign in or reset your password.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing. Please try again.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Access temporarily restricted. Please try again in a few minutes.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 8 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid institutional email address.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password under Authentication > Sign-in method in the Firebase Console.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Console. Please add your domain to Authorized Domains under Firebase Authentication settings.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email address using a different sign-in method. Please sign in with Google or use password reset.';
    default:
      return error?.message || 'An unexpected authentication error occurred. Please try again.';
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  firebaseSignOut,
};
export type { FirebaseUser };
