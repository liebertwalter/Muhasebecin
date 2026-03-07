function listeyiGuncelle() {
  const liste = document.getElementById("liste");
  if (!liste) return;

  liste.innerHTML = "";

  const kisiler = tumKisiler();
  const aramaInput = document.getElementById("arama");
  const arama = aramaInput ? aramaInput.value.toLowerCase().trim() : "";

  kisiler.forEach((kisi) => {
    if (!kisi.isim.toLowerCase().includes(arama)) return;

    const kart = document.createElement("div");
    kart.className = "card";

    let hareketHTML = `<div class="hareket-list">`;

    if (kisi.hareketler && kisi.hareketler.length > 0) {
      kisi.hareketler
        .slice()
        .reverse()
        .forEach((h) => {
          hareketHTML += `
            <div class="hareket">
              ${h.tip === "ekle" ? "➕" : "➖"} ${h.tutar} TL — ${h.tarih}
            </div>
          `;
        });
    } else {
      hareketHTML += `<div class="hareket">Henüz işlem yok.</div>`;
    }

    hareketHTML += `</div>`;

    kart.innerHTML = `
      <div class="person-head">
        <div>
          <div class="person-name">${kisi.isim}</div>
          <div class="person-balance">Borç: ${kisi.bakiye} TL</div>
        </div>
        <i data-lucide="badge-dollar-sign"></i>
      </div>

      <div class="person-actions">
        <button class="btn-ekle" onclick="borcEkleUI('${escapeTekTirnak(kisi.isim)}')">
          <i data-lucide="plus"></i>
          <span>Borç Ekle</span>
        </button>

        <button class="btn-dus" onclick="borcDusUI('${escapeTekTirnak(kisi.isim)}')">
          <i data-lucide="minus"></i>
          <span>Borç Düş</span>
        </button>

        <button class="btn-sil" onclick="kisiSilUI('${escapeTekTirnak(kisi.isim)}')">
          <i data-lucide="trash-2"></i>
          <span>Sil</span>
        </button>
      </div>

      ${hareketHTML}
    `;

    liste.appendChild(kart);
  });

  toplamGuncelle();

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  if (typeof grafikCiz === "function") {
    grafikCiz();
  }
}

function borcEkleUI(isim) {
  let tutar = prompt(isim + " için eklenecek tutar:");
  if (!tutar) return;

  tutar = Number(tutar);
  if (!tutar || tutar <= 0) return;

  borcEkleDB(isim, tutar);
  listeyiGuncelle();
}

function borcDusUI(isim) {
  let tutar = prompt(isim + " için düşülecek tutar:");
  if (!tutar) return;

  tutar = Number(tutar);
  if (!tutar || tutar <= 0) return;

  borcDusDB(isim, tutar);
  listeyiGuncelle();
}

function kisiSilUI(isim) {
  const onay = confirm(isim + " silinsin mi?");
  if (!onay) return;

  kisiSilDB(isim);
  listeyiGuncelle();
}

function yeniKisi() {
  const isimInput = document.getElementById("isim");
  let isim = isimInput.value.trim();

  if (!isim) return;

  const mevcut = kisiBul(isim);
  if (mevcut) {
    alert("Bu kişi zaten var.");
    return;
  }

  kisiEkle(isim);
  isimInput.value = "";
  listeyiGuncelle();
}

function toplamGuncelle() {
  const toplamEl = document.getElementById("toplam");
  if (!toplamEl) return;

  toplamEl.innerText = toplamBorc().toLocaleString("tr-TR");
}

function aramaYap() {
  listeyiGuncelle();
}

function escapeTekTirnak(metin) {
  return String(metin).replace(/'/g, "\\'");
}

document.addEventListener("DOMContentLoaded", () => {
  listeyiGuncelle();
});
