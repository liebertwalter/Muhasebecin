/* YARDIMCI FONKSİYONLAR */

/* PARA FORMAT */

function paraFormatla(deger){

return Number(deger).toLocaleString("tr-TR") + " TL";

}

/* TARİH FORMAT */

function tarihFormatla(tarih){

let d = new Date(tarih);

return d.toLocaleDateString("tr-TR") + " " + d.toLocaleTimeString("tr-TR");

}

/* SAYI KONTROL */

function sayiMi(x){

return !isNaN(x);

}

/* ID ÜRET */

function idUret(){

return "id-" + Date.now() + "-" + Math.floor(Math.random()*1000);

}

/* BOŞ MU */

function bosMu(x){

return x === null || x === undefined || x === "";

}

/* GÜVENLİ SAYI */

function guvenliSayi(x){

let n = Number(x);

if(isNaN(n)) return 0;

return n;

}
