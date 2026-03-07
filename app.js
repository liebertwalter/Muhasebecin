/* ANA UYGULAMA KONTROLÜ */

function listeyiGuncelle(){

let liste = document.getElementById("liste");

if(!liste) return;

liste.innerHTML="";

let kisiler = tumKisiler();

let aramaInput = document.getElementById("arama");

let arama = "";

if(aramaInput){
arama = aramaInput.value.toLowerCase();
}

kisiler.forEach(kisi=>{

if(!kisi.isim.toLowerCase().includes(arama)) return;

let kart = document.createElement("div");
kart.className="card";

let hareketHTML="";

kisi.hareketler.slice().reverse().forEach(h=>{

hareketHTML += `

<div class="hareket">
${h.tip=="ekle" ? "+" : "-"} ${h.tutar} TL
(${h.tarih})
</div>
`;});

kart.innerHTML = `
<b>${kisi.isim}</b><br>
Borç: ${kisi.bakiye} TL

<br><br>

<button class="btn-ekle" onclick="borcEkleUI('${kisi.isim}')">+ Borç</button>
<button class="btn-dus" onclick="borcDusUI('${kisi.isim}')">- Borç</button>
<button class="btn-sil" onclick="kisiSilUI('${kisi.isim}')">Sil</button>

<br><br>

${hareketHTML}
`;

liste.appendChild(kart);

});

toplamGuncelle();

}

/* BORÇ EKLE */

function borcEkleUI(isim){

let tutar = prompt(isim + " için eklenecek tutar:");

if(!tutar) return;

tutar = Number(tutar);

if(!tutar) return;

borcEkleDB(isim, tutar);

listeyiGuncelle();

}

/* BORÇ DÜŞ */

function borcDusUI(isim){

let tutar = prompt(isim + " için düşülecek tutar:");

if(!tutar) return;

tutar = Number(tutar);

if(!tutar) return;

borcDusDB(isim, tutar);

listeyiGuncelle();

}

/* KİŞİ SİL */

function kisiSilUI(isim){

let onay = confirm(isim + " silinsin mi?");

if(!onay) return;

kisiSilDB(isim);

listeyiGuncelle();

}

/* YENİ KİŞİ EKLE */

function yeniKisi(){

let isim = document.getElementById("isim").value;

if(!isim) return;

kisiEkle(isim);

document.getElementById("isim").value="";

listeyiGuncelle();

}

/* TOPLAM BORÇ */

function toplamGuncelle(){

let toplamEl = document.getElementById("toplam");

if(!toplamEl) return;

toplamEl.innerText = toplamBorc();

}

/* ARAMA */

function aramaYap(){
listeyiGuncelle();
}

/* SAYFA YÜKLENİNCE */

document.addEventListener("DOMContentLoaded", ()=>{

listeyiGuncelle();

});
