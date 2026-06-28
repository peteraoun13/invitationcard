import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { slugifyText } from "./firebase";

const randomAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function slugifyFamilyName(familyName) {
  return slugifyText(familyName);
}

function randomSuffix(length = 7) {
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);

  return Array.from(values, (value) => randomAlphabet[value % randomAlphabet.length]).join(
    "",
  );
}

export function generateInviteToken() {
  return randomSuffix();
}

function getStoredPublicSlug(familyName, inviteToken, existingPublicSlug) {
  if (existingPublicSlug) {
    return existingPublicSlug;
  }

  if (String(inviteToken).includes("-")) {
    return inviteToken;
  }

  return `${slugifyFamilyName(familyName)}-${inviteToken}`;
}

function getInitialFamilyStatus(guestCount) {
  return guestCount > 0 ? "not_opened" : "pending";
}

function getStatusFromFamilyAndGuests(family, guests) {
  if (guests.length === 0) {
    return "pending";
  }

  const respondedCount = guests.filter((guest) => guest.responded).length;

  if (respondedCount === guests.length) {
    const attendingCount = guests.filter((guest) => guest.attending === true).length;

    if (attendingCount === guests.length) {
      return "completed";
    }

    return attendingCount === 0 ? "declined" : "partial";
  }

  if (respondedCount > 0) {
    return "partial";
  }

  return family.openedAt || family.status === "opened" ? "opened" : "not_opened";
}

async function updateFamilyStatusFromGuests(familyId) {
  const familyRef = doc(db, "families", familyId);
  const familySnapshot = await getDoc(familyRef);

  if (!familySnapshot.exists()) {
    return;
  }

  const guestsSnapshot = await getDocs(collection(db, "families", familyId, "guests"));
  const guests = guestsSnapshot.docs.map(normalizeGuest);
  const family = normalizeFamily(familySnapshot);

  await updateDoc(familyRef, {
    status: getStatusFromFamilyAndGuests(family, guests),
    updatedAt: serverTimestamp(),
  });
}

async function createUniqueInviteToken() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const inviteToken = generateInviteToken();
    const familySnapshot = await getDoc(doc(db, "families", inviteToken));

    if (!familySnapshot.exists()) {
      return inviteToken;
    }
  }

  throw new Error("Could not create a unique invite token. Please try again.");
}

function timestampToMillis(value) {
  return value?.toMillis?.() || 0;
}

function normalizeFamily(documentSnapshot) {
  const data = documentSnapshot.data();
  const inviteToken = data.inviteToken || documentSnapshot.id;
  const publicSlug = getStoredPublicSlug(
    data.familyName || "",
    inviteToken,
    data.publicSlug,
  );

  return {
    id: documentSnapshot.id,
    familyName: data.familyName || "",
    inviteToken,
    publicSlug,
    status: data.status || "",
    openedAt: data.openedAt || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

function normalizeGuest(documentSnapshot) {
  const data = documentSnapshot.data();

  return {
    id: documentSnapshot.id,
    name: data.name || "",
    guest_name: data.name || "",
    attending: typeof data.attending === "boolean" ? data.attending : null,
    responded: Boolean(data.responded),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export function subscribeFamilies(onNext, onError) {
  const familiesQuery = query(collection(db, "families"), orderBy("createdAt", "desc"));

  return onSnapshot(
    familiesQuery,
    (snapshot) => {
      onNext(snapshot.docs.map(normalizeFamily));
    },
    onError,
  );
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
  const hasResponses = confirmed + declined > 0;
  const status =
    guests.length === 0
      ? "pending"
      : pending === 0
        ? confirmed === guests.length
          ? "completed"
          : declined === guests.length
            ? "declined"
            : "partial"
        : hasResponses
          ? "partial"
          : family.openedAt || family.status === "opened"
            ? "opened"
            : "not_opened";
  const statusLabels = {
    pending: "Pending setup",
    not_opened: "Not opened",
    opened: "Opened",
    partial: "Partial",
    completed: "Completed",
    declined: "Declined",
  };

  return {
    ...family,
    status,
    publicSlug: getStoredPublicSlug(family.familyName, family.inviteToken, family.publicSlug),
    guests,
    guestsCount: guests.length,
    confirmed,
    declined,
    pending,
    invitationStatus: statusLabels[status],
    lastUpdatedMillis: Math.max(
      familyUpdatedAt,
      latestGuestUpdate,
      timestampToMillis(family.openedAt),
    ),
  };
}

export function subscribeFamilySummaries(onNext, onError) {
  let families = [];
  let guests = [];
  let hasFamiliesLoaded = false;
  let hasGuestsLoaded = false;

  function emit() {
    if (!hasFamiliesLoaded || !hasGuestsLoaded) {
      return;
    }

    const guestsByFamilyId = guests.reduce((groups, guest) => {
      const familyGuests = groups.get(guest.familyId) || [];
      familyGuests.push(guest);
      groups.set(guest.familyId, familyGuests);
      return groups;
    }, new Map());

    onNext(
      families.map((family) =>
        summarizeFamily(family, guestsByFamilyId.get(family.id) || []),
      ),
    );
  }

  const unsubscribeFamilies = onSnapshot(
    query(collection(db, "families"), orderBy("createdAt", "desc")),
    (snapshot) => {
      families = snapshot.docs.map(normalizeFamily);
      hasFamiliesLoaded = true;
      emit();
    },
    onError,
  );

  const unsubscribeGuests = onSnapshot(
    collectionGroup(db, "guests"),
    (snapshot) => {
      guests = snapshot.docs.map((guestSnapshot) => {
        const guest = normalizeGuest(guestSnapshot);

        return {
          ...guest,
          familyId: guestSnapshot.ref.parent.parent?.id || "",
        };
      });
      hasGuestsLoaded = true;
      emit();
    },
    onError,
  );

  return () => {
    unsubscribeFamilies();
    unsubscribeGuests();
  };
}

export function getDashboardStatsFromSummaries(familySummaries) {
  const guests = familySummaries.flatMap((family) => family.guests);

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

export function subscribeFamily(familyId, onNext, onError) {
  return onSnapshot(
    doc(db, "families", familyId),
    (snapshot) => {
      onNext(snapshot.exists() ? normalizeFamily(snapshot) : null);
    },
    onError,
  );
}

export function subscribeGuests(familyId, onNext, onError) {
  const guestsQuery = query(
    collection(db, "families", familyId, "guests"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(
    guestsQuery,
    (snapshot) => {
      onNext(snapshot.docs.map(normalizeGuest));
    },
    onError,
  );
}

export function subscribeDashboardStats(onNext, onError) {
  let totalFamilies = 0;
  let guests = [];
  let hasFamiliesLoaded = false;
  let hasGuestsLoaded = false;

  function emit() {
    if (!hasFamiliesLoaded || !hasGuestsLoaded) {
      return;
    }

    onNext({
      totalFamilies,
      totalGuests: guests.length,
      attending: guests.filter((guest) => guest.responded && guest.attending === true)
        .length,
      notAttending: guests.filter(
        (guest) => guest.responded && guest.attending === false,
      ).length,
      pending: guests.filter((guest) => !guest.responded).length,
    });
  }

  const unsubscribeFamilies = onSnapshot(
    collection(db, "families"),
    (snapshot) => {
      totalFamilies = snapshot.size;
      hasFamiliesLoaded = true;
      emit();
    },
    onError,
  );

  const unsubscribeGuests = onSnapshot(
    collectionGroup(db, "guests"),
    (snapshot) => {
      guests = snapshot.docs.map(normalizeGuest);
      hasGuestsLoaded = true;
      emit();
    },
    onError,
  );

  return () => {
    unsubscribeFamilies();
    unsubscribeGuests();
  };
}

export async function createFamily(familyName) {
  if (!familyName.trim()) {
    throw new Error("Family name is required.");
  }

  const inviteToken = await createUniqueInviteToken();
  const familyRef = doc(db, "families", inviteToken);
  const publicSlug = getStoredPublicSlug(familyName, inviteToken);

  await setDoc(familyRef, {
    familyName: familyName.trim(),
    inviteToken,
    publicSlug,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return inviteToken;
}

export async function createFamilyWithGuests(familyName, guestNames = []) {
  const cleanGuestNames = guestNames
    .map((guestName) => guestName.trim())
    .filter(Boolean);

  if (!familyName.trim()) {
    throw new Error("Family name is required.");
  }

  if (cleanGuestNames.length > 240) {
    throw new Error("Too many guests for one family.");
  }

  const inviteToken = await createUniqueInviteToken();
  const publicSlug = getStoredPublicSlug(familyName, inviteToken);
  const familyRef = doc(db, "families", inviteToken);
  const batch = writeBatch(db);

  batch.set(familyRef, {
    familyName: familyName.trim(),
    inviteToken,
    publicSlug,
    status: getInitialFamilyStatus(cleanGuestNames.length),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  cleanGuestNames.forEach((guestName) => {
    const guestRef = doc(collection(db, "families", inviteToken, "guests"));

    batch.set(guestRef, {
      name: guestName,
      attending: null,
      responded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();

  return inviteToken;
}

export async function updateFamilyName(familyId, familyName) {
  const familyRef = doc(db, "families", familyId);
  const familySnapshot = await getDoc(familyRef);

  if (!familySnapshot.exists()) {
    throw new Error("Family not found.");
  }

  const family = normalizeFamily(familySnapshot);
  const isLegacySlug = String(family.inviteToken).includes("-");

  await updateDoc(familyRef, {
    familyName: familyName.trim(),
    publicSlug: isLegacySlug
      ? family.publicSlug
      : getStoredPublicSlug(familyName, family.inviteToken),
    updatedAt: serverTimestamp(),
  });
}

export async function regenerateFamilyInviteToken(familyId) {
  const oldFamilyRef = doc(db, "families", familyId);
  const familySnapshot = await getDoc(oldFamilyRef);

  if (!familySnapshot.exists()) {
    throw new Error("Family not found.");
  }

  const family = normalizeFamily(familySnapshot);
  const nextInviteToken = await createUniqueInviteToken();
  const nextFamilyRef = doc(db, "families", nextInviteToken);
  const guestsSnapshot = await getDocs(collection(db, "families", familyId, "guests"));

  if (guestsSnapshot.size > 240) {
    throw new Error("Too many guests to regenerate this token in one browser action.");
  }

  const batch = writeBatch(db);

  batch.set(nextFamilyRef, {
    familyName: family.familyName,
    inviteToken: nextInviteToken,
    publicSlug: getStoredPublicSlug(family.familyName, nextInviteToken),
    status: getInitialFamilyStatus(guestsSnapshot.size),
    openedAt: null,
    createdAt: family.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  guestsSnapshot.docs.forEach((guestSnapshot) => {
    const guestData = guestSnapshot.data();
    const nextGuestRef = doc(
      db,
      "families",
      nextInviteToken,
      "guests",
      guestSnapshot.id,
    );

    batch.set(nextGuestRef, guestData);
    batch.delete(guestSnapshot.ref);
  });

  batch.delete(oldFamilyRef);
  await batch.commit();

  return nextInviteToken;
}

export async function deleteFamily(familyId) {
  const guestsSnapshot = await getDocs(collection(db, "families", familyId, "guests"));

  if (guestsSnapshot.size > 450) {
    throw new Error("Too many guests to delete this family in one browser action.");
  }

  const batch = writeBatch(db);

  guestsSnapshot.docs.forEach((guestSnapshot) => {
    batch.delete(guestSnapshot.ref);
  });

  batch.delete(doc(db, "families", familyId));
  await batch.commit();
}

export async function addGuest(familyId, guestName) {
  const guestRef = doc(collection(db, "families", familyId, "guests"));
  const familyRef = doc(db, "families", familyId);
  const batch = writeBatch(db);

  batch.set(guestRef, {
    name: guestName.trim(),
    attending: null,
    responded: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(familyRef, {
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  await updateFamilyStatusFromGuests(familyId);
}

export async function updateGuestName(familyId, guestId, guestName) {
  const batch = writeBatch(db);

  batch.update(doc(db, "families", familyId, "guests", guestId), {
    name: guestName.trim(),
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, "families", familyId), {
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function updateGuestRsvpStatus(familyId, guestId, status) {
  const statusValues = {
    pending: { attending: null, responded: false },
    confirmed: { attending: true, responded: true },
    declined: { attending: false, responded: true },
  };
  const nextStatus = statusValues[status];

  if (!nextStatus) {
    throw new Error("Choose a valid RSVP status.");
  }

  const batch = writeBatch(db);

  batch.update(doc(db, "families", familyId, "guests", guestId), {
    attending: nextStatus.attending,
    responded: nextStatus.responded,
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, "families", familyId), {
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  await updateFamilyStatusFromGuests(familyId);
}

export async function deleteGuest(familyId, guestId) {
  await deleteDoc(doc(db, "families", familyId, "guests", guestId));
  await updateFamilyStatusFromGuests(familyId);
}

export async function importFamiliesWithGuests(importFamilies) {
  const cleanFamilies = importFamilies
    .map((family) => ({
      familyName: family.familyName.trim(),
      guests: family.guests.map((guest) => guest.trim()).filter(Boolean),
    }))
    .filter((family) => family.familyName && family.guests.length > 0);
  const existingFamiliesSnapshot = await getDocs(collection(db, "families"));
  const existingFamilyNames = new Set(
    existingFamiliesSnapshot.docs.map((familySnapshot) =>
      (familySnapshot.data().familyName || "").trim().toLowerCase(),
    ),
  );
  const result = {
    familiesCreated: 0,
    guestsCreated: 0,
    duplicateFamilies: [],
    duplicateGuests: [],
    errors: [],
  };

  for (const family of cleanFamilies) {
    if (existingFamilyNames.has(family.familyName.toLowerCase())) {
      result.duplicateFamilies.push(family.familyName);
      continue;
    }

    const seenGuests = new Set();
    const uniqueGuests = [];

    family.guests.forEach((guestName) => {
      const guestKey = guestName.toLowerCase();

      if (seenGuests.has(guestKey)) {
        result.duplicateGuests.push(`${family.familyName}: ${guestName}`);
        return;
      }

      seenGuests.add(guestKey);
      uniqueGuests.push(guestName);
    });

    try {
      await createFamilyWithGuests(family.familyName, uniqueGuests);
      existingFamilyNames.add(family.familyName.toLowerCase());
      result.familiesCreated += 1;
      result.guestsCreated += uniqueGuests.length;
    } catch (error) {
      result.errors.push(`${family.familyName}: ${error.message}`);
    }
  }

  return result;
}

export async function getFamilyOnce(familyId) {
  const snapshot = await getDoc(doc(db, "families", familyId));
  return snapshot.exists() ? normalizeFamily(snapshot) : null;
}

export function sortFamiliesByDate(families) {
  return [...families].sort(
    (a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt),
  );
}
