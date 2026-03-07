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
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

window.firebaseCloud = {
  auth,
  db,
  currentUser: null,

  async register(username, email, password) {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    await setDoc(doc(db, "profiles", uid), {
      uid,
      username,
      email
    });

    await setDoc(doc(db, "usernames", username.toLowerCase()), {
      uid,
      username,
      email
    });

    const localData = JSON.parse(localStorage.getItem("muhasebecin_db")) || [];

    await setDoc(doc(db, "userData", uid), {
      kisiler: localData
    });

    return userCred.user;
  },

  async login(loginValue, password) {
    let email = loginValue.trim();

    if (!email.includes("@")) {
      const usernameDoc = await getDoc(doc(db, "usernames", email.toLowerCase()));
      if (!usernameDoc.exists()) {
        throw new Error("Kullanıcı adı bulunamadı.");
      }
      email = usernameDoc.data().email;
    }

    const userCred = await signInWithEmailAndPassword(auth, email, password);
    return userCred.user;
  },

  async logout() {
    await signOut(auth);
  },

  async loadCloudData(uid) {
    const ref = doc(db, "userData", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return [];
    return snap.data().kisiler || [];
  },

  async saveCloudData(uid, data) {
    await setDoc(doc(db, "userData", uid), { kisiler: data }, { merge: true });
  },

  async loadProfile(uid) {
    const snap = await getDoc(doc(db, "profiles", uid));
    if (!snap.exists()) return null;
    return snap.data();
  }
};

function authModalHTML() {
  return `
    <div id="authOverlay" style="
      position:fixed; inset:0; z-index:9999;
      background:rgba(2,6,23,.78);
      backdrop-filter:blur(12px);
      display:flex; align-items:center; justify-content:center;
      padding:18px;">
      <div style="
        width:min(100%,420px);
        background:linear-gradient(180deg, rgba(72,88,152,.45), rgba(34,45,88,.45));
        border:1px solid rgba(255,255,255,.12);
        border-radius:28px;
        padding:20px;
        color:#fff;
        box-shadow:0 20px 60px rgba(0,0,0,.45);">
        <div style="text-align:center; margin-bottom:16px;">
          <div style="
            width:64px; height:64px; margin:0 auto 12px;
            border-radius:20px;
            background:linear-gradient(135deg,#2f7cff,#1458f4);
            display:flex; align-items:center; justify-content:center;
            font-size:28px; font-weight:800;">M</div>
          <div style="font-size:28px; font-weight:900;">Muhasebecin</div>
          <div style="font-size:13px; color:#c7d2fe; margin-top:6px;">Hesabına giriş yap veya kayıt ol</div>
        </div>

        <div style="display:flex; gap:8px; margin-bottom:14px;">
          <button id="tabLogin" style="
            flex:1; border:none; border-radius:14px; padding:12px;
            background:#2563eb; color:#fff; font-weight:800;">Giriş Yap</button>

          <button id="tabRegister" style="
            flex:1; border:none; border-radius:14px; padding:12px;
            background:rgba(255,255,255,.08); color:#fff; font-weight:800;">Kayıt Ol</button>
        </div>

        <div id="registerFields" style="display:none;">
          <input id="authUsername" placeholder="Kullanıcı adı" style="
            width:100%; margin-bottom:10px; padding:14px 16px; border:none; outline:none;
            border-radius:16px; background:rgba(255,255,255,.08); color:#fff;">
        </div>

        <input id="authLoginValue" placeholder="E-posta veya kullanıcı adı" style="
          width:100%; margin-bottom:10px; padding:14px 16px; border:none; outline:none;
          border-radius:16px; background:rgba(255,255,255,.08); color:#fff;">

        <input id="authEmail" placeholder="E-posta (kayıt için)" style="
          display:none;
          width:100%; margin-bottom:10px; padding:14px 16px; border:none; outline:none;
          border-radius:16px; background:rgba(255,255,255,.08); color:#fff;">

        <input id="authPassword" type="password" placeholder="Şifre" style="
          width:100%; margin-bottom:10px; padding:14px 16px; border:none; outline:none;
          border-radius:16px; background:rgba(255,255,255,.08); color:#fff;">

        <button id="authSubmitBtn" style="
          width:100%; border:none; border-radius:16px; padding:14px;
          background:linear-gradient(135deg,#3e8dff,#1556f0); color:white;
          font-weight:900; font-size:16px;">Giriş Yap</button>

        <div id="authMessage" style="
          margin-top:12px; font-size:13px; color:#dbeafe; text-align:center;
          min-height:18px;"></div>
      </div>
    </div>
  `;
}

function setAuthMessage(msg) {
  const el = document.getElementById("authMessage");
  if (el) el.innerText = msg;
}

function switchAuthTab(mode) {
  const isRegister = mode === "register";

  document.getElementById("registerFields").style.display = isRegister ? "block" : "none";
  document.getElementById("authEmail").style.display = isRegister ? "block" : "none";
  document.getElementById("authLoginValue").style.display = isRegister ? "none" : "block";

  document.getElementById("authSubmitBtn").innerText = isRegister ? "Kayıt Ol" : "Giriş Yap";
  document.getElementById("tabLogin").style.background = isRegister ? "rgba(255,255,255,.08)" : "#2563eb";
  document.getElementById("tabRegister").style.background = isRegister ? "#2563eb" : "rgba(255,255,255,.08)";
  document.getElementById("authOverlay").dataset.mode = mode;
  setAuthMessage("");
}

function buildAuthUI() {
  if (document.getElementById("authOverlay")) return;

  document.body.insertAdjacentHTML("beforeend", authModalHTML());

  document.getElementById("tabLogin").onclick = () => switchAuthTab("login");
  document.getElementById("tabRegister").onclick = () => switchAuthTab("register");

  document.getElementById("authSubmitBtn").onclick = async () => {
    const mode = document.getElementById("authOverlay").dataset.mode || "login";

    try {
      if (mode === "register") {
        const username = document.getElementById("authUsername").value.trim();
        const email = document.getElementById("authEmail").value.trim();
        const password = document.getElementById("authPassword").value.trim();

        if (!username || !email || !password) {
          setAuthMessage("Tüm alanları doldur.");
          return;
        }

        await window.firebaseCloud.register(username, email, password);
        setAuthMessage("Kayıt başarılı.");
      } else {
        const loginValue = document.getElementById("authLoginValue").value.trim();
        const password = document.getElementById("authPassword").value.trim();

        if (!loginValue || !password) {
          setAuthMessage("Giriş bilgilerini doldur.");
          return;
        }

        await window.firebaseCloud.login(loginValue, password);
        setAuthMessage("Giriş başarılı.");
      }
    } catch (err) {
      setAuthMessage(err.message || "Bir hata oluştu.");
    }
  };

  switchAuthTab("login");
}

onAuthStateChanged(auth, async (user) => {
  buildAuthUI();

  const overlay = document.getElementById("authOverlay");

  if (user) {
    window.firebaseCloud.currentUser = user;
    if (overlay) overlay.style.display = "none";
  } else {
    window.firebaseCloud.currentUser = null;
    if (overlay) overlay.style.display = "flex";
  }
});
