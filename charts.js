/* GRAFİK SİSTEMİ */

function grafikVerisiHazirla(){

let kisiler = tumKisiler();

let isimler = [];
let borclar = [];

kisiler.forEach(kisi=>{

isimler.push(kisi.isim);
borclar.push(kisi.bakiye);

});

return {
isimler:isimler,
borclar:borclar
};

}

/* GRAFİK OLUŞTUR */

function grafikCiz(){

let canvas = document.getElementById("grafik");

if(!canvas) return;

let veri = grafikVerisiHazirla();

new Chart(canvas, {

type: "bar",

data: {

labels: veri.isimler,

datasets: [{

label: "Borçlar",

data: veri.borclar,

backgroundColor:"#00b894"

}]

},

options: {

responsive:true,

plugins:{
legend:{
display:false
}
}

}

});

}
