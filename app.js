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
  addDebt,
  addIncome,
  addExpense,
  addBill,
  addSalary,
  toggleBillPaid,
  toggleSalaryPaid,
  deleteDebt,
  deleteIncome,
  deleteExpense,
  deleteBill,
  deleteSalary,
  computeSummary,
  getNotifications,
  exportJson
} from "./database.js";

let chartInstance = null;
let store = createEmptyStore();
let currentUser = null;
let currentProfile = null;
let authMode = "login";

const $ = (id) => document.getElementById(id);

function tl(v) {
  return Number(v || 0).toLocaleString("tr-TR");
}

async function persistStore() {
  saveLocalStore(store);
  if (currentUser) {
    await saveCloudStore(currentUser.uid, store);
  }
}

function setAuthMode(mode) {
  authMode = mode;
  $("loginTabBtn").classList.toggle("active", mode === "login");
  $("registerTabBtn").classList.toggle("active", mode === "register");
  $("registerFields").classList.toggle("hidden", mode !== "register");
  $("authEmail").classList.toggle("hidden", mode !== "register");
  $("authLoginValue").classList.toggle("hidden", mode === "register");
  $("authSubmitBtn").textContent = mode === "register" ? "Kayıt Ol" : "Giriş Yap";
  $("authMessage").textContent = "";
}

async function handleAuthSubmit() {
  try {
    if (authMode === "register") {
      const username = $("registerUsername").value.trim();
      const email = $("authEmail").value.trim();
      const password = $("authPassword").value.trim();

      if (!username || !email || !password) {
        $("authMessage").textContent = "Tüm alanları doldur.";
        return;
      }

      await registerUser(username, email, password);
      $("authMessage").textContent = "Kayıt başarılı.";
    } else {
      const loginValue = $("authLoginValue").value.trim();
      const password = $("authPassword").value.trim();

      if (!loginValue || !password) {
        $("authMessage").textContent = "Bilgileri doldur.";
        return;
      }

      await loginUser(loginValue, password);
      $("authMessage").textContent = "Giriş başarılı.";
    }
  } catch (e) {
    $("authMessage").textContent = e.message || "Bir hata oluştu.";
  }
}

function showApp() {
  $("authOverlay").classList.add("hidden");
  $("appRoot").classList.remove("hidden");
}

function showAuth() {
  $("authOverlay").classList.remove("hidden");
  $("appRoot").classList.add("hidden");
}

function applyTheme() {
  document.body.classList.toggle("light", store.settings.theme === "light");
}

function renderSummary() {
  const s = computeSummary(store);
  $("netTotal").textContent = tl(s.net);
  $("monthIncome").textContent = tl(s.monthIncome);
  $("monthExpense").textContent = tl(s.monthExpense);
  $("owedToMeTotal").textContent = tl(s.owedToMe);
  $("iOweTotal").textContent = tl(s.iOwe);
  $("summaryMini").textContent = "Aylık ve yıllık veriler otomatik hesaplanır";
}

function renderNotifications() {
  const list = getNotifications(store);

  if (!list.length) {
    $("notificationList").innerHTML = `<div class="empty-state">Bildirim yok.</div>`;
    $("notificationBadge").classList.add("hidden");
    return;
  }

  $("notificationBadge").textContent = list.length;
  $("notificationBadge").classList.remove("hidden");

  $("notificationList").innerHTML = list
    .map((item) => `<div class="notification-item">${item.text}</div>`)
    .join("");
}

function cardHtml(title, badge, meta, actions, letter = "K") {
  return `
    <div class="glass-card record-card">
      <div class="record-top">
        <div class="record-left">
          <div class="record-avatar">${letter}</div>
          <div>
            <div class="record-name">${title}</div>
            ${badge}
          </div>
        </div>
      </div>
      <div class="record-meta">${meta}</div>
      <div class="record-actions">${actions}</div>
    </div>
  `;
}

function renderDebts() {
  const q = $("searchInput").value.trim().toLowerCase();
  const items = store.debts.filter((x) => x.name.toLowerCase().includes(q));

  if (!items.length) {
    $("debtsList").innerHTML = `<div class="glass-card empty-state">Borç kaydı yok.</div>`;
    return;
  }

  $("debtsList").innerHTML = items.map((item) => {
    const badge = item.relation === "they_owe_me"
      ? `<div class="record-badge badge-positive">Bana borçlu — ₺ ${tl(item.amount)}</div>`
      : `<div class="record-badge badge-negative">Ben borçluyum — ₺ ${tl(item.amount)}</div>`;

    const meta = `${item.dueDate ? "Vade: " + item.dueDate + " • " : ""}${item.note || "Not yok"}`;

    const actions = `
      <button class="action-btn danger" data-type="debt" data-id="${item.id}" data-action="delete">Sil</button>
    `;

    return cardHtml(item.name, badge, meta, actions, item.name.charAt(0).toUpperCase());
  }).join("");
}

function renderIncome() {
  const q = $("searchInput").value.trim().toLowerCase();
  const items = store.incomes.filter((x) => x.title.toLowerCase().includes(q));

  if (!items.length) {
    $("incomeList").innerHTML = `<div class="glass-card empty-state">Gelir kaydı yok.</div>`;
    return;
  }

  $("incomeList").innerHTML = items.map((item) => {
    const badge = `<div class="record-badge badge-positive">Gelir — ₺ ${tl(item.amount)}</div>`;
    const meta = `${item.date || ""} • ${item.category || "Kategori yok"} • ${item.note || "Not yok"}`;
    const actions = `<button class="action-btn danger" data-type="income" data-id="${item.id}" data-action="delete">Sil</button>`;
    return cardHtml(item.title, badge, meta, actions, "₺");
  }).join("");
}

function renderExpense() {
  const q = $("searchInput").value.trim().toLowerCase();
  const items = store.expenses.filter((x) => x.title.toLowerCase().includes(q));

  if (!items.length) {
    $("expenseList").innerHTML = `<div class="glass-card empty-state">Gider kaydı yok.</div>`;
    return;
  }

  $("expenseList").innerHTML = items.map((item) => {
    const badge = `<div class="record-badge badge-negative">Gider — ₺ ${tl(item.amount)}</div>`;
    const meta = `${item.date || ""} • ${item.category || "Kategori yok"} • ${item.note || "Not yok"}`;
    const actions = `<button class="action-btn danger" data-type="expense" data-id="${item.id}" data-action="delete">Sil</button>`;
    return cardHtml(item.title, badge, meta, actions, "₺");
  }).join("");
}

function renderBills() {
  const q = $("searchInput").value.trim().toLowerCase();
  const items = store.bills.filter((x) => x.title.toLowerCase().includes(q));

  if (!items.length) {
    $("billList").innerHTML = `<div class="glass-card empty-state">Fatura kaydı yok.</div>`;
    return;
  }

  $("billList").innerHTML = items.map((item) => {
    const badge = item.paid
      ? `<div class="record-badge badge-positive">Ödendi — ₺ ${tl(item.amount)}</div>`
      : `<div class="record-badge badge-negative">Bekliyor — ₺ ${tl(item.amount)}</div>`;

    const meta = `${item.dueDate || ""} • ${item.category || "Kategori yok"} • ${item.note || "Not yok"}`;

    const actions = `
      <button class="action-btn primary" data-type="bill" data-id="${item.id}" data-action="toggle">${item.paid ? "Bekliyor Yap" : "Ödendi Yap"}</button>
      <button class="action-btn danger" data-type="bill" data-id="${item.id}" data-action="delete">Sil</button>
    `;

    return cardHtml(item.title, badge, meta, actions, "F");
  }).join("");
}

function renderSalaries() {
  const q = $("searchInput").value.trim().toLowerCase();
  const items = store.salaries.filter((x) => x.name.toLowerCase().includes(q));

  if (!items.length) {
    $("salaryList").innerHTML = `<div class="glass-card empty-state">Maaş kaydı yok.</div>`;
    return;
  }

  $("salaryList").innerHTML = items.map((item) => {
    const badge = item.paid
      ? `<div class="record-badge badge-positive">Ödendi — ₺ ${tl(item.amount)}</div>`
      : `<div class="record-badge badge-negative">Bekliyor — ₺ ${tl(item.amount)}</div>`;

    const meta = `${item.date || ""} • ${item.role || "Pozisyon yok"} • ${item.note || "Not yok"}`;

    const actions = `
      <button class="action-btn primary" data-type="salary" data-id="${item.id}" data-action="toggle">${item.paid ? "Bekliyor Yap" : "Ödendi Yap"}</button>
      <button class="action-btn danger" data-type="salary" data-id="${item.id}" data-action="delete">Sil</button>
    `;

    return cardHtml(item.name, badge, meta, actions, item.name.charAt(0).toUpperCase());
  }).join("");
}

function renderReports() {
  const s = computeSummary(store);

  $("reportSummary").innerHTML = `
    <div class="report-line"><span>Bu Ay Gelir</span><strong>₺ ${tl(s.monthIncome)}</strong></div>
    <div class="report-line"><span>Bu Ay Gider</span><strong>₺ ${tl(s.monthExpense)}</strong></div>
    <div class="report-line"><span>Bu Yıl Gelir</span><strong>₺ ${tl(s.yearIncome)}</strong></div>
    <div class="report-line"><span>Bu Yıl Gider</span><strong>₺ ${tl(s.yearExpense)}</strong></div>
    <div class="report-line"><span>Bana Borçlu</span><strong>₺ ${tl(s.owedToMe)}</strong></div>
    <div class="report-line"><span>Ben Borçluyum</span><strong>₺ ${tl(s.iOwe)}</strong></div>
    <div class="report-line"><span>Net Durum</span><strong>₺ ${tl(s.net)}</strong></div>
  `;

  const ctx = $("financeChart");
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Aylık Gelir", "Aylık Gider", "Yıllık Gelir", "Yıllık Gider"],
      datasets: [{
        label: "Özet",
        data: [s.monthIncome, s.monthExpense, s.yearIncome, s.yearExpense],
        borderWidth: 0,
        borderRadius: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: "#cbd5e1" },
          grid: { display: false }
        },
        y: {
          ticks: { color: "#cbd5e1" },
          grid: { color: "rgba(255,255,255,0.08)" }
        }
      }
    }
  });
}

function renderAll() {
  applyTheme();
  renderSummary();
  renderNotifications();
  renderDebts();
  renderIncome();
  renderExpense();
  renderBills();
  renderSalaries();
  renderReports();

  if (currentProfile?.username) {
    $("avatarCircle").textContent = currentProfile.username.charAt(0).toUpperCase();
  } else if (currentUser?.email) {
    $("avatarCircle").textContent = currentUser.email.charAt(0).toUpperCase();
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
}

function applyTheme() {
  document.body.classList.toggle("light", store.settings.theme === "light");
}

async function initUser(user) {
  currentUser = user;
  currentProfile = await loadProfile(user.uid);
  store = normalizeStore(await loadCloudStore(user.uid));
  saveLocalStore(store);
  showApp();
  renderAll();
}

function switchTab(tab) {
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.remove("active"));

  if (tab === "debts") $("debtsTab").classList.add("active");
  if (tab === "income") $("incomeTab").classList.add("active");
  if (tab === "expense") $("expenseTab").classList.add("active");
  if (tab === "bills") $("billsTab").classList.add("active");
  if (tab === "salary") $("salaryTab").classList.add("active");
  if (tab === "reports") $("reportsTab").classList.add("active");
  if (tab === "settings") $("settingsTab").classList.add("active");

  document.querySelector(`.nav-item[data-tab="${tab}"]`)?.classList.add("active");
}

function clearDebtForm() {
  $("personNameInput").value = "";
  $("debtAmountInput").value = "";
  $("debtDueDateInput").value = "";
  $("debtNoteInput").value = "";
  $("relationSelect").value = "they_owe_me";
}

function clearIncomeForm() {
  $("incomeTitleInput").value = "";
  $("incomeAmountInput").value = "";
  $("incomeDateInput").value = "";
  $("incomeCategoryInput").value = "";
  $("incomeNoteInput").value = "";
}

function clearExpenseForm() {
  $("expenseTitleInput").value = "";
  $("expenseAmountInput").value = "";
  $("expenseDateInput").value = "";
  $("expenseCategoryInput").value = "";
  $("expenseNoteInput").value = "";
}

function clearBillForm() {
  $("billTitleInput").value = "";
  $("billAmountInput").value = "";
  $("billDueDateInput").value = "";
  $("billCategoryInput").value = "";
  $("billNoteInput").value = "";
}

function clearSalaryForm() {
  $("salaryNameInput").value = "";
  $("salaryAmountInput").value = "";
  $("salaryDateInput").value = "";
  $("salaryRoleInput").value = "";
  $("salaryNoteInput").value = "";
}

async function addDebtHandler() {
  const name = $("personNameInput").value.trim();
  const amount = Number($("debtAmountInput").value || 0);

  if (!name || amount <= 0) {
    alert("Kişi adı ve tutar gir.");
    return;
  }

  store = addDebt(store, {
    name,
    amount,
    relation: $("relationSelect").value,
    dueDate: $("debtDueDateInput").value,
    note: $("debtNoteInput").value.trim()
  });

  await persistStore();
  clearDebtForm();
  renderAll();
}

async function addIncomeHandler() {
  const title = $("incomeTitleInput").value.trim();
  const amount = Number($("incomeAmountInput").value || 0);

  if (!title || amount <= 0) {
    alert("Gelir başlığı ve tutar gir.");
    return;
  }

  store = addIncome(store, {
    title,
    amount,
    date: $("incomeDateInput").value,
    category: $("incomeCategoryInput").value.trim(),
    note: $("incomeNoteInput").value.trim()
  });

  await persistStore();
  clearIncomeForm();
  renderAll();
}

async function addExpenseHandler() {
  const title = $("expenseTitleInput").value.trim();
  const amount = Number($("expenseAmountInput").value || 0);

  if (!title || amount <= 0) {
    alert("Gider başlığı ve tutar gir.");
    return;
  }

  store = addExpense(store, {
    title,
    amount,
    date: $("expenseDateInput").value,
    category: $("expenseCategoryInput").value.trim(),
    note: $("expenseNoteInput").value.trim()
  });

  await persistStore();
  clearExpenseForm();
  renderAll();
}

async function addBillHandler() {
  const title = $("billTitleInput").value.trim();
  const amount = Number($("billAmountInput").value || 0);

  if (!title || amount <= 0) {
    alert("Fatura adı ve tutar gir.");
    return;
  }

  store = addBill(store, {
    title,
    amount,
    dueDate: $("billDueDateInput").value,
    category: $("billCategoryInput").value.trim(),
    note: $("billNoteInput").value.trim()
  });

  await persistStore();
  clearBillForm();
  renderAll();
}

async function addSalaryHandler() {
  const name = $("salaryNameInput").value.trim();
  const amount = Number($("salaryAmountInput").value || 0);

  if (!name || amount <= 0) {
    alert("Eleman adı ve maaş gir.");
    return;
  }

  store = addSalary(store, {
    name,
    amount,
    date: $("salaryDateInput").value,
    role: $("salaryRoleInput").value.trim(),
    note: $("salaryNoteInput").value.trim()
  });

  await persistStore();
  clearSalaryForm();
  renderAll();
}

async function handleRecordActions(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const type = btn.dataset.type;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (type === "debt" && action === "delete") store = deleteDebt(store, id);
  if (type === "income" && action === "delete") store = deleteIncome(store, id);
  if (type === "expense" && action === "delete") store = deleteExpense(store, id);
  if (type === "bill" && action === "delete") store = deleteBill(store, id);
  if (type === "salary" && action === "delete") store = deleteSalary(store, id);
  if (type === "bill" && action === "toggle") store = toggleBillPaid(store, id);
  if (type === "salary" && action === "toggle") store = toggleSalaryPaid(store, id);

  await persistStore();
  renderAll();
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("Bu tarayıcı bildirim desteklemiyor.");
    return;
  }

  const permission = await Notification.requestPermission();
  store.settings.notifications = permission === "granted";
  await persistStore();
  alert(permission === "granted" ? "Bildirim izni verildi." : "Bildirim izni verilmedi.");
}

function testNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    alert("Önce bildirim izni ver.");
    return;
  }

  new Notification("Muhasebecin", {
    body: "Test bildirimi çalışıyor."
  });
}

async function toggleThemeHandler() {
  store.settings.theme = store.settings.theme === "light" ? "dark" : "light";
  await persistStore();
  renderAll();
}

function downloadJson() {
  const blob = new Blob([exportJson(store)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "muhasebecin-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function importJsonHandler(file) {
  if (!file) return;
  const text = await file.text();

  try {
    store = normalizeStore(JSON.parse(text));
    await persistStore();
    renderAll();
    alert("Yedek yüklendi.");
  } catch {
    alert("Geçersiz JSON dosyası.");
  }
}

function startVoice() {
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
  rec.onresult = async (e) => {
    const text = e.results[0][0].transcript.toLowerCase();
    const amountMatch = text.match(/\d+/);

    if (!amountMatch) {
      alert("Tutar bulunamadı.");
      return;
    }

    const amount = Number(amountMatch[0]);
    const name = text
      .replace(/\d+/g, "")
      .replace("bana borçlu", "")
      .replace("ben borçluyum", "")
      .replace("ekle", "")
      .replace("tl", "")
      .trim();

    if (!name) {
      alert("İsim bulunamadı.");
      return;
    }

    const relation = text.includes("ben borçluyum") ? "i_owe_them" : "they_owe_me";

    store = addDebt(store, {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount,
      relation,
      dueDate: "",
      note: "Sesli komut ile eklendi"
    });

    await persistStore();
    renderAll();
    alert("Sesli komut işlendi.");
  };

  rec.start();
}

function setupEvents() {
  $("loginTabBtn").addEventListener("click", () => setAuthMode("login"));
  $("registerTabBtn").addEventListener("click", () => setAuthMode("register"));
  $("authSubmitBtn").addEventListener("click", handleAuthSubmit);

  $("addDebtBtn").addEventListener("click", addDebtHandler);
  $("clearDebtFormBtn").addEventListener("click", clearDebtForm);

  $("addIncomeBtn").addEventListener("click", addIncomeHandler);
  $("clearIncomeFormBtn").addEventListener("click", clearIncomeForm);

  $("addExpenseBtn").addEventListener("click", addExpenseHandler);
  $("clearExpenseFormBtn").addEventListener("click", clearExpenseForm);

  $("addBillBtn").addEventListener("click", addBillHandler);
  $("clearBillFormBtn").addEventListener("click", clearBillForm);

  $("addSalaryBtn").addEventListener("click", addSalaryHandler);
  $("clearSalaryFormBtn").addEventListener("click", clearSalaryForm);

  $("searchInput").addEventListener("input", renderAll);

  $("debtsList").addEventListener("click", handleRecordActions);
  $("incomeList").addEventListener("click", handleRecordActions);
  $("expenseList").addEventListener("click", handleRecordActions);
  $("billList").addEventListener("click", handleRecordActions);
  $("salaryList").addEventListener("click", handleRecordActions);

  document.que
