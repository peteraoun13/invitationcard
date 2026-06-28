import {
  apiBaseUrl,
  buildInviteLink,
  getPublicInviteSlug,
  slugifyText,
} from "./config";

export const isFirebaseConfigured = true;

const statusLabels = {
  pending: "Pending setup",
  not_opened: "Not opened",
  opened: "Opened",
  partial: "Partial",
  completed: "Completed",
  declined: "Declined",
};

let csrfToken = "";
let cachedFamilySummaries = null;

const ADMIN_DATA_CHANGED_EVENT = "php-admin-data-changed";

function notifyAdminDataChanged() {
  cachedFamilySummaries = null;
  window.dispatchEvent(new window.Event(ADMIN_DATA_CHANGED_EVENT));
}

function toTimestamp(value) {
  if (!value) {
    return null;
  }

  const normalizedValue =
    typeof value === "string" && value.includes(" ")
      ? value.replace(" ", "T")
      : value;
  const millis = new Date(normalizedValue).getTime();

  if (!Number.isFinite(millis)) {
    return null;
  }

  return {
    toDate: () => new Date(millis),
    toMillis: () => millis,
  };
}

function timestampToMillis(value) {
  return value?.toMillis?.() || 0;
}

function normalizeFamily(family) {
  return {
    id: String(family.id || family.inviteToken || ""),
    familyName: family.familyName || family.family_name || "",
    inviteToken: family.inviteToken || family.invite_token || "",
    publicSlug: family.publicSlug || family.public_slug || "",
    status: family.status || "",
    openedAt: toTimestamp(family.openedAt || family.opened_at),
    createdAt: toTimestamp(family.createdAt || family.created_at),
    updatedAt: toTimestamp(family.updatedAt || family.updated_at),
  };
}

function normalizeGuest(guest) {
  const attending =
    typeof guest.attending === "boolean"
      ? guest.attending
      : guest.attending === 1 || guest.attending === "1"
        ? true
        : guest.attending === 0 || guest.attending === "0"
          ? false
          : null;

  return {
    id: String(guest.id || ""),
    familyId: String(guest.familyId || guest.family_id || ""),
    name: guest.name || guest.guest_name || "",
    guest_name: guest.name || guest.guest_name || "",
    attending,
    responded: Boolean(guest.responded),
    createdAt: toTimestamp(guest.createdAt || guest.created_at),
    updatedAt: toTimestamp(guest.updatedAt || guest.updated_at),
  };
}

function summarizeFamily(family, guests) {
  const confirmed = guests.filter(
    (guest) => guest.responded && guest.attending === true,
  ).length;
  const declined = guests.filter(
    (guest) => guest.responded && guest.attending === false,
  ).length;
  const pending = guests.filter((guest) => !guest.responded).length;
  const latestGuestUpdate = guests.reduce(
    (latest, guest) =>
      Math.max(latest, timestampToMillis(guest.updatedAt || guest.createdAt)),
    0,
  );
  const familyUpdatedAt = timestampToMillis(family.updatedAt || family.createdAt);
  const status =
    guests.length === 0
      ? "pending"
      : pending === 0
        ? confirmed === guests.length
          ? "completed"
          : declined === guests.length
            ? "declined"
            : "partial"
        : confirmed + declined > 0
          ? "partial"
          : family.openedAt || family.status === "opened"
            ? "opened"
            : "not_opened";

  return {
    ...family,
    status,
    publicSlug:
      family.publicSlug ||
      `${slugifyText(family.familyName)}-${family.inviteToken || family.id}`,
    guests,
    guestsCount: guests.length,
    confirmed,
    declined,
    pending,
    invitationStatus: statusLabels[status] || status,
    lastUpdatedMillis: Math.max(
      familyUpdatedAt,
      latestGuestUpdate,
      timestampToMillis(family.openedAt),
    ),
  };
}

async function apiFetch(path, options = {}) {
  const response = await window.fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || payload.message || "Request failed.");
  }

  const data = payload.data ?? payload;

  if (typeof data?.csrfToken === "string") {
    csrfToken = data.csrfToken;
  }

  return data;
}

function createPollingSubscription(loader, onNext, onError, intervalMs = 15000) {
  let isActive = true;
  let isLoading = false;
  let shouldReload = false;
  let timeoutId = null;

  function scheduleNextTick() {
    if (!isActive) {
      return;
    }

    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(tick, intervalMs);
  }

  async function tick() {
    if (!isActive) {
      return;
    }

    window.clearTimeout(timeoutId);

    if (document.hidden) {
      scheduleNextTick();
      return;
    }

    if (isLoading) {
      shouldReload = true;
      return;
    }

    isLoading = true;

    try {
      const result = await loader();

      if (isActive) {
        onNext(result);
      }
    } catch (error) {
      if (isActive) {
        onError?.(error);
      }
    } finally {
      isLoading = false;

      if (shouldReload) {
        shouldReload = false;
        tick();
      } else {
        scheduleNextTick();
      }
    }
  }

  function handleVisibilityChange() {
    if (!document.hidden) {
      tick();
    }
  }

  function handleAdminDataChanged() {
    tick();
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handleAdminDataChanged);
  tick();

  return () => {
    isActive = false;
    window.clearTimeout(timeoutId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handleAdminDataChanged);
  };
}

export async function signInAdmin(email, password) {
  const session = await apiFetch("/auth.php?action=login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  window.dispatchEvent(
    new window.CustomEvent("php-auth-changed", {
      detail: session.user || null,
    }),
  );

  return session;
}

export async function loginDashboard(email, password) {
  return signInAdmin(email, password);
}

export async function signOutAdmin() {
  const result = await apiFetch("/auth.php?action=logout", { method: "POST" });
  csrfToken = "";
  window.dispatchEvent(
    new window.CustomEvent("php-auth-changed", { detail: null }),
  );
  return result;
}

export function onAdminAuthStateChanged(callback) {
  let isActive = true;

  function emitUser(user, error = "") {
    if (!isActive) {
      return;
    }

    callback({
      user: user || null,
      isAdmin: Boolean(user),
      isLoading: false,
      error,
    });
  }

  function handleAuthChanged(event) {
    emitUser(event.detail || null);
  }

  window.addEventListener("php-auth-changed", handleAuthChanged);

  apiFetch("/auth.php?action=me")
    .then((session) => emitUser(session.user || null))
    .catch((error) => emitUser(null, error.message));

  return () => {
    isActive = false;
    window.removeEventListener("php-auth-changed", handleAuthChanged);
  };
}

export async function changePassword(oldPassword, newPassword) {
  return apiFetch("/auth.php?action=change-password", {
    method: "POST",
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export async function fetchFamilySummaries() {
  const data = await apiFetch("/guests.php?action=summaries");

  const families = (data.families || []).map((family) => {
    const normalizedFamily = normalizeFamily(family);
    const guests = (family.guests || []).map(normalizeGuest);
    return summarizeFamily(normalizedFamily, guests);
  });

  cachedFamilySummaries = families;
  return families;
}

export function subscribeFamilySummaries(onNext, onError) {
  if (cachedFamilySummaries) {
    onNext(cachedFamilySummaries);
  }

  return createPollingSubscription(fetchFamilySummaries, onNext, onError);
}

export function subscribeFamilies(onNext, onError) {
  return subscribeFamilySummaries(
    (families) => onNext(families.map(({ guests, ...family }) => family)),
    onError,
  );
}

export function subscribeDashboardStats(onNext, onError) {
  return subscribeFamilySummaries(
    (families) => onNext(getDashboardStatsFromSummaries(families)),
    onError,
  );
}

export function subscribeFamily(familyId, onNext, onError) {
  return createPollingSubscription(
    async () => {
      const data = await apiFetch(
        `/guests.php?action=family&familyId=${encodeURIComponent(familyId)}`,
      );
      return data.family ? normalizeFamily(data.family) : null;
    },
    onNext,
    onError,
  );
}

export function subscribeGuests(familyId, onNext, onError) {
  return createPollingSubscription(
    async () => {
      const data = await apiFetch(
        `/guests.php?action=guests&familyId=${encodeURIComponent(familyId)}`,
      );
      return (data.guests || []).map(normalizeGuest);
    },
    onNext,
    onError,
  );
}

export function getDashboardStatsFromSummaries(familySummaries) {
  const guests = familySummaries.flatMap((family) => family.guests || []);

  return {
    totalFamilies: familySummaries.length,
    totalGuests: guests.length,
    attending: guests.filter((guest) => guest.responded && guest.attending === true)
      .length,
    notAttending: guests.filter(
      (guest) => guest.responded && guest.attending === false,
    ).length,
    pending: guests.filter((guest) => !guest.responded).length,
  };
}

export async function createFamilyWithGuests(
  familyName,
  guestNames = [],
  { notify = true } = {},
) {
  const data = await apiFetch("/guests.php?action=create-family", {
    method: "POST",
    body: JSON.stringify({ familyName, guests: guestNames }),
  });

  if (notify) {
    notifyAdminDataChanged();
  }

  return data.inviteToken;
}

export async function createFamily(familyName) {
  return createFamilyWithGuests(familyName, []);
}

export async function updateFamilyName(familyId, familyName) {
  const result = await apiFetch("/guests.php?action=update-family", {
    method: "POST",
    body: JSON.stringify({ familyId, familyName }),
  });
  notifyAdminDataChanged();
  return result;
}

export async function deleteFamily(familyId) {
  const result = await apiFetch("/guests.php?action=delete-family", {
    method: "POST",
    body: JSON.stringify({ familyId }),
  });
  notifyAdminDataChanged();
  return result;
}

export async function addGuest(familyId, guestName) {
  const result = await apiFetch("/guests.php?action=add-guest", {
    method: "POST",
    body: JSON.stringify({ familyId, guestName }),
  });
  notifyAdminDataChanged();
  return result;
}

export async function updateGuestName(familyId, guestId, guestName) {
  const result = await apiFetch("/guests.php?action=update-guest", {
    method: "POST",
    body: JSON.stringify({ familyId, guestId, guestName }),
  });
  notifyAdminDataChanged();
  return result;
}

export async function updateGuestRsvpStatus(familyId, guestId, status) {
  const result = await apiFetch("/guests.php?action=update-guest-rsvp", {
    method: "POST",
    body: JSON.stringify({ familyId, guestId, status }),
  });
  notifyAdminDataChanged();
  return result;
}

export async function deleteGuest(familyId, guestId) {
  const result = await apiFetch("/guests.php?action=delete-guest", {
    method: "POST",
    body: JSON.stringify({ familyId, guestId }),
  });
  notifyAdminDataChanged();
  return result;
}

export async function importFamiliesWithGuests(importFamilies) {
  const result = {
    familiesCreated: 0,
    guestsCreated: 0,
    duplicateFamilies: [],
    duplicateGuests: [],
    errors: [],
  };

  for (const family of importFamilies) {
    try {
      await createFamilyWithGuests(family.familyName, family.guests, {
        notify: false,
      });
      result.familiesCreated += 1;
      result.guestsCreated += family.guests.length;
    } catch (error) {
      result.errors.push(`${family.familyName}: ${error.message}`);
    }
  }

  if (result.familiesCreated > 0) {
    notifyAdminDataChanged();
  }

  return result;
}

export async function getInviteByToken(inviteSlug) {
  const data = await apiFetch(`/rsvp.php?token=${encodeURIComponent(inviteSlug)}`);

  if (!data.family) {
    return null;
  }

  return {
    family: normalizeFamily(data.family),
    guests: (data.guests || []).map(normalizeGuest),
    hasSubmittedRsvp: Boolean(data.hasSubmittedRsvp),
  };
}

export async function submitFamilyRsvp({
  familyId,
  inviteToken,
  guests,
  responses,
}) {
  const data = await apiFetch("/rsvp.php?action=submit", {
    method: "POST",
    body: JSON.stringify({
      familyId,
      inviteToken,
      guests,
      responses,
    }),
  });

  notifyAdminDataChanged();

  return {
    submissionId: data.submissionId,
    responses: data.responses || [],
  };
}

export async function submitRSVP(data) {
  return submitFamilyRsvp(data);
}

export async function uploadGuestMedia(files, guestToken) {
  const formData = new FormData();

  Array.from(files || []).forEach((file) => {
    formData.append("files[]", file);
  });
  formData.append("guestToken", guestToken);

  return apiFetch("/uploads.php?action=upload", {
    method: "POST",
    body: formData,
  });
}

export async function getDashboardUploads() {
  const data = await apiFetch("/dashboard.php?action=uploads");
  return data.uploads || [];
}

export async function getFamilyOnce(familyId) {
  const data = await apiFetch(
    `/guests.php?action=family&familyId=${encodeURIComponent(familyId)}`,
  );
  return data.family ? normalizeFamily(data.family) : null;
}

export function generateInviteToken() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const values = new Uint32Array(7);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

export async function regenerateFamilyInviteToken() {
  throw new Error("Regenerating PHP invite tokens is not enabled yet.");
}

export function sortFamiliesByDate(families) {
  return [...families].sort(
    (a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt),
  );
}

export { buildInviteLink, getPublicInviteSlug };
