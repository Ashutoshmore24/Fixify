import { auth, FirebaseUser, getFriendlyAuthErrorMessage, sendEmailVerification } from './firebase';

export interface VerificationDelivery {
  nextAllowedAt: number;
  lastSentAt: number;
  error: string | null;
}

const requestsInProgress = new Set<string>();
const storageKey = (email: string) => `fixify_verification:${auth.app.options.projectId}:${email.trim().toLowerCase()}`;

export function getVerificationDelivery(email: string): VerificationDelivery {
  try {
    const state = JSON.parse(localStorage.getItem(storageKey(email)) || 'null');
    if (state && Number.isFinite(state.nextAllowedAt) && Number.isFinite(state.lastSentAt)) {
      return { nextAllowedAt: state.nextAllowedAt, lastSentAt: state.lastSentAt, error: typeof state.error === 'string' ? state.error : null };
    }
  } catch { /* Storage may be unavailable in private browsing. */ }
  return { nextAllowedAt: 0, lastSentAt: 0, error: null };
}

function saveDelivery(email: string, state: VerificationDelivery): void {
  try { localStorage.setItem(storageKey(email), JSON.stringify(state)); } catch { /* Continue when storage is unavailable. */ }
}

export function getVerificationErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/too-many-requests' || code === 'auth/quota-exceeded') {
    return 'Firebase is temporarily limiting verification emails. Wait before requesting another link. Check your inbox and spam folder for an earlier email; its link may still work.';
  }
  if (code === 'auth/verification-cooldown') return 'Please wait for the resend countdown before requesting another email.';
  return getFriendlyAuthErrorMessage(error);
}

export function safeVerificationRedirect(redirect: string | null): string {
  return redirect && redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.includes('\\') && !redirect.split('?')[0].includes(':')
    ? redirect : '/report';
}

export async function requestVerificationEmail(user: FirebaseUser, redirect = '/report'): Promise<void> {
  if (!user.email) throw new Error('Sign in with your email address before requesting verification.');
  if (user.emailVerified) return;
  const state = getVerificationDelivery(user.email);
  if (requestsInProgress.has(user.uid) || state.nextAllowedAt > Date.now()) {
    throw Object.assign(new Error('Verification resend cooldown is active'), { code: 'auth/verification-cooldown' });
  }
  requestsInProgress.add(user.uid);
  saveDelivery(user.email, { ...state, nextAllowedAt: Date.now() + 60_000, error: null });
  const returnUrl = new URL('/verify-email', window.location.origin);
  returnUrl.searchParams.set('email', user.email);
  returnUrl.searchParams.set('redirect', safeVerificationRedirect(redirect));
  try {
    await sendEmailVerification(user, { url: returnUrl.toString(), handleCodeInApp: false });
    saveDelivery(user.email, { nextAllowedAt: Date.now() + 60_000, lastSentAt: Date.now(), error: null });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const delay = code === 'auth/too-many-requests' || code === 'auth/quota-exceeded' ? 300_000 : 60_000;
    saveDelivery(user.email, { ...state, nextAllowedAt: Date.now() + delay, error: getVerificationErrorMessage(error) });
    throw error;
  } finally {
    requestsInProgress.delete(user.uid);
  }
}
