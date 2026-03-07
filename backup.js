/* YEDEK GERİ YÜKLEME */

function yedekYukleDosyaSec(){

let input = document.createElement("input");

input.type = "file";

input.accept = ".json";

input.onchange = function(event){

let file = event.target.files[0];

if(!file) return;

let reader = new FileReader();

reader.onload = function(e){

try{

let veri = JSON.parse(e.target.result);

localStorage.setItem("muhasebecin_db", JSON.stringify(veri));

alert("Yedek başarıyla yüklendi");

location.reload();

}catch(err){

alert("Yedek dosyası geçersiz");

}

};

reader.readAsText(file);

};

input.click();

}
