const STORE_KEY = "muhasebecin_store";

export function createEmptyStore() {
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

export function generateId() {
  return "id_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

export function normalizeStore(data) {
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

export function loadLocalStore() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return createEmptyStore();

  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return createEmptyStore();
  }
}

export function saveLocalStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(normalizeStore(store)));
}

export function addDebt(store, payload) {
  const next = normalizeStore(store);

  next.debts.unshift({
    id: generateId(),
    name: payload.name,
    amount: Number(payload.amount),
    relation: payload.relation,
    dueDate: payload.dueDate || "",
    note: payload.note || "",
    createdAt: new Date().toLocaleString("tr-TR")
  });

  return next;
}

export function addIncome(store, payload) {
  const next = normalizeStore(store);

  next.incomes.unshift({
    id: generateId(),
    title: payload.title,
    amount: Number(payload.amount),
    date: payload.date || "",
    category: payload.category || "",
    note: payload.note || "",
    createdAt: new Date().toLocaleString("tr-TR")
  });

  return next;
}

export function addExpense(store, payload) {
  const next = normalizeStore(store);

  next.expenses.unshift({
    id: generateId(),
    title: payload.title,
    amount: Number(payload.amount),
    date: payload.date || "",
    category: payload.category || "",
    note: payload.note || "",
    createdAt: new Date().toLocaleString("tr-TR")
  });

  return next;
}

export function addBill(store, payload) {
  const next = normalizeStore(store);

  next.bills.unshift({
    id: generateId(),
    title: payload.title,
    amount: Number(payload.amount),
    dueDate: payload.dueDate || "",
    category: payload.category || "",
    note: payload.note || "",
    paid: false,
    createdAt: new Date().toLocaleString("tr-TR")
  });

  return next;
}

export function addSalary(store, payload) {
  const next = normalizeStore(store);

  next.salaries.unshift({
    id: generateId(),
    name: payload.name,
    amount: Number(payload.amount),
    date: payload.date || "",
    role: payload.role || "",
    note: payload.note || "",
    paid: false,
    createdAt: new Date().toLocaleString("tr-TR")
  });

  return next;
}

export function toggleBillPaid(store, id) {
  const next = normalizeStore(store);
  next.bills = next.bills.map((item) =>
    item.id === id ? { ...item, paid: !item.paid } : item
  );
  return next;
}

export function toggleSalaryPaid(store, id) {
  const next = normalizeStore(store);
  next.salaries = next.salaries.map((item) =>
    item.id === id ? { ...item, paid: !item.paid } : item
  );
  return next;
}

export function deleteDebt(store, id) {
  const next = normalizeStore(store);
  next.debts = next.debts.filter((item) => item.id !== id);
  return next;
}

export function deleteIncome(store, id) {
  const next = normalizeStore(store);
  next.incomes = next.incomes.filter((item) => item.id !== id);
  return next;
}

export function deleteExpense(store, id) {
  const next = normalizeStore(store);
  next.expenses = next.expenses.filter((item) => item.id !== id);
  return next;
}

export function deleteBill(store, id) {
  const next = normalizeStore(store);
  next.bills = next.bills.filter((item) => item.id !== id);
  return next;
}

export function deleteSalary(store, id) {
  const next = normalizeStore(store);
  next.salaries = next.salaries.filter((item) => item.id !== id);
  return next;
}

function currentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}

function matchMonthYear(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (isNaN(date)) return false;

  const { month, year } = currentMonthYear();
  return date.getMonth() + 1 === month && date.getFullYear() === year;
}

export function computeSummary(store) {
  const next = normalizeStore(store);

  let owedToMe = 0;
  let iOwe = 0;
  let monthIncome = 0;
  let monthExpense = 0;
  let yearIncome = 0;
  let yearExpense = 0;

  const currentYear = new Date().getFullYear();

  next.debts.forEach((item) => {
    if (item.relation === "they_owe_me") owedToMe += Number(item.amount || 0);
    else iOwe += Number(item.amount || 0);
  });

  next.incomes.forEach((item) => {
    const amount = Number(item.amount || 0);
    const date = new Date(item.date || item.createdAt);
    if (date.getFullYear() === currentYear) yearIncome += amount;
    if (matchMonthYear(item.date || item.createdAt)) monthIncome += amount;
  });

  next.expenses.forEach((item) => {
    const amount = Number(item.amount || 0);
    const date = new Date(item.date || item.createdAt);
    if (date.getFullYear() === currentYear) yearExpense += amount;
    if (matchMonthYear(item.date || item.createdAt)) monthExpense += amount;
  });

  next.salaries.forEach((item) => {
    const amount = Number(item.amount || 0);
    const date = new Date(item.date || item.createdAt);
    if (date.getFullYear() === currentYear) yearExpense += amount;
    if (matchMonthYear(item.date || item.createdAt)) monthExpense += amount;
  });

  next.bills.forEach((item) => {
    const amount = Number(item.amount || 0);
    const date = new Date(item.dueDate || item.createdAt);
    if (date.getFullYear() === currentYear) yearExpense += amount;
    if (matchMonthYear(item.dueDate || item.createdAt)) monthExpense += amount;
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

export function getNotifications(store) {
  const next = normalizeStore(store);
  const list = [];
  const today = new Date();
  today.setHours(0,0,0,0);

  next.bills.forEach((item) => {
    if (!item.dueDate || item.paid) return;
    const d = new Date(item.dueDate);
    d.setHours(0,0,0,0);
    const diff = Math.round((d - today) / (1000*60*60*24));
    if (diff <= 3) {
      list.push({
        text: `${item.title} faturası ${diff < 0 ? Math.abs(diff) + " gün gecikti" : diff === 0 ? "bugün son gün" : diff + " gün kaldı"}`
      });
    }
  });

  next.salaries.forEach((item) => {
    if (!item.date || item.paid) return;
    const d = new Date(item.date);
    d.setHours(0,0,0,0);
    const diff = Math.round((d - today) / (1000*60*60*24));
    if (diff <= 3) {
      list.push({
        text: `${item.name} maaşı ${diff < 0 ? Math.abs(diff) + " gün gecikti" : diff === 0 ? "bugün ödenecek" : diff + " gün kaldı"}`
      });
    }
  });

  return list;
}

export function exportJson(store) {
  return JSON.stringify(normalizeStore(store), null, 2);
}
