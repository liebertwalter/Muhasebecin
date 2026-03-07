const LOCAL_KEY = "muhasebecin_store";

export function createEmptyStore() {
  return {
    people: [],
    settings: {
      theme: "dark",
      notifications: false
    }
  };
}

export function normalizeStore(data) {
  const base = createEmptyStore();

  if (!data || typeof data !== "object") {
    return base;
  }

  return {
    people: Array.isArray(data.people) ? data.people.map(normalizePerson) : [],
    settings: {
      ...base.settings,
      ...(data.settings || {})
    }
  };
}

function normalizePerson(person) {
  return {
    id: person.id || generateId(),
    name: person.name || "İsimsiz",
    relation: person.relation === "i_owe_them" ? "i_owe_them" : "they_owe_me",
    balance: Number(person.balance) || 0,
    dueDate: person.dueDate || "",
    note: person.note || "",
    history: Array.isArray(person.history) ? person.history : []
  };
}

export function loadLocalStore() {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return createEmptyStore();

  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return createEmptyStore();
  }
}

export function saveLocalStore(store) {
  const normalized = normalizeStore(store);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(normalized));
}

export function generateId() {
  return "id_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

export function addPersonRecord(store, payload) {
  const next = normalizeStore(store);

  const person = {
    id: generateId(),
    name: payload.name.trim(),
    relation: payload.relation,
    balance: Number(payload.amount) || 0,
    dueDate: payload.dueDate || "",
    note: payload.note || "",
    history: [
      {
        id: generateId(),
        type: "create",
        amount: Number(payload.amount) || 0,
        note: payload.note || "İlk kayıt",
        at: new Date().toLocaleString("tr-TR")
      }
    ]
  };

  next.people.unshift(person);
  return next;
}

export function addTransaction(store, personId, amount, note = "Borç eklendi") {
  const next = normalizeStore(store);

  next.people = next.people.map((person) => {
    if (person.id !== personId) return person;

    return {
      ...person,
      balance: Number(person.balance) + Number(amount),
      history: [
        ...person.history,
        {
          id: generateId(),
          type: "add",
          amount: Number(amount),
          note,
          at: new Date().toLocaleString("tr-TR")
        }
      ]
    };
  });

  return next;
}

export function recordPayment(store, personId, amount, note = "Ödeme girildi") {
  const next = normalizeStore(store);

  next.people = next.people.map((person) => {
    if (person.id !== personId) return person;

    const newBalance = Math.max(0, Number(person.balance) - Number(amount));

    return {
      ...person,
      balance: newBalance,
      history: [
        ...person.history,
        {
          id: generateId(),
          type: "payment",
          amount: Number(amount),
          note,
          at: new Date().toLocaleString("tr-TR")
        }
      ]
    };
  });

  return next;
}

export function toggleRelation(store, personId) {
  const next = normalizeStore(store);

  next.people = next.people.map((person) => {
    if (person.id !== personId) return person;

    return {
      ...person,
      relation: person.relation === "they_owe_me" ? "i_owe_them" : "they_owe_me",
      history: [
        ...person.history,
        {
          id: generateId(),
          type: "relation",
          amount: 0,
          note: "Borç yönü değiştirildi",
          at: new Date().toLocaleString("tr-TR")
        }
      ]
    };
  });

  return next;
}

export function updateDueDate(store, personId, dueDate) {
  const next = normalizeStore(store);

  next.people = next.people.map((person) => {
    if (person.id !== personId) return person;

    return {
      ...person,
      dueDate,
      history: [
        ...person.history,
        {
          id: generateId(),
          type: "date",
          amount: 0,
          note: "Vade tarihi güncellendi",
          at: new Date().toLocaleString("tr-TR")
        }
      ]
    };
  });

  return next;
}

export function deletePerson(store, personId) {
  const next = normalizeStore(store);
  next.people = next.people.filter((person) => person.id !== personId);
  return next;
}

export function computeSummary(store) {
  const normalized = normalizeStore(store);

  let owedToMe = 0;
  let iOwe = 0;

  normalized.people.forEach((person) => {
    if (person.relation === "they_owe_me") {
      owedToMe += Number(person.balance);
    } else {
      iOwe += Number(person.balance);
    }
  });

  return {
    owedToMe,
    iOwe,
    net: owedToMe - iOwe,
    personCount: normalized.people.length
  };
}

export function getUpcomingNotifications(store) {
  const normalized = normalizeStore(store);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return normalized.people
    .filter((person) => person.dueDate)
    .map((person) => {
      const date = new Date(person.dueDate);
      date.setHours(0, 0, 0, 0);

      const diffDays = Math.round((date - today) / (1000 * 60 * 60 * 24));

      return {
        person,
        diffDays
      };
    })
    .filter((item) => item.diffDays <= 3)
    .sort((a, b) => a.diffDays - b.diffDays);
}

export function exportStoreAsJson(store) {
  return JSON.stringify(normalizeStore(store), null, 2);
}

export function exportStoreAsCsv(store) {
  const normalized = normalizeStore(store);
  const header = "Ad,Durum,Bakiye,Vade,Not\n";

  const rows = normalized.people.map((person) => {
    const relationText = person.relation === "they_owe_me" ? "Bana Borçlu" : "Ben Borçluyum";
    const safeNote = (person.note || "").replace(/,/g, " ");
    return `${person.name},${relationText},${person.balance},${person.dueDate || ""},${safeNote}`;
  });

  return header + rows.join("\n");
      }
