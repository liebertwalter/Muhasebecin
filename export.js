/* VERİ DIŞA AKTARMA */

function veriyiCSVyeCevir(){

let kisiler = tumKisiler();

let csv = "Isim,Bakiye\n";

kisiler.forEach(kisi=>{

csv += kisi.isim + "," + kisi.bakiye + "\n";

});

return csv;

}

/* CSV İNDİR */

function csvIndir(){

let csv = veriyiCSVyeCevir();

let blob = new Blob([csv], { type: "text/csv" });

let url = URL.createObjectURL(blob);

let a = document.createElement("a");

a.href = url;

a.download = "muhasebecin_veri.csv";

a.click();

}

/* JSON YEDEK */

function jsonYedek(){

let kisiler = tumKisiler();

let veri = JSON.stringify(kisiler, null, 2);

let blob = new Blob([veri], { type: "application/json" });

let url = URL.createObjectURL(blob);

let a = document.createElement("a");

a.href = url;

a.download = "muhasebecin_backup.json";

a.click();

}
