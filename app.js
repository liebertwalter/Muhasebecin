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
    kart.className = "glass-card person-card";

    const bakiyeSinif = kisi.bakiye >= 500 ? "orange" : "";

    let hareketHTML = `<div class="hareket-list">`;

    if (kisi.hareketler && kisi.hareketler.length > 0) {
      kisi.hareketler
        .slice()
        .reverse()
        .slice(0, 3)
        .forEach((h) => {
          hareketHTML += `
            <div class="hareket ${h.tip === "ekle" ? "plus" : "minus"}">
              <span>${h.tutar} TL ${h.tip === "ekle" ? "eklendi" : "düşüldü"}</span>
            </div>
          `;
        });
    } else {
      hareketHTML += `<div class="hareket plus"><span>Henüz işlem yok</span></div>`;
    }

    hareketHTML += `</div>`;

    kart.innerHTML = `
      <div class="person-top">
        <div class="person-left">
          <div class="person-avatar">
            ${kisi.isim.charAt(0).toUpperCase()}
            <span class="person-avatar-dot"></span>
          </div>

          <div>
            <div class="person-name">${kisi.isim}</div>
            <div class="person-badge ${bakiyeSinif}">
              ₺ ${Number(kisi.bakiye).toLocaleString("tr-TR")} Borçlu
            </div>
          </div>
        </div>

        <button class="person-menu" type="button">
          <i data-lucide="more-horizontal"></i>
        </button>
      </div>

      ${hareketHTML}

      <div class="person-actions">
        <button class="action-btn" onclick="borcEkleUI('${escapeTekTirnak(kisi.isim)}')">
          <i data-lucide="hand-coins"></i>
          <span>Borç Ekle</span>
        </button>

        <button class="action-btn" onclick="borcDusUI('${escapeTekTirnak(kisi.isim)}')">
          <i data-lucide="briefcase-business"></i>
          <span>Borç Düş</span>
        </button>

        <button class="action-btn primary" onclick="kisiDetayUI('${escapeTekTirnak(kisi.isim)}')">
          <i data-lucide="folder-open"></i>
          <span>Detaylar</span>
        </button>

        <button class="action-btn warn" onclick="kisiSilUI('${escapeTekTirnak(kisi.isim)}')">
          <i data-lucide="trash-2"></i>
          <span>Sil</span>
        </button>
      </div>
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

function kisiDetayUI(isim) {
  const kisi = kisiBul(isim);
  if (!kisi) return;

  alert(
    `${kisi.isim}\nToplam Borç: ${kisi.bakiye} TL\nİşlem Sayısı: ${kisi.hareketler.length}`
  );
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
