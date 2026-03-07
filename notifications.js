/* BİLDİRİM SİSTEMİ */

function bildirimIzinIste(){

if(!("Notification" in window)){
return;
}

if(Notification.permission !== "granted"){

Notification.requestPermission();

}

}

/* BİLDİRİM GÖSTER */

function bildirimGoster(mesaj){

if(Notification.permission === "granted"){

new Notification("Muhasebecin",{
body: mesaj
});

}

}

/* HATIRLATMA KONTROLÜ */

function hatirlaticiKontrol(){

let kisiler = tumKisiler();

let bugun = new Date();

kisiler.forEach(kisi=>{

if(!kisi.odemeTarihi) return;

let tarih = new Date(kisi.odemeTarihi);

let fark = tarih - bugun;

let gun = Math.floor(fark / (10006060*24));

if(gun === 0){

bildirimGoster(kisi.isim + " borcu bugün ödenecek");

}

if(gun === -1){

bildirimGoster(kisi.isim + " borcu gecikti");

}

});

}

/* HER 1 SAATTE KONTROL */

setInterval(()=>{

hatirlaticiKontrol();

}, 3600000);

/* SAYFA AÇILINCA İZİN İSTE */

document.addEventListener("DOMContentLoaded",()=>{

bildirimIzinIste();

});
