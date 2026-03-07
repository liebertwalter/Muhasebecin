import {
  registerUser,
  loginUser,
  logoutUser,
  observeAuth,
  loadCloudStore,
  saveCloudStore,
  loadProfile
} from "./firebase.js";

import {
  createEmptyStore,
  normalizeStore,
  loadLocalStore,
  saveLocalStore,
  addPersonRecord,
  addTransaction,
  recordPayment,
  toggleRelation,
  updateDueDate,
  deletePerson,
  computeSummary,
  getUpcomingNotifications,
  exportStoreAsJson,
  exportStoreAsCsv
} from "./database.js";

import { renderDebtChart } from "./charts.js";

let currentUser = null;
let currentProfile = null;
let store = createEmptyStore();
let authMode = "login";

const $ = (id) => document.getElementById(id);

const authOverlay = $("authOverlay");
const appRoot = $("appRoot");

const loginTabBtn = $("loginTabBtn");
const registerTabBtn = $("registerTabBtn");
const registerExtraFields = $("registerExtraFields");
const authLoginValue = $("authLoginValue");
const authEmail = $("authEmail");
const authPassword = $("authPassword");
const registerUsername = $("registerUsername");
const authSubmitBtn = $("authSubmitBtn");
const authMessage = $("authMessage");

const avatarCircle = $("avatarCircle");
const netTotal = $("netTotal");
const owedToMeTotal = $("owedToMeTotal");
const iOweTotal = $("iOweTotal");
const summaryMini = $("summaryMini");
const searchInput = $("searchInput");

const personNameInput = $("personNameInput");
const amountInput = $("amountInput");
const relationSelect = $("relationSelect");
const dueDateInput = $("dueDateInput");
const noteInput = $("noteInput");

const addPersonBtn = $("addPersonBtn");
const clearFormBtn = $("clearFormBtn");
const peopleList = $("peopleList");
const debtChart = $("debtChart");
const reportSummary = $("reportSummary");

const notificationBtn = $("notificationBtn");
const notificationBadge = $("notificationBadge");
const notificationDrawer = $("notificationDrawer");
const closeDrawerBtn = $("closeDrawerBtn");
const notificationList = $("notificationList");

const exportJsonBtn = $("exportJsonBtn");
const exportCsvBtn = $("exportCsvBtn");
const importJsonBtn = $("importJsonBtn");
const importFileInput = $("importFileInput");

const requestNotificationBtn = $("requestNotificationBtn");
const testNotificationBtn = $("testNotificationBtn");
const toggleThemeBtn = $("toggleThemeBtn");
const logoutBtn = $("logoutBtn");
const voiceBtn = $("voiceBtn");
const navAddBtn = $("navAddBtn");

function setAuthMode(mode) {
  authMode = mode;

  const isRegister = mode === "register";
  loginTabBtn.classList.toggle("active", !isRegister);
  registerTabBtn.classList.toggle("active", isRegister);

  registerExtraFields.classList.toggle("hidden", !isRegister);
  authEmail.classList.toggle("hidden", !isRegister);
  authLoginValue.classList.toggle("hidden", isRegister);

  authSubmitBtn.textContent = isRegister ? "Kayıt Ol" : "Giriş Yap";
  authMessage.textContent = "";
}

function setAuthMessage(message) {
  authMessage.textContent = message;
}

async function handleAuthSubmit() {
  try {
    if (authMode === "register") {
      const username = registerUsername.value.trim();
      const email = authEmail.value.trim();
      const password = authPassword.value.trim();

      if (!username || !email || !password) {
        setAuthMessage("Tüm alanları doldur.");
        return;
      }

      await registerUser(username, email, password);
      setAuthMessage("Kayıt başarılı, giriş yapılıyor...");
    } else {
      const loginValue = authLoginValue.value.trim();
      const password = authPassword.value.trim();

      if (!loginValue || !password) {
        setAuthMessage("Giriş bilgilerini doldur.");
        return;
      }

      await loginUser(loginValue, password);
      setAuthMessage("Giriş başarılı.");
    }
  } catch (error) {
    setAuthMessage(error.message || "Bir hata oluştu.");
  }
}

function applyTheme() {
  document.body.classList.toggle("light", store.settings.theme === "light");
}

async function persistStore() {
  saveLocalStore(store);
  if (currentUser) {
    await saveCloudStore(currentUser.uid, store);
  }
}

function formatCurrency(value) {
  return Number(value).toLocaleString("tr-TR");
}

function relationLabel(person) {
  return person.relation === "they_owe_me" ? "Bana borçlu" : "Ben borçluyum";
}

function relationBadgeClass(person) {
  return person.relation === "they_owe_me" ? "positive" : "negative";
}

function renderSummary() {
  const summary = computeSummary(store);

  netTotal.textContent = formatCurrency(summary.net);
  owedToMeTotal.textContent = formatCurrency(summary.owedToMe);
  iOweTotal.textContent = formatCurrency(summary.iOwe);

  summaryMini.textContent = `${summary.personCount} kişi kayıtlı`;

  reportSummary.innerHTML = `
    <div class="report-line"><span>Bana borçlu olan toplam</span><strong>₺ ${formatCurrency(summary.owedToMe)}</strong></div>
    <div class="report-line"><span>Benim borçlu olduğum toplam</span><strong>₺ ${formatCurrency(summary.iOwe)}</strong></div>
    <div class="report-line"><span>Net durum</span><strong>₺ ${formatCurrency(summary.net)}</strong></div>
    <div class="report-line"><span>Kişi sayısı</span><strong>${summary.personCount}</strong></div>
  `;
}

function renderNotifications() {
  const items = getUpcomingNotifications(store);

  if (items.length === 0) {
    notificationList.innerHTML = `<div class="empty-state">Yaklaşan bir hatırlatma yok.</div>`;
    notificationBadge.classList.add("hidden");
    return;
  }

  notificationBadge.textContent = items.length;
  notificationBadge.classList.remove("hidden");

  notificationList.innerHTML = items.map(({ person, diffDays }) => {
    let status = "";

    if (diffDays < 0) {
      status = `${Math.abs(diffDays)} gün gecikti`;
    } else if (diffDays === 0) {
      status = "Bugün vade günü";
    } else {
      status = `${diffDays} gün kaldı`;
    }

    return `
      <div class="notification-item">
        <strong>${person.name}</strong><br>
        ${relationLabel(person)} — ₺ ${formatCurrency(person.balance)}<br>
        <small>${status}</small>
      </div>
    `;
  }).join("");
}

function renderPeople() {
  const search = searchInput.value.trim().toLowerCase();

  const filtered = store.people.filter((person) =>
    person.name.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    peopleList.innerHTML = `<div class="glass-card empty-state">Kayıt bulunamadı.</div>`;
    return;
  }

  peopleList.innerHTML = filtered.map((person) => {
    const history = [...person.history].reverse().slice(0, 4);

    return `
      <div class="glass-card person-card">
        <div class="person-top">
          <div class="person-left">
            <div class="person-avatar">${person.name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="person-name">${person.name}</div>
              <div class="person-badge ${relationBadgeClass(person)}">
                ${relationLabel(person)} — ₺ ${formatCurrency(person.balance)}
              </div>
            </div>
          </div>

          <button class="person-menu" type="button" data-action="detail" data-id="${person.id}">
            <i data-lucide="more-horizontal"></i>
          </button>
        </div>

        <div class="person-meta">
          ${person.dueDate ? `Vade: ${person.dueDate}` : "Vade tarihi yok"}
          ${person.note ? ` • ${person.note}` : ""}
        </div>

        <div class="hareket-list">
          ${
            history.length
              ? history.map((item) => `
                <div class="hareket ${item.type === "payment" ? "minus" : "plus"}">
                  <span>${item.note} • ₺ ${formatCurrency(item.amount)} • ${item.at}</span>
                </div>
              `).join("")
              : `<div class="hareket plus"><span>Henüz işlem yok</span></div>`
          }
        </div>

        <div class="person-actions">
          <button class="action-btn" type="button" data-action="add" data-id="${person.id}">
            <i data-lucide="plus"></i><span>İşlem Ekle</span>
          </button>
          <button class="action-btn" type="button" data-action="pay" data-id="${person.id}">
            <i data-lucide="banknote"></i><span>Ödeme Gir</span>
          </button>
          <button class="action-btn primary" type="button" data-action="toggle" data-id="${person.id}">
            <i data-lucide="repeat"></i><span>Yön Değiştir</span>
          </button>
          <button class="action-btn warn" type="button" data-action="date" data-id="${person.id}">
            <i data-lucide="calendar-days"></i><span>Vade</span>
          </button>
          <button class="action-btn danger" type="button" data-action="delete" data-id="${person.id}">
            <i data-lucide="trash-2"></i><span>Sil</span>
          </button>
        </div>
      </div>
    `;
  }).join("");

  lucide.createIcons();
}

function renderAll() {
  applyTheme();
  renderSummary();
  renderPeople();
  renderNotifications();
  renderDebtChart(debtChart, store);

  if (currentProfile?.username) {
    avatarCircle.textContent = currentProfile.username.charAt(0).toUpperCase();
  } else if (currentUser?.email) {
    avatarCircle.textContent = currentUser.email.charAt(0).toUpperCase();
  }

  lucide.createIcons();
}

function showApp() {
  authOverlay.classList.add("hidden");
  appRoot.classList.remove("hidden");
}

function showAuth() {
  authOverlay.classList.remove("hidden");
  appRoot.classList.add("hidden");
}

async function initializeUser(user) {
  currentUser = user;
  currentProfile = await loadProfile(user.uid);
  const cloudStore = await loadCloudStore(user.uid);
  store = normalizeStore(cloudStore);
  saveLocalStore(store);
  showApp();
  renderAll();
  runDueNotifications();
}

function clearForm() {
  personNameInput.value = "";
  amountInput.value = "";
  dueDateInput.value = "";
  noteInput.value = "";
  relationSelect.value = "they_owe_me";
}

async function handleAddPerson() {
  const name = personNameInput.value.trim();
  const amount = Number(amountInput.value || 0);
  const relation = relationSelect.value;
  const dueDate = dueDateInput.value;
  const note = noteInput.value.trim();

  if (!name || amount <= 0) {
    alert("Kişi adı ve tutar gir.");
    return;
  }

  store = addPersonRecord(store, { name, amount, relation, dueDate, note });
  await persistStore();
  clearForm();
  renderAll();
}

async function handlePeopleActions(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const personId = button.dataset.id;
  const person = store.people.find((p) => p.id === personId);
  if (!person) return;

  if (action === "add") {
    const value = prompt(`${person.name} için eklenecek tutar`);
    if (!value) return;
    const amount = Number(value);
    if (amount <= 0) return;

    const note = prompt("İşlem notu", "Borç eklendi") || "Borç eklendi";
    store = addTransaction(store, personId, amount, note);
    await persistStore();
    renderAll();
  }

  if (action === "pay") {
    const value = prompt(`${person.name} için ödenen tutar`);
    if (!value) return;
    const amount = Number(value);
    if (amount <= 0) return;

    const note = prompt("Ödeme notu", "Ödeme girildi") || "Ödeme girildi";
    store = recordPayment(store, personId, amount, note);
    await persistStore();
    renderAll();
  }

  if (action === "toggle") {
    store = toggleRelation(store, personId);
    await persistStore();
    renderAll();
  }

  if (action === "date") {
    const nextDate = prompt("Yeni vade tarihi (YYYY-MM-DD)", person.dueDate || "");
    if (nextDate === null) return;

    store = updateDueDate(store, personId, nextDate);
    await persistStore();
    renderAll();
  }

  if (action === "delete") {
    const ok = confirm(`${person.name} silinsin mi?`);
    if (!ok) return;

    store = deletePerson(store, personId);
    await persistStore();
    renderAll();
  }

  if (action === "detail") {
    alert(
      `${person.name}\n\n` +
      `Durum: ${relationLabel(person)}\n` +
      `Bakiye: ₺ ${formatCurrency(person.balance)}\n` +
      `Vade: ${person.dueDate || "Yok"}\n` +
      `Not: ${person.note || "Yok"}\n` +
      `İşlem sayısı: ${person.history.length}`
    );
  }
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.remove("active");
  });

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.remove("active");
  });

  if (tabName === "people") $("peopleTab").classList.add("active");
  if (tabName === "reports") $("reportsTab").classList.add("active");
  if (tabName === "backup") $("backupTab").classList.add("active");
  if (tabName === "settings") $("settingsTab").classList.add("active");

  document.querySelector(`.nav-item[data-tab="${tabName}"]`)?.classList.add("active");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("Bu tarayıcı bildirim desteklemiyor.");
    return;
  }

  const result = await Notification.requestPermission();

  store.settings.notifications = result === "granted";
  await persistStore();
  renderAll();

  alert(result === "granted" ? "Bildirim izni verildi." : "Bildirim izni verilmedi.");
}

function showTestNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    alert("Önce bildirim izni ver.");
    return;
  }

  new Notification("Muhasebecin", {
    body: "Test bildirimi çalışıyor."
  });
}

function runDueNotifications() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!store.settings.notifications) return;

  const items = getUpcomingNotifications(store);

  items.forEach(({ person, diffDays }) => {
    let body = "";

    if (diffDays < 0) body = `${person.name} için vade geçti.`;
    if (diffDays === 0) body = `${person.name} için vade bugün.`;
    if (diffDays > 0) body = `${person.name} için ${diffDays} gün kaldı.`;

    new Notification("Muhasebecin", { body });
  });
}

function toggleTheme() {
  store.settings.theme = store.settings.theme === "light" ? "dark" : "light";
  persistStore();
  renderAll();
}

function parseVoiceCommand(text) {
  const command = text.toLowerCase().trim();
  const amountMatch = command.match(/\d+/);
  if (!amountMatch) {
    alert("Tutar bulunamadı.");
    return;
  }

  const amount = Number(amountMatch[0]);

  let relation = "they_owe_me";
  if (command.includes("ben borçluyum") || command.includes("ona borçluyum")) {
    relation = "i_owe_them";
  }
  if (command.includes("bana borçlu")) {
    relation = "they_owe_me";
  }

  const cleaned = command
    .replace(/\d+/g, "")
    .replace("bana borçlu", "")
    .replace("ben borçluyum", "")
    .replace("ona borçluyum", "")
    .replace("ekle", "")
    .replace("ödeme", "")
    .replace("borç", "")
    .replace("tl", "")
    .trim();

  if (!cleaned) {
    alert("Kişi adı bulunamadı.");
    return;
  }

  const name = cleaned
    .split(" ")
    .filter(Boolean)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");

  store = addPersonRecord(store, {
    name,
    amount,
    relation,
    dueDate: "",
    note: "Sesli komut ile eklendi"
  });

  persistStore();
  renderAll();
  alert(`Sesli komut işlendi: ${name} / ₺ ${amount}`);
}

function startVoiceCommand() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Bu tarayıcı sesli komutu desteklemiyor.");
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = "tr-TR";
  rec.continuous = false;
  rec.interimResults = false;

  rec.onstart = () => alert("Dinliyorum...");
  rec.onerror = (e) => alert("Sesli komut hatası: " + e.error);
  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    parseVoiceCommand(text);
  };

  rec.start();
}

function setupEvents() {
  loginTabBtn.addEventListener("click", () => setAuthMode("login"));
  registerTabBtn.addEventListener("click", () => setAuthMode("register"));
  authSubmitBtn.addEventListener("click", handleAuthSubmit);

  addPersonBtn.addEventListener("click", handleAddPerson);
  clearFormBtn.addEventListener("click", clearForm);
  searchInput.addEventListener("input", renderPeople);
  peopleList.addEventListener("click", handlePeopleActions);

  notificationBtn.addEventListener("click", () => {
    notificationDrawer.classList.remove("hidden");
  });

  closeDrawerBtn.addEventListener("click", () => {
    notificationDrawer.classList.add("hidden");
  });

  notificationDrawer.addEventListener("click", (e) => {
    if (e.target === notificationDrawer) {
      notificationDrawer.classList.add("hidden");
    }
  });

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  navAddBtn.addEventListener("click", () => {
    switchTab("people");
    personNameInput.focus();
  });

  exportJsonBtn.addEventListener("click", () => {
    downloadFile("muhasebecin-backup.json", exportStoreAsJson(store), "application/json");
  });

  exportCsvBtn.addEventListener("click", () => {
    downloadFile("muhasebecin.csv", exportStoreAsCsv(store), "text/csv");
  });

  importJsonBtn.addEventListener("click", () => importFileInput.click());

  importFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();

    try {
      store = normalizeStore(JSON.parse(text));
      await persistStore();
      renderAll();
      alert("Yedek yüklendi.");
    } catch {
      alert("Geçersiz yedek dosyası.");
    }
  });

  requestNotificationBtn.addEventListener("click", requestNotificationPermission);
  testNotificationBtn.addEventListener("click", showTestNotification);
  toggleThemeBtn.addEventListener("click", toggleTheme);
  logoutBtn.addEventListener("click", async () => {
    await logoutUser();
  });

  voiceBtn.addEventListener("click", startVoiceCommand);
}

function initIcons() {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

function bootstrap() {
  setupEvents();
  initIcons();
  setAuthMode("login");

  observeAuth(async (user) => {
    if (user) {
      await initializeUser(user);
    } else {
      currentUser = null;
      currentProfile = null;
      store = loadLocalStore();
      showAuth();
    }
  });
}

bootstrap();
