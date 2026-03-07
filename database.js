/* VERİTABANI MOTORU */

let DB_KEY = "muhasebecin_db";

function dbYukle(){
let veri = localStorage.getItem(DB_KEY);
if(!veri) return [];
return JSON.parse(veri);
}

function dbKaydet(data){
localStorage.setItem(DB_KEY, JSON.stringify(data));
}

/* TÜM KİŞİLER */

function tumKisiler(){
return dbYukle();
}

/* KİŞİ BUL */

function kisiBul(isim){

let kisiler = dbYukle();

return kisiler.find(k =>
k.isim.toLowerCase() === isim.toLowerCase()
);

}

/* KİŞİ EKLE */

function kisiEkle(isim){

let kisiler = dbYukle();

let yeni = {
isim: isim,
bakiye: 0,
hareketler: []
};

kisiler.push(yeni);

dbKaydet(kisiler);

}

/* BORÇ EKLE */

function borcEkleDB(isim, tutar){

let kisiler = dbYukle();

let kisi = kisiler.find(k =>
k.isim.toLowerCase() === isim.toLowerCase()
);

if(!kisi){

kisi = {
isim: isim,
bakiye:0,
hareketler:[]
};

kisiler.push(kisi);

}

kisi.bakiye += tutar;

kisi.hareketler.push({
tip:"ekle",
tutar:tutar,
tarih:new Date().toLocaleString()
});

dbKaydet(kisiler);

}

/* BORÇ DÜŞ */

function borcDusDB(isim, tutar){

let kisiler = dbYukle();

let kisi = kisiler.find(k =>
k.isim.toLowerCase() === isim.toLowerCase()
);

if(!kisi) return;

kisi.bakiye -= tutar;

kisi.hareketler.push({
tip:"dus",
tutar:tutar,
tarih:new Date().toLocaleString()
});

dbKaydet(kisiler);

}

/* KİŞİ SİL */

function kisiSilDB(isim){

let kisiler = dbYukle();

kisiler = kisiler.filter(k =>
k.isim.toLowerCase() !== isim.toLowerCase()
);

dbKaydet(kisiler);

}

/* TOPLAM BORÇ */

function toplamBorc(){

let kisiler = dbYukle();

let toplam = 0;

kisiler.forEach(k=>{
toplam += k.bakiye;
});

return toplam;

}
