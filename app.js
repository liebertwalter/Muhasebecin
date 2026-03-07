document.addEventListener("DOMContentLoaded", () => {
  const STORE_KEY = "muhasebecin_local_v2";

  const $ = (id) => document.getElementById(id);

  let chartInstance = null;
  let store = loadStore();

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

  function normalizeStore(data) {
    const base = createEmptyStore();
    if (!data || typeof data !== "object") return base;

    return {
      debts: Array.isArray(data.debts) ? data.debts : [],
      incomes: Array.isArray(data.incomes) ? data.incomes : [],
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      bills: Array.isArray(data.bills) ? data.bills : [],
      salaries: Array.isArray(data.salaries) ? data.salaries : [],
      settings: {
        ...base.settings,
        ...(data.settings || {})
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

  function uid() {
    return "id_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  }

  function tl(v) {
    return Number(v || 0).toLocaleString("tr-TR");
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function monthYearMatch(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d)) return false;
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  function yearMatch(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d)) return false;
    return d.getFullYear() === new Date().getFullYear();
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
          text: `${item.title} faturası ${diff < 0 ? Math.abs(diff) + " gün gecikti" : diff === 0 ? "bugün son gün" : diff + " gün kaldı"}`
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
          text: `${item.name} maaşı ${diff < 0 ? Math.abs(diff) + " gün gecikti" : diff === 0 ? "bugün ödenecek" : diff + " gün kaldı"}`
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

    if ($("netTotal")) $("netTotal").textContent = tl(s.net);
    if ($("monthIncome")) $("monthIncome").textContent = tl(s.monthIncome);
    if ($("monthExpense")) $("monthExpense").textContent = tl(s.monthExpense);
    if ($("owedToMeTotal")) $("owedToMeTotal").textContent = tl(s.owedToMe);
    if ($("iOweTotal")) $("iOweTotal").textContent = tl(s.iOwe);
    if ($("summaryMini")) $("summaryMini").textContent = "Sistem hazır";
  }

  function renderNotifications() {
    const list = getNotifications();

    if (!$("notificationList") || !$("notificationBadge")) return;

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
    if (!$("debtsList")) return;

    const q = ($("searchInput")?.value || "").trim().toLowerCase();
    const items = store.debts.filter((x) => (x.name || "").toLowerCase().includes(q));

    if (!items.length) {
      $("debtsList").innerHTML = `<div class="glass-card empty-state">Borç kaydı yok.</div>`;
      return;
    }

    $("debtsList").innerHTML = items.map((item) => {
      const badge = item.relation === "they_owe_me"
        ? `<div class="record-badge badge-positive">Bana borçlu — ₺ ${tl(item.amount)}</div>`
        : `<div class="record-badge badge-negative">Ben borçluyum — ₺ ${tl(item.amount)}</div>`;

      const meta = `${item.dueDate ? "Vade: " + item.dueDate + " • " : ""}${item.note || "Not yok"}`;
      const actions = `<button class="action-btn danger" type="button" data-type="debt" data-id="${item.id}" data-action="delete">Sil</button>`;
      return cardHtml(item.name, badge, meta, actions, (item.name || "K").charAt(0).toUpperCase());
    }).join("");
  }

  function renderIncome() {
    if (!$("incomeList")) return;

    const q = ($("searchInput")?.value || "").trim().toLowerCase();
    const items = store.incomes.filter((x) => (x.title || "").toLowerCase().includes(q));

    if (!items.length) {
      $("incomeList").innerHTML = `<div class="glass-card empty-state">Gelir kaydı yok.</div>`;
      return;
    }

    $("incomeList").innerHTML = items.map((item) => {
      const badge = `<div class="record-badge badge-positive">Gelir — ₺ ${tl(item.amount)}</div>`;
      const meta = `${item.date || ""} • ${item.category || "Kategori yok"} • ${item.note || "Not yok"}`;
      const actions = `<button class="action-btn danger" type="button" data-type="income" data-id="${item.id}" data-action="delete">Sil</button>`;
      return cardHtml(item.title, badge, meta, actions, "₺");
    }).join("");
  }

  function renderExpense() {
    if (!$("expenseList")) return;

    const q = ($("searchInput")?.value || "").trim().toLowerCase();
    const items = store.expenses.filter((x) => (x.title || "").toLowerCase().includes(q));

    if (!items.length) {
      $("expenseList").innerHTML = `<div class="glass-card empty-state">Gider kaydı yok.</div>`;
      return;
    }

    $("expenseList").innerHTML = items.map((item) => {
      const badge = `<div class="record-badge badge-negative">Gider — ₺ ${tl(item.amount)}</div>`;
      const meta = `${item.date || ""} • ${item.category || "Kategori yok"} • ${item.note || "Not yok"}`;
      const actions = `<button class="action-btn danger" type="button" data-type="expense" data-id="${item.id}" data-action="delete">Sil</button>`;
      return cardHtml(item.title, badge, meta, actions, "₺");
    }).join("");
  }

  function renderBills() {
    if (!$("billList")) return;

    const q = ($("searchInput")?.value || "").trim().toLowerCase();
    const items = store.bills.filter((x) => (x.title || "").toLowerCase().includes(q));

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
        <button class="action-btn primary" type="button" data-type="bill" data-id="${item.id}" data-action="toggle">${item.paid ? "Bekliyor Yap" : "Ödendi Yap"}</button>
        <button class="action-btn danger" type="button" data-type="bill" data-id="${item.id}" data-action="delete">Sil</button>
      `;
      return cardHtml(item.title, badge, meta, actions, "F");
    }).join("");
  }

  function renderSalaries() {
    if (!$("salaryList")) return;

    const q = ($("searchInput")?.value || "").trim().toLowerCase();
    const items = store.salaries.filter((x) => (x.name || "").toLowerCase().includes(q));

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
        <button class="action-btn primary" type="button" data-type="salary" data-id="${item.id}" data-action="toggle">${item.paid ? "Bekliyor Yap" : "Ödendi Yap"}</button>
        <button class="action-btn danger" type="button" data-type="salary" data-id="${item.id}" data-action="delete">Sil</button>
      `;
      return cardHtml(item.name, badge, meta, actions, (item.name || "M").charAt(0).toUpperCase());
    }).join("");
  }

  function renderReports() {
    if (!$("reportSummary")) return;

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

    if (!$("financeChart") || typeof Chart === "undefined") return;

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

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  function switchTab(tab) {
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.remove("active"));

    if ($(tab + "Tab")) $(tab + "Tab").classList.add("active");
    const activeBtn = document.querySelector(`.nav-item[data-tab="${tab}"]`);
    if (activeBtn) activeBtn.classList.add("active");
  }

  function clearDebtForm() {
    if ($("personNameInput")) $("personNameInput").value = "";
    if ($("debtAmountInput")) $("debtAmountInput").value = "";
    if ($("debtDueDateInput")) $("debtDueDateInput").value = "";
    if ($("debtNoteInput")) $("debtNoteInput").value = "";
    if ($("relationSelect")) $("relationSelect").value = "they_owe_me";
  }

  function clearIncomeForm() {
    if ($("incomeTitleInput")) $("incomeTitleInput").value = "";
    if ($("incomeAmountInput")) $("incomeAmountInput").value = "";
    if ($("incomeDateInput")) $("incomeDateInput").value = "";
    if ($("incomeCategoryInput")) $("incomeCategoryInput").value = "";
    if ($("incomeNoteInput")) $("incomeNoteInput").value = "";
  }

  function clearExpenseForm() {
    if ($("expenseTitleInput")) $("expenseTitleInput").value = "";
    if ($("expenseAmountInput")) $("expenseAmountInput").value = "";
    if ($("expenseDateInput")) $("expenseDateInput").value = "";
    if ($("expenseCategoryInput")) $("expenseCategoryInput").value = "";
    if ($("expenseNoteInput")) $("expenseNoteInput").value = "";
  }

  function clearBillForm() {
    if ($("billTitleInput")) $("billTitleInput").value = "";
    if ($("billAmountInput")) $("billAmountInput").value = "";
    if ($("billDueDateInput")) $("billDueDateInput").value = "";
    if ($("billCategoryInput")) $("billCategoryInput").value = "";
    if ($("billNoteInput")) $("billNoteInput").value = "";
  }

  function clearSalaryForm() {
    if ($("salaryNameInput")) $("salaryNameInput").value = "";
    if ($("salaryAmountInput")) $("salaryAmountInput").value = "";
    if ($("salaryDateInput")) $("salaryDateInput").value = "";
    if ($("salaryRoleInput")) $("salaryRoleInput").value = "";
    if ($("salaryNoteInput")) $("salaryNoteInput").value = "";
  }

  function addDebtHandler() {
    const name = $("personNameInput")?.value.trim();
    const amount = Number($("debtAmountInput")?.value || 0);

    if (!name || amount <= 0) {
      alert("Kişi adı ve tutar gir.");
      return;
    }

    store.debts.unshift({
      id: uid(),
      name,
      amount,
      relation: $("relationSelect")?.value || "they_owe_me",
      dueDate: $("debtDueDateInput")?.value || "",
      note: $("debtNoteInput")?.value.trim() || ""
    });

    saveStore();
    clearDebtForm();
    renderAll();
  }

  function addIncomeHandler() {
    const title = $("incomeTitleInput")?.value.trim();
    const amount = Number($("incomeAmountInput")?.value || 0);

    if (!title || amount <= 0) {
      alert("Gelir başlığı ve tutar gir.");
      return;
    }

    store.incomes.unshift({
      id: uid(),
      title,
      amount,
      date: $("incomeDateInput")?.value || nowDate(),
      category: $("incomeCategoryInput")?.value.trim() || "",
      note: $("incomeNoteInput")?.value.trim() || ""
    });

    saveStore();
    clearIncomeForm();
    renderAll();
  }

  function addExpenseHandler() {
    const title = $("expenseTitleInput")?.value.trim();
    const amount = Number($("expenseAmountInput")?.value || 0);

    if (!title || amount <= 0) {
      alert("Gider başlığı ve tutar gir.");
      return;
    }

    store.expenses.unshift({
      id: uid(),
      title,
      amount,
      date: $("expenseDateInput")?.value || nowDate(),
      category: $("expenseCategoryInput")?.value.trim() || "",
      note: $("expenseNoteInput")?.value.trim() || ""
    });

    saveStore();
    clearExpenseForm();
    renderAll();
  }

  function addBillHandler() {
    const title = $("billTitleInput")?.value.trim();
    const amount = Number($("billAmountInput")?.value || 0);

    if (!title || amount <= 0) {
      alert("Fatura adı ve tutar gir.");
      return;
    }

    store.bills.unshift({
      id: uid(),
      title,
      amount,
      dueDate: $("billDueDateInput")?.value || nowDate(),
      category: $("billCategoryInput")?.value.trim() || "",
      note: $("billNoteInput")?.value.trim() || "",
      paid: false
    });

    saveStore();
    clearBillForm();
    renderAll();
  }

  function addSalaryHandler() {
    const name = $("salaryNameInput")?.value.trim();
    const amount = Number($("salaryAmountInput")?.value || 0);

    if (!name || amount <= 0) {
      alert("Eleman adı ve maaş gir.");
      return;
    }

    store.salaries.unshift({
      id: uid(),
      name,
      amount,
      date: $("salaryDateInput")?.value || nowDate(),
      role: $("salaryRoleInput")?.value.trim() || "",
      note: $("salaryNoteInput")?.value.trim() || "",
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

  funct
