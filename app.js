const STORE_KEY = "muhasebecin_local_v1";

const $ = (id) => document.getElementById(id);

let store = loadStore();
let chartInstance = null;

function createEmptyStore() {
  return {
    debts: [],
    incomes: [],
    expenses: [],
    bills: [],
    salaries: [],
    settings: {
      theme: "dark",
      notifications: false
    }
  };
}

function loadStore() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return createEmptyStore();
  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return createEmptyStore();
  }
}

function saveStore() {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function normalizeStore(data) {
  const base = createEmptyStore();
  if (!data || typeof data !== "object") return base;
  return {
    debts: Array.isArray(data.debts) ? data.debts : [],
    incomes: Array.isArray(data.incomes) ? data.incomes : [],
    expenses: Array.isArray(data.expenses) ? data.expenses : [],
    bills: Array.isArray(data.bills) ? data.bills : [],
    salaries: Array.isArray(data.salaries) ? data.salaries : [],
    settings: { ...base.settings, ...(data.settings || {}) }
  };
}

function id() {
  return "id_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

function tl(v) {
  return Number(v || 0).toLocaleString("tr-TR");
}

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

function monthYearMatch(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function yearMatch(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear();
}

function computeSummary() {
  let owedToMe = 0;
  let iOwe = 0;
  let monthIncome = 0;
  let monthExpense = 0;
  let yearIncome = 0;
  let yearExpense = 0;

  store.debts.forEach((item) => {
    if (item.relation === "they_owe_me") owedToMe += Number(item.amount || 0);
    else iOwe += Number(item.amount || 0);
  });

  store.incomes.forEach((item) => {
    const amount = Number(item.amount || 0);
    if (monthYearMatch(item.date)) monthIncome += amount;
    if (yearMatch(item.date)) yearIncome += amount;
  });

  store.expenses.forEach((item) => {
    const amount = Number(item.amount || 0);
    if (monthYearMatch(item.date)) monthExpense += amount;
    if (yearMatch(item.date)) yearExpense += amount;
  });

  store.bills.forEach((item) => {
    const amount = Number(item.amount || 0);
    if (monthYearMatch(item.dueDate)) monthExpense += amount;
    if (yearMatch(item.dueDate)) yearExpense += amount;
  });

  store.salaries.forEach((item) => {
    const amount = Number(item.amount || 0);
    if (monthYearMatch(item.date)) monthExpense += amount;
    if (yearMatch(item.date)) yearExpense += amount;
  });

  return {
    owedToMe,
    iOwe,
    monthIncome,
    monthExpense,
    yearIncome,
    yearExpense,
    net: (monthIncome + owedToMe) - (monthExpense + iOwe)
  };
}

function getNotifications() {
  const items = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  store.bills.forEach((item) => {
    if (!item.dueDate || item.paid) return;
    const d = new Date(item.dueDate);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
    if (diff <= 3) {
      items.push({
        text: `${item.title} faturası ${
          diff < 0 ? Math.abs(diff) + " gün gecikti" : diff === 0 ? "bugün son gün" : diff + " gün kaldı"
        }`
      });
    }
  });

  store.salaries.forEach((item) => {
    if (!item.date || item.paid) return;
    const d = new Date(item.date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
    if (diff <= 3) {
      items.push({
        text: `${item.name} maaşı ${
          diff < 0 ? Math.abs(diff) + " gün gecikti" : diff === 0 ? "bugün ödenecek" : diff + " gün kaldı"
        }`
      });
    }
  });

  return items;
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

function renderSummary() {
  const s = computeSummary();
  $("netTotal").textContent = tl(s.net);
  $("monthIncome").textContent = tl(s.monthIncome);
  $("monthExpense").textContent = tl(s.monthExpense);
  $("owedToMeTotal").textContent = tl(s.owedToMe);
  $("iOweTotal").textContent = tl(s.iOwe);
  $("summaryMini").textContent = "Veriler bu cihazda saklanıyor";
}

function renderNotifications() {
  const list = getNotifications();

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
    const actions = `<button class="action-btn danger" data-type="debt" data-id="${item.id}" data-action="delete">Sil</button>`;

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
  const s = computeSummary();

  $("reportSummary").innerHTML = `
    <div class="report-line"><span>Bu Ay Gelir</span><strong>₺ ${tl(s.monthIncome)}</strong></div>
    <div class="report-line"><span>Bu Ay Gider</span><strong>₺ ${tl(s.monthExpense)}</strong></div>
    <div class="report-line"><span>Bu Yıl Gelir</span><strong>₺ ${tl(s.yearIncome)}</strong></div>
    <div class="report-line"><span>Bu Yıl Gider</span><strong>₺ ${tl(s.yearExpense)}</strong></div>
    <div class="report-line"><span>Bana Borçlu</span><strong>₺ ${tl(s.owedToMe)}</strong></div>
    <div class="report-line"><span>Ben Borçluyum</span><strong>₺ ${tl(s.iOwe)}</strong></div>
    <div class="report-line"><span>Net Durum</span><strong>₺ ${tl(s.net)}</strong></div>
  `;

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart($("financeChart"), {
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
  document.body.classList.toggle("light", store.settings.theme === "light");
  renderSummary();
  renderNotifications();
  renderDebts();
  renderIncome();
  renderExpense();
  renderBills();
  renderSalaries();
  renderReports();
  if (typeof lucide !== "undefined") lucide.createIcons();
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

function addDebtHandler() {
  const name = $("personNameInput").value.trim();
  const amount = Number($("debtAmountInput").value || 0);

  if (!name || amount <= 0) {
    alert("Kişi adı ve tutar gir.");
    return;
  }

  store.debts.unshift({
    id: id(),
    name,
    amount,
    relation: $("relationSelect").value,
    dueDate: $("debtDueDateInput").value,
    note: $("debtNoteInput").value.trim()
  });

  saveStore();
  clearDebtForm();
  renderAll();
}

function addIncomeHandler() {
  const title = $("incomeTitleInput").value.trim();
  const amount = Number($("incomeAmountInput").value || 0);

  if (!title || amount <= 0) {
    alert("Gelir başlığı ve tutar gir.");
    return;
  }

  store.incomes.unshift({
    id: id(),
    title,
    amount,
    date: $("incomeDateInput").value || nowDate(),
    category: $("incomeCategoryInput").value.trim(),
    note: $("incomeNoteInput").value.trim()
  });

  saveStore();
  clearIncomeForm();
  renderAll();
}

function addExpenseHandler() {
  const title = $("expenseTitleInput").value.trim();
  const amount = Number($("expenseAmountInput").value || 0);

  if (!title || amount <= 0) {
    alert("Gider başlığı ve tutar gir.");
    return;
  }

  store.expenses.unshift({
    id: id(),
    title,
    amount,
    date: $("expenseDateInput").value || nowDate(),
    category: $("expenseCategoryInput").value.trim(),
    note: $("expenseNoteInput").value.trim()
  });

  saveStore();
  clearExpenseForm();
  renderAll();
}

function addBillHandler() {
  const title = $("billTitleInput").value.trim();
  const amount = Number($("billAmountInput").value || 0);

  if (!title || amount <= 0) {
    alert("Fatura adı ve tutar gir.");
    return;
  }

  store.bills.unshift({
    id: id(),
    title,
    amount,
    dueDate: $("billDueDateInput").value || nowDate(),
    category: $("billCategoryInput").value.trim(),
    note: $("billNoteInput").value.trim(),
    paid: false
  });

  saveStore();
  clearBillForm();
  renderAll();
}

function addSalaryHandler() {
  const name = $("salaryNameInput").value.trim();
  const amount = Number($("salaryAmountInput").value || 0);

  if (!name || amount <= 0) {
    alert("Eleman adı ve maaş gir.");
    return;
  }

  store.salaries.unshift({
    id: id(),
    name,
    amount,
    date: $("salaryDateInput").value || nowDate(),
    role: $("salaryRoleInput").value.trim(),
    note: $("salaryNoteInput").value.trim(),
    paid: false
  });

  saveStore();
  clearSalaryForm();
  renderAll();
}

function handleRecordActions(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const type = btn.dataset.type;
  const action = btn.dataset.action;
  const itemId = btn.dataset.id;

  if (type === "debt" && action === "delete") {
    store.debts = store.debts.filter((x) => x.id !== itemId);
  }
  if (type === "income" && action === "delete") {
    store.incomes = store.incomes.filter((x) => x.id !== itemId);
  }
  if (type === "expense" && action === "delete") {
    store.expenses = store.expenses.filter((x) => x.id !== itemId);
  }
  if (type === "bill" && action === "delete") {
    store.bills = store.bills.filter((x) => x.id !== itemId);
  }
  if (type === "salary" && action === "delete") {
    store.salaries = store.salaries.filter((x) => x.id !== itemId);
  }
  if (type === "bill" && action === "toggle") {
    store.bills = store.bills.map((x) => x.id === itemId ? { ...x, paid: !x.paid } : x);
  }
  if (type === "salary" && action === "toggle") {
    store.salaries = store.salaries.map((x) => x.id === itemId ? { ...x, paid: !x.paid } : x);
  }

  saveStore();
  renderAll();
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("Bu tarayıcı bildirim desteklemiyor.");
    return;
  }

  const permission = await Notification.requestPermission();
  store.settings.notifications = permission === "granted";
  saveStore();
  alert(permission === "granted" ? "Bildirim izni verildi." : "Bildirim izni verilmedi.");
}

function testNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    alert("Önce bildirim izni ver.");
    return;
  }
  new Notification("Muhasebecin", { body: "Test bildirimi çalışıyor." });
}

function toggleThemeHandler() {
  store.settings.theme = store.settings.theme === "light" ? "dark" : "light";
  saveStore();
  renderAll();
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "muhasebecin-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importJsonHandler(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      store = normalizeStore(JSON.parse(reader.result));
      saveStore();
      renderAll();
      alert("Yedek yüklendi.");
    } catch {
      alert("Geçersiz JSON dosyası.");
    }
  };
  reader.readAsText(file);
}

function resetAllData() {
  const ok = confirm("Tüm veriler silinsin mi?");
  if (!ok) return;
  store = createEmptyStore();
  saveStore();
  renderAll();
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
  rec.onresult = (e) => {
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

    store.debts.unshift({
      id: id(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount,
      relation,
      dueDate: "",
      note: "Sesli komut ile eklendi"
    });

 
