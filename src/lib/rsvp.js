import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

function getTokenCandidates(inviteSlug) {
  const cleanSlug = String(inviteSlug || "").trim();
  const lastDashIndex = cleanSlug.lastIndexOf("-");
  const candidates = [];

  if (lastDashIndex > -1 && lastDashIndex < cleanSlug.length - 1) {
    candidates.push(cleanSlug.slice(lastDashIndex + 1));
  }

  candidates.push(cleanSlug);

  return Array.from(new Set(candidates.filter(Boolean)));
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

function getFamilyStatusFromGuests(familyData, guests) {
  if (guests.length === 0) {
    return "pending";
  }

  const respondedCount = guests.filter((guest) => guest.responded).length;

  if (respondedCount === guests.length) {
    return "completed";
  }

  if (respondedCount > 0) {
    return "partial";
  }

  return familyData.openedAt || familyData.status === "opened"
    ? "opened"
    : "not_opened";
}

async function getFamilySnapshotByInviteSlug(inviteSlug) {
  const candidates = getTokenCandidates(inviteSlug);

  for (const candidate of candidates) {
    let familySnapshot;

    try {
      familySnapshot = await getDoc(doc(db, "families", candidate));
    } catch {
      continue;
    }

    if (familySnapshot.exists()) {
      return familySnapshot;
    }
  }

  return null;
}

async function markInviteOpened(familySnapshot, familyData, guests) {
  const currentStatus = getFamilyStatusFromGuests(familyData, guests);

  if (currentStatus === "completed" || currentStatus === "partial") {
    return;
  }

  if (guests.length === 0) {
    await updateDoc(familySnapshot.ref, {
      status: "pending",
      updatedAt: serverTimestamp(),
    });
    return;
  }

  if (familyData.openedAt && familyData.status === "opened") {
    return;
  }

  await updateDoc(familySnapshot.ref, {
    openedAt: familyData.openedAt || serverTimestamp(),
    status: "opened",
    updatedAt: serverTimestamp(),
  });
}

export async function getInviteByToken(inviteSlug) {
  const familySnapshot = await getFamilySnapshotByInviteSlug(inviteSlug);

  if (!familySnapshot) {
    return null;
  }

  const familyData = familySnapshot.data();
  const inviteToken = familyData.inviteToken || familySnapshot.id;

  if (familyData.inviteToken && familyData.inviteToken !== familySnapshot.id) {
    return null;
  }

  const guestsSnapshot = await getDocs(
    query(
      collection(db, "families", familySnapshot.id, "guests"),
      orderBy("createdAt", "asc"),
    ),
  );
  const guests = guestsSnapshot.docs.map(normalizeGuest);

  await markInviteOpened(familySnapshot, familyData, guests);

  return {
    family: {
      id: familySnapshot.id,
      familyName: familyData.familyName || "",
      inviteToken,
      publicSlug: familyData.publicSlug || inviteSlug,
    },
    guests,
    hasSubmittedRsvp: guests.some((guest) => guest.responded),
  };
}

export async function submitFamilyRsvp({ familyId, inviteToken, guests, selectedGuestIds }) {
  const selectedIds = new Set(selectedGuestIds);
  const responses = guests.map((guest) => ({
    guestId: guest.id,
    name: guest.name,
    attending: selectedIds.has(guest.id),
  }));
  const batch = writeBatch(db);
  const submissionRef = doc(collection(db, "rsvpSubmissions"));

  batch.set(submissionRef, {
    familyId,
    inviteToken,
    submittedAt: serverTimestamp(),
    responses,
  });

  responses.forEach((response) => {
    batch.update(doc(db, "families", familyId, "guests", response.guestId), {
      attending: response.attending,
      responded: true,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();

  return {
    submissionId: submissionRef.id,
    responses,
  };
}
