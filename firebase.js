import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQfe0kFo_2owofpOMmNdTqNwLxxsSvSKU",
  authDomain: "muhasebecinizz.firebaseapp.com",
  projectId: "muhasebecinizz",
  storageBucket: "muhasebecinizz.firebasestorage.app",
  messagingSenderId: "717751925179",
  appId: "1:717751925179:web:6b927078475e11fce96c9e",
  measurementId: "G-94R335GH2Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export async function registerUser(username, email, password) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;

  await setDoc(doc(db, "profiles", uid), {
    uid,
    username,
    email,
    createdAt: new Date().toISOString()
  });

  await setDoc(doc(db, "usernames", username.toLowerCase()), {
    uid,
    username,
    email
  });

  const existingLocal = JSON.parse(localStorage.getItem("muhasebecin_store")) || null;

  if (existingLocal) {
    await setDoc(doc(db, "userData", uid), existingLocal, { merge: true });
  } else {
    await setDoc(doc(db, "userData", uid), {
      people: [],
      settings: {
        theme: "dark",
        notifications: false
      }
    }, { merge: true });
  }

  return userCred.user;
}

export async function loginUser(loginValue, password) {
  let email = loginValue.trim();

  if (!email.includes("@")) {
    const usernameSnap = await getDoc(doc(db, "usernames", email.toLowerCase()));
    if (!usernameSnap.exists()) {
      throw new Error("Kullanıcı adı bulunamadı.");
    }
    email = usernameSnap.data().email;
  }

  const userCred = await signInWithEmailAndPassword(auth, email, password);
  return userCred.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function loadCloudStore(uid) {
  const snap = await getDoc(doc(db, "userData", uid));
  if (!snap.exists()) {
    return {
      people: [],
      settings: {
        theme: "dark",
        notifications: false
      }
    };
  }
  return snap.data();
}

export async function saveCloudStore(uid, store) {
  await setDoc(doc(db, "userData", uid), store, { merge: true });
}

export async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "profiles", uid));
  if (!snap.exists()) return null;
  return snap.data();
}
