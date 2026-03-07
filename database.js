let DB_KEY = "muhasebecin_db";

function dbYukle() {
  let veri = localStorage.getItem(DB_KEY);
  if (!veri) return [];
  return JSON.parse(veri);
}

async function dbKaydet(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));

  if (window.firebaseCloud && window.firebaseCloud.currentUser) {
    await window.firebaseCloud.saveCloudData(window.firebaseCloud.currentUser.uid, data);
  }
}

function tumKisiler() {
  return dbYukle();
}

function kisiBul(isim) {
  let kisiler = dbYukle();

  return kisiler.find(
    k => k.isim.toLowerCase() === isim.toLowerCase()
  );
}

async function kisiEkle(isim) {
  let kisiler = dbYukle();

  let yeni = {
    isim: isim,
    bakiye: 0,
    hareketler: []
  };

  kisiler.push(yeni);

  await dbKaydet(kisiler);
}

async function borcEkleDB(isim, tutar) {
  let kisiler = dbYukle();

  let kisi = kisiler.find(
    k => k.isim.toLowerCase() === isim.toLowerCase()
  );

  if (!kisi) {
    kisi = {
      isim: isim,
      bakiye: 0,
      hareketler: []
    };

    kisiler.push(kisi);
  }

  kisi.bakiye += tutar;

  kisi.hareketler.push({
    tip: "ekle",
    tutar: tutar,
    tarih: new Date().toLocaleString()
  });

  await dbKaydet(kisiler);
}

async function borcDusDB(isim, tutar) {
  let kisiler = dbYukle();

  let kisi = kisiler.find(
    k => k.isim.toLowerCase() === isim.toLowerCase()
  );

  if (!kisi) return;

  kisi.bakiye -= tutar;

  kisi.hareketler.push({
    tip: "dus",
    tutar: tutar,
    tarih: new Date().toLocaleString()
  });

  await dbKaydet(kisiler);
}

async function kisiSilDB(isim) {
  let kisiler = dbYukle();

  kisiler = kisiler.filter(
    k => k.isim.toLowerCase() !== isim.toLowerCase()
  );

  await dbKaydet(kisiler);
}

function toplamBorc() {
  let kisiler = dbYukle();

  let toplam = 0;

  kisiler.forEach(k => {
    toplam += k.bakiye;
  });

  return toplam;
}
