import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/keep',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface KeepNoteResource {
  name: string;
  title?: string;
  createTime?: string;
  updateTime?: string;
  trashed?: boolean;
  body?: {
    text?: {
      text?: string;
    };
  };
}

/**
 * Lists notes from Google Keep API (https://keep.googleapis.com/v1/notes)
 */
export async function listGoogleKeepNotes(): Promise<KeepNoteResource[]> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Authentication required. Please sign in with Google first.');
  }

  const res = await fetch('https://keep.googleapis.com/v1/notes?pageSize=25', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const message =
      errBody?.error?.message ||
      `Google Keep API returned HTTP ${res.status}. Note: keep.googleapis.com requires a Google Workspace Enterprise account with Keep API enabled.`;
    throw new Error(message);
  }

  const data = await res.json();
  return data.notes || [];
}

/**
 * Creates a new note in Google Keep API (https://keep.googleapis.com/v1/notes)
 */
export async function createGoogleKeepNote(
  title: string,
  textBody: string
): Promise<KeepNoteResource> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Authentication required. Please sign in with Google first.');
  }

  const res = await fetch('https://keep.googleapis.com/v1/notes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title.slice(0, 999),
      body: {
        text: {
          text: textBody.slice(0, 19999),
        },
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const message =
      errBody?.error?.message ||
      `Google Keep API returned HTTP ${res.status}. Note: keep.googleapis.com requires a Google Workspace Enterprise account.`;
    throw new Error(message);
  }

  return await res.json();
}

/**
 * Deletes a note from Google Keep API (https://keep.googleapis.com/v1/{name})
 * Must ONLY be called after explicit user confirmation!
 */
export async function deleteGoogleKeepNote(resourceName: string): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Authentication required. Please sign in with Google first.');
  }

  const res = await fetch(`https://keep.googleapis.com/v1/${resourceName}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const message =
      errBody?.error?.message ||
      `Failed to delete note from Google Keep (HTTP ${res.status}).`;
    throw new Error(message);
  }
}
