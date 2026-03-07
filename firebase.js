import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQf0ekFo_2owofpOMnNdTqNwLxxsSvSKU",
  authDomain: "muhasebeciniz.firebaseapp.com",
  projectId: "muhasebeciniz",
  storageBucket: "muhasebeciniz.firebasestorage.app",
  messagingSenderId: "717751925179",
  appId: "1:717751925179:web:6b927078475e11fce96c9e",
  measurementId: "G-94R335GH2Y"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

window.firebaseAuth = auth;
window.firebaseDB = db;
