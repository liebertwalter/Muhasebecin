// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { 
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
getFirestore,
doc,
setDoc,
getDoc,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyCQf0ekFo_2owofpOMnNdTqNwLxxsSvSKU",
authDomain: "muhasebeciniz.firebaseapp.com",
projectId: "muhasebeciniz",
storageBucket: "muhasebeciniz.firebasestorage.app",
messagingSenderId: "717751925179",
appId: "1:717751925179:web:6b927078475e11fce96c9e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
