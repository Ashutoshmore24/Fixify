import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/axios';
import { User, UserRole } from '../types';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  firebaseSignOut,
  FirebaseUser,
} from '../lib/firebase';
import { requestVerificationEmail } from '../lib/email-verification';

export interface RegisterProfileData {
  role: 'STUDENT' | 'FACULTY';
  firstName: string;
  lastName: string;
  course?: string;
  year?: 'FE' | 'SE' | 'TE' | 'BE' | 'ME_1' | 'ME_2' | 'PHD';
  division?: string;
  prn?: string;
  department?: string;
  employeeId?: string;
}

export interface AuthResponseResult {
  user: User;
  requiresProfileCompletion?: boolean;
  isPendingApproval?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithEmailPassword: (email: string, password: string) => Promise<AuthResponseResult>;
  loginWithGoogle: (idToken?: string) => Promise<AuthResponseResult>;
  registerWithEmailPassword: (
    email: string,
    password: string,
    profileData: RegisterProfileData
  ) => Promise<FirebaseUser | void>;
  registerProfile: (data: RegisterProfileData) => Promise<{ user: User; isPendingApproval: boolean }>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  devLogin: (email: string, role?: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.data) {
        setUser(res.data.data.user || res.data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [refreshUser]);

  const loginWithEmailPassword = async (
    email: string,
    password: string
  ): Promise<AuthResponseResult> => {
    if (import.meta.env.VITE_AUTH_MODE === 'local') {
      const res = await api.post('/auth/password', { email, password });
      const localUser: User = res.data.data.user;
      setUser(localUser);
      return { user: localUser, requiresProfileCompletion: !localUser.profileComplete, isPendingApproval: localUser.approvalStatus === 'PENDING_APPROVAL' };
    }
    // 1. Authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // 2. Check email verification status
    if (!userCredential.user.emailVerified) {
      const unverifiedError = new Error('Institutional email address has not been verified.');
      (unverifiedError as unknown as { code: string }).code = 'auth/unverified-email';
      throw unverifiedError;
    }

    // 3. Obtain Firebase ID token & exchange with backend session cookie
    const idToken = await userCredential.user.getIdToken();
    const res = await api.post('/auth/session', { idToken });
    const responseData = res.data.data;
    const authenticatedUser: User = responseData.user;
    setUser(authenticatedUser);

    // 4. If pending profile exists in session storage and profile is incomplete, submit it
    const storedPending = sessionStorage.getItem('fixify_pending_profile');
    if (storedPending && !authenticatedUser.profileComplete) {
      try {
        const parsedProfile = JSON.parse(storedPending) as RegisterProfileData;
        const profileRes = await api.post('/auth/register-profile', parsedProfile);
        sessionStorage.removeItem('fixify_pending_profile');
        const updatedUser = profileRes.data.data.user;
        setUser(updatedUser);
        return {
          user: updatedUser,
          requiresProfileCompletion: false,
          isPendingApproval: updatedUser.approvalStatus === 'PENDING_APPROVAL',
        };
      } catch {
        // Fall back to manual completion if automated registration fails
      }
    }

    return {
      user: authenticatedUser,
      requiresProfileCompletion: !authenticatedUser.profileComplete,
      isPendingApproval: authenticatedUser.approvalStatus === 'PENDING_APPROVAL',
    };
  };

  const loginWithGoogle = async (idTokenParam?: string): Promise<AuthResponseResult> => {
    let idToken = idTokenParam;
    if (!idToken) {
      const cred = await signInWithPopup(auth, googleProvider);
      idToken = await cred.user.getIdToken();
    }

    const res = await api.post('/auth/session', { idToken });
    const responseData = res.data.data;
    const authenticatedUser: User = responseData.user;
    setUser(authenticatedUser);

    return {
      user: authenticatedUser,
      requiresProfileCompletion: !authenticatedUser.profileComplete,
      isPendingApproval: authenticatedUser.approvalStatus === 'PENDING_APPROVAL',
    };
  };

  const registerWithEmailPassword = async (
    email: string,
    password: string,
    profileData: RegisterProfileData
  ): Promise<FirebaseUser | void> => {
    if (import.meta.env.VITE_AUTH_MODE === 'local') {
      await api.post('/auth/local-register', { email, password, profile: profileData });
      return;
    }
    // 1. Create Firebase user
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Save the profile before sending: an email-delivery failure must not lose registration data.
    sessionStorage.setItem('fixify_pending_profile', JSON.stringify({ ...profileData, email }));
    const redirect = new URLSearchParams(window.location.search).get('redirect') || '/report';
    try {
      await requestVerificationEmail(cred.user, redirect);
    } catch {
      // The account exists. The verification page displays the saved delivery error and retry time.
    }

    return cred.user;
  };

  const registerProfile = async (
    data: RegisterProfileData
  ): Promise<{ user: User; isPendingApproval: boolean }> => {
    const res = await api.post('/auth/register-profile', data);
    sessionStorage.removeItem('fixify_pending_profile');
    const updatedUser = res.data.data.user;
    setUser(updatedUser);
    return {
      user: updatedUser,
      isPendingApproval: updatedUser.approvalStatus === 'PENDING_APPROVAL',
    };
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendEmailVerification = async (): Promise<void> => {
    if (auth.currentUser) {
      await requestVerificationEmail(auth.currentUser);
    } else {
      throw new Error('No user is currently active to send verification email.');
    }
  };

  const devLogin = async (email: string, role?: UserRole): Promise<User> => {
    const res = await api.post('/auth/dev-login', { email, role });
    const userData = res.data.data.user;
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore firebase errors on sign out
    }
    sessionStorage.removeItem('fixify_pending_profile');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithEmailPassword,
        loginWithGoogle,
        registerWithEmailPassword,
        registerProfile,
        sendPasswordReset,
        resendEmailVerification,
        devLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
