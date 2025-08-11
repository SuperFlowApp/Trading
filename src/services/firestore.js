import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { firebaseConfig } from "../firebase/firebaseConfig";

let app;
let db;
export function getDb() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

export async function createBotGroup({ groupName, groupSize }) {
  const users = Array.from({ length: groupSize }, (_, i) => {
    const username = `${groupName}-${i + 1}`;
    return { username, password: username };
  });

  const dbRef = getDb();
  const docRef = await addDoc(collection(dbRef, "botGroups"), {
    groupName,
    groupSize,
    users,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, groupName, groupSize, users };
}

export async function fetchBotGroups() {
  const dbRef = getDb();
  const q = query(collection(dbRef, "botGroups"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function onBotGroups(callback) {
  const dbRef = getDb();
  const q = query(collection(dbRef, "botGroups"), orderBy("createdAt", "desc"));
  const unsub = onSnapshot(q, snap => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(rows);
  });
  return unsub;
}

export async function deleteBotGroup(id) {
  const dbRef = getDb();
  await deleteDoc(doc(dbRef, "botGroups", id));
}
