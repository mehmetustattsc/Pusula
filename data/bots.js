/* Pusula bot kadrosu
 * Her oyunda bunlardan ikisi rakibin olur (başlangıç ekranından değiştirilebilir).
 *   s / w   : güçlü ve zayıf kategori (oyunda kartında görünür; strateji: zayıf yanına saldır)
 *   fb      : futbol etkinliğindeki bilgisi (0–1)
 *   agg     : saldırganlık (0–1). Yüksekse kalelere erken saldırır, düşükse zayıf savunmaları kollar
 *   color   : haritadaki rengi
 */
const BOTS = [
  { id:'ayla',   name:'Ayla',   title:L3('Gezgin','Weltenbummlerin','Explorer'),          color:'#FF6B6B', s:'geo',  w:'sci',  fb:.5,  agg:.5 },
  { id:'kaan',   name:'Kaan',   title:L3('Tarihçi','Historiker','Historian'),             color:'#5E60CE', s:'hist', w:'art',  fb:.6,  agg:.7 },
  { id:'defne',  name:'Defne',  title:L3('Ressam','Malerin','Painter'),                   color:'#F15BB5', s:'art',  w:'spo',  fb:.4,  agg:.3 },
  { id:'emre',   name:'Emre',   title:L3('Takım kaptanı','Mannschaftskapitän','Team captain'), color:'#FF9F1C', s:'spo',  w:'hist', fb:.85, agg:.8 },
  { id:'nuri',   name:'Nuri Hoca', title:L3('Profesör','Professor','Professor'),          color:'#2E86DE', s:'sci',  w:'spo',  fb:.35, agg:.3 },
  { id:'zeynep', name:'Zeynep', title:L3('Yarışma şampiyonu','Quizmeisterin','Quiz champion'), color:'#58B947', s:'gen',  w:'geo',  fb:.6,  agg:.6 },
  { id:'lena',   name:'Lena',   title:L3('Kütüphaneci','Bibliothekarin','Librarian'),     color:'#D4A017', s:'art',  w:'sci',  fb:.45, agg:.4 },
  { id:'yuki',   name:'Yuki',   title:L3('Mühendis','Ingenieurin','Engineer'),            color:'#9B5DE5', s:'sci',  w:'hist', fb:.5,  agg:.5 },
  { id:'marco',  name:'Marco',  title:L3('Aşçı','Koch','Chef'),                           color:'#A0522D', s:'hist', w:'gen',  fb:.75, agg:.65 },
  { id:'selin',  name:'Selin',  title:L3('Atlet','Leichtathletin','Athlete'),             color:'#C1121F', s:'spo',  w:'art',  fb:.7,  agg:.75 }
];
const BOT_IDS = BOTS.map(b => b.id);
