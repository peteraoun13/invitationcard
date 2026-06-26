import { doc, getDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "./firebase";

async function getAdminRecord(uid) {
  const adminSnapshot = await getDoc(doc(db, "admins", uid));
  return adminSnapshot.exists() ? adminSnapshot.data() : null;
}

export async function signInAdmin(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const adminRecord = await getAdminRecord(credential.user.uid);

  if (!adminRecord) {
    await signOut(auth);
    throw new Error("This account is not authorized for the admin dashboard.");
  }

  return credential.user;
}

export async function signOutAdmin() {
  await signOut(auth);
}

export function onAdminAuthStateChanged(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ user: null, isAdmin: false, isLoading: false });
      return;
    }

    try {
      const adminRecord = await getAdminRecord(user.uid);

      if (!adminRecord) {
        await signOut(auth);
        callback({ user: null, isAdmin: false, isLoading: false });
        return;
      }

      callback({ user, isAdmin: true, isLoading: false });
    } catch (error) {
      callback({
        user: null,
        isAdmin: false,
        isLoading: false,
        error: error.message,
      });
    }
  });
}
