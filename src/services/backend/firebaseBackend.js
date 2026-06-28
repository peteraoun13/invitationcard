import { signInAdmin as firebaseSignInAdmin } from "../../lib/auth";
import { submitFamilyRsvp as firebaseSubmitFamilyRsvp } from "../../lib/rsvp";

export {
  signInAdmin,
  signOutAdmin,
  onAdminAuthStateChanged,
} from "../../lib/auth";

export {
  addGuest,
  createFamily,
  createFamilyWithGuests,
  deleteFamily,
  deleteGuest,
  generateInviteToken,
  getDashboardStatsFromSummaries,
  getFamilyOnce,
  importFamiliesWithGuests,
  regenerateFamilyInviteToken,
  sortFamiliesByDate,
  subscribeDashboardStats,
  subscribeFamilies,
  subscribeFamily,
  subscribeFamilySummaries,
  subscribeGuests,
  updateFamilyName,
  updateGuestName,
  updateGuestRsvpStatus,
} from "../../lib/families";

export { getInviteByToken, submitFamilyRsvp } from "../../lib/rsvp";
export { buildInviteLink, getPublicInviteSlug, isFirebaseConfigured } from "../../lib/firebase";

export async function loginDashboard(email, password) {
  return firebaseSignInAdmin(email, password);
}

export async function submitRSVP(data) {
  return firebaseSubmitFamilyRsvp(data);
}

export async function uploadGuestMedia() {
  throw new Error(
    "Firebase media uploads are not configured in this project yet. Switch to PHP or add Firebase Storage support.",
  );
}

export async function getDashboardUploads() {
  return [];
}

export async function changePassword() {
  throw new Error("Password changes are handled in Firebase Console for this backend.");
}
