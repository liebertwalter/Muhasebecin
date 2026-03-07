/* KULLANICI SİSTEMİ */

let AUTH_KEY = "muhasebecin_users";
let SESSION_KEY = "muhasebecin_session";

/* KULLANICILARI YÜKLE */

function kullanicilariYukle(){

let veri = localStorage.getItem(AUTH_KEY);

if(!veri) return [];

return JSON.parse(veri);

}

/* KULLANICI KAYDET */

function kullanicilariKaydet(users){

localStorage.setItem(AUTH_KEY, JSON.stringify(users));

}

/* KAYIT */

function kayitOl(email, sifre){

let users = kullanicilariYukle();

let varMi = users.find(u => u.email === email);

if(varMi){

alert("Bu kullanıcı zaten var");

return false;

}

users.push({
email: email,
sifre: sifre
});

kullanicilariKaydet(users);

alert("Kayıt başarılı");

return true;

}

/* GİRİŞ */

function girisYap(email, sifre){

let users = kullanicilariYukle();

let user = users.find(u => u.email === email && u.sifre === sifre);

if(!user){

alert("Giriş başarısız");

return false;

}

localStorage.setItem(SESSION_KEY, email);

alert("Giriş başarılı");

return true;

}

/* OTURUM KONTROL */

function aktifKullanici(){

return localStorage.getItem(SESSION_KEY);

}

/* ÇIKIŞ */

function cikisYap(){

localStorage.removeItem(SESSION_KEY);

alert("Çıkış yapıldı");

location.reload();

}
