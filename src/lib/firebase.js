import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.entries(firebaseConfig)
  .filter(([key]) => key !== "storageBucket")
  .every(([, value]) => Boolean(value));

export const siteUrl = (
  import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin
).replace(/\/$/, "");

export function slugifyText(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "family";
}

export function getPublicInviteSlug(familyOrToken, familyName = "") {
  if (typeof familyOrToken === "object" && familyOrToken) {
    if (familyOrToken.publicSlug) {
      return familyOrToken.publicSlug;
    }

    const inviteToken = familyOrToken.inviteToken || familyOrToken.id || "";

    if (String(inviteToken).includes("-")) {
      return inviteToken;
    }

    return `${slugifyText(familyOrToken.familyName || familyName)}-${inviteToken}`;
  }

  const inviteToken = String(familyOrToken || "");

  if (inviteToken.includes("-")) {
    return inviteToken;
  }

  return `${slugifyText(familyName)}-${inviteToken}`;
}

export function buildInviteLink(familyOrToken, familyName = "") {
  return `${siteUrl}/invite/${getPublicInviteSlug(familyOrToken, familyName)}`;
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
