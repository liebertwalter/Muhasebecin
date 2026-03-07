/* SESLİ KOMUT SİSTEMİ */

let recognition;

/* SESLİ KOMUT BAŞLAT */

function sesliKomutBaslat(){

if(!('webkitSpeechRecognition' in window)){

alert("Tarayıcı ses tanımayı desteklemiyor");

return;

}

recognition = new webkitSpeechRecognition();

recognition.lang = "tr-TR";

recognition.continuous = false;

recognition.interimResults = false;

recognition.start();

recognition.onresult = function(event){

let komut = event.results[0][0].transcript.toLowerCase();

komutIsle(komut);

};

}

/* KOMUT ANALİZİ */

function komutIsle(komut){

let sayi = komut.match(/\d+/);

if(!sayi) return;

let tutar = Number(sayi[0]);

let kelimeler = komut.split(" ");

let isim = kelimeler[0];

if(komut.includes("düş") || komut.includes("çıkar")){

borcDusDB(isim, tutar);

}else{

borcEkleDB(isim, tutar);

}

listeyiGuncelle();

}
