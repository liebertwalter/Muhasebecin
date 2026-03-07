let recognitionInstance = null;

function sesliKomutBaslat() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Bu tarayıcı sesli komutu desteklemiyor. Telefonda Chrome ile dene.");
    return;
  }

  recognitionInstance = new SpeechRecognition();
  recognitionInstance.lang = "tr-TR";
  recognitionInstance.continuous = false;
  recognitionInstance.interimResults = false;
  recognitionInstance.maxAlternatives = 1;

  recognitionInstance.onstart = function () {
    alert("Dinliyorum... Komut söyle.");
  };

  recognitionInstance.onerror = function (event) {
    alert("Sesli komut hatası: " + event.error);
  };

  recognitionInstance.onresult = function (event) {
    const komut = event.results[0][0].transcript.toLowerCase().trim();
    komutIsle(komut);
  };

  recognitionInstance.start();
}

function komutIsle(komut) {
  const temizKomut = komut
    .replaceAll("’", "'")
    .replaceAll(" tl", "")
    .replaceAll(" lira", "")
    .replaceAll(" türk lirası", "")
    .trim();

  const tutarEslesme = temizKomut.match(/\d+/);
  if (!tutarEslesme) {
    alert("Tutar bulunamadı. Örnek: Ahmet 100 ekle");
    return;
  }

  const tutar = Number(tutarEslesme[0]);

  let islemTipi = "ekle";
  if (
    temizKomut.includes("düş") ||
    temizKomut.includes("dus") ||
    temizKomut.includes("çıkar") ||
    temizKomut.includes("cikar") ||
    temizKomut.includes("azalt")
  ) {
    islemTipi = "dus";
  }

  let isim = temizKomut
    .replace(/\d+/g, "")
    .replace("borcuna", "")
    .replace("borcundan", "")
    .replace("borçuna", "")
    .replace("borçundan", "")
    .replace("ekle", "")
    .replace("çıkar", "")
    .replace("cikar", "")
    .replace("düş", "")
    .replace("dus", "")
    .replace("azalt", "")
    .replace(/['’]?[iaeuü]$/i, "")
    .trim();

  if (!isim) {
    alert("Kişi adı bulunamadı. Örnek: Ahmet 100 ekle");
    return;
  }

  isim = isim
    .split(" ")
    .filter(Boolean)
    .map(kelime => kelime.charAt(0).toUpperCase() + kelime.slice(1))
    .join(" ");

  if (islemTipi === "dus") {
    borcDusDB(isim, tutar);
    alert(`${isim} için ${tutar} TL düşüldü.`);
  } else {
    borcEkleDB(isim, tutar);
    alert(`${isim} için ${tutar} TL eklendi.`);
  }

  if (typeof listeyiGuncelle === "function") {
    listeyiGuncelle();
  }

  if (typeof grafikCiz === "function") {
    grafikCiz();
  }
}
