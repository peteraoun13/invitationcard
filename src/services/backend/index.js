import { backendProvider } from "./config";
import * as firebaseBackend from "./firebaseBackend";
import * as phpBackend from "./phpBackend";

const backend = backendProvider === "php" ? phpBackend : firebaseBackend;

export { backendProvider };

export const isFirebaseConfigured =
  backendProvider === "php" ? true : firebaseBackend.isFirebaseConfigured;
export const isBackendConfigured = isFirebaseConfigured;

export const addGuest = (...args) => backend.addGuest(...args);
export const buildInviteLink = (...args) => backend.buildInviteLink(...args);
export const changePassword = (...args) => backend.changePassword(...args);
export const createFamily = (...args) => backend.createFamily(...args);
export const createFamilyWithGuests = (...args) =>
  backend.createFamilyWithGuests(...args);
export const deleteFamily = (...args) => backend.deleteFamily(...args);
export const deleteGuest = (...args) => backend.deleteGuest(...args);
export const generateInviteToken = (...args) => backend.generateInviteToken(...args);
export const getDashboardStatsFromSummaries = (...args) =>
  backend.getDashboardStatsFromSummaries(...args);
export const getDashboardUploads = (...args) => backend.getDashboardUploads(...args);
export const getFamilyOnce = (...args) => backend.getFamilyOnce(...args);
export const getInviteByToken = (...args) => backend.getInviteByToken(...args);
export const getPublicInviteSlug = (...args) => backend.getPublicInviteSlug(...args);
export const importFamiliesWithGuests = (...args) =>
  backend.importFamiliesWithGuests(...args);
export const loginDashboard = (...args) => backend.loginDashboard(...args);
export const onAdminAuthStateChanged = (...args) =>
  backend.onAdminAuthStateChanged(...args);
export const regenerateFamilyInviteToken = (...args) =>
  backend.regenerateFamilyInviteToken(...args);
export const signInAdmin = (...args) => backend.signInAdmin(...args);
export const signOutAdmin = (...args) => backend.signOutAdmin(...args);
export const sortFamiliesByDate = (...args) => backend.sortFamiliesByDate(...args);
export const submitFamilyRsvp = (...args) => backend.submitFamilyRsvp(...args);
export const submitRSVP = (...args) => backend.submitRSVP(...args);
export const subscribeDashboardStats = (...args) =>
  backend.subscribeDashboardStats(...args);
export const subscribeFamilies = (...args) => backend.subscribeFamilies(...args);
export const subscribeFamily = (...args) => backend.subscribeFamily(...args);
export const subscribeFamilySummaries = (...args) =>
  backend.subscribeFamilySummaries(...args);
export const subscribeGuests = (...args) => backend.subscribeGuests(...args);
export const updateFamilyName = (...args) => backend.updateFamilyName(...args);
export const updateGuestName = (...args) => backend.updateGuestName(...args);
export const updateGuestRsvpStatus = (...args) =>
  backend.updateGuestRsvpStatus(...args);
export const uploadGuestMedia = (...args) => backend.uploadGuestMedia(...args);
