import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firebaseConfig } from "../firebase/firebaseConfig";

// Initialize Firebase once
let app;
let db;
export function getDb() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

// User profile management
export async function getUserProfile(username) {
  if (!username) return null;
  
  const dbRef = getDb();
  const userRef = doc(dbRef, "users", username);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() };
  }
  
  return null;
}

export async function createUserProfile(username) {
  if (!username) return null;

  const dbRef = getDb();
  const userRef = doc(dbRef, "users", username);

  const existingUser = await getDoc(userRef);
  if (existingUser.exists()) {
    return { id: existingUser.id, ...existingUser.data() };
  }

  const userData = {
    username,
    createdAt: serverTimestamp(),
    settings: {
      colors: { accentRed: "#F59DEF", accentGreen: "#00B7C9" }, // SuperFlow
      fontSize: "medium",
    },
  };

  await setDoc(userRef, userData);
  return { id: username, ...userData };
}

export async function saveUserSettings(username, settings) {
  if (!username) return null;

  const dbRef = getDb();
  const userRef = doc(dbRef, "users", username);

  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const userData = {
      username,
      createdAt: serverTimestamp(),
      settings, // only colors + fontSize
    };
    await setDoc(userRef, userData);
    return { id: username, ...userData };
  }

  await updateDoc(userRef, {
    settings,
    updatedAt: serverTimestamp(),
  });

  return { id: username, ...userDoc.data(), settings };
}

export async function getUserSettings(username) {
  const user = await getUserProfile(username);
  return user?.settings || null;
}

// Simple function to check if username exists
export async function isUsernameTaken(username) {
  const user = await getUserProfile(username);
  return user !== null;
}
