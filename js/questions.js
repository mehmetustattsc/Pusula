/* ===================== question pools =====================
 * Soruları data/questions.js'ten okur.
 * - Aynı maçta bir soru, havuz bitmeden tekrar gelmez.
 * - Oyunlar arasında da hatırlanır: son görülen ~600 soru tarayıcıda saklanır ve
 *   görülmemiş sorular öne alınır; hepsi görüldüyse en eski görülenler gelir.
 * - Haritaya özel sorular (m: harita teması) %50 ihtimalle öncelik alır, ama yalnızca
 *   son RECENT soruda görülmemiş taze bir tema sorusu varsa. Küçük tema havuzu bu yüzden
 *   aynı soruyu tekrar tekrar getirmez; tazesi kalmayınca genel havuza dönülür.
 * - Sıralama bulmacası da yalnızca taze bir tane varsa gelir.
 */
const pools={
  mc:QUESTIONS.mc.map(q=>({type:'mc',...q})),
  est:QUESTIONS.est.map(q=>({type:'est',...q})),
  ord:QUESTIONS.ord.map(q=>({type:'ord',...q}))
};
const used=new Set();
let seen=[];try{seen=JSON.parse(localStorage.getItem('pusula.seen')||'[]');if(!Array.isArray(seen))seen=[]}catch(e){seen=[]}
function markSeen(id){seen=seen.filter(x=>x!==id);seen.push(id);if(seen.length>600)seen=seen.slice(-600);try{localStorage.setItem('pusula.seen',JSON.stringify(seen))}catch(e){}}
function draw(list){
  let f=list.filter(q=>!used.has(q.id));
  if(!f.length){list.forEach(q=>used.delete(q.id));f=list}
  const unseen=f.filter(q=>!seen.includes(q.id));
  let pick;
  if(unseen.length)pick=unseen[Math.floor(Math.random()*unseen.length)];
  else{const old=f.slice().sort((a,b)=>seen.indexOf(a.id)-seen.indexOf(b.id));pick=old[Math.floor(Math.random()*Math.max(1,Math.ceil(old.length*.3)))]}
  used.add(pick.id);if(!AUTO)markSeen(pick.id);return pick;
}
const THEME_CHANCE=.5,RECENT=150;
const fresh=list=>{const rec=new Set(seen.slice(-RECENT));return list.filter(q=>!used.has(q.id)&&!rec.has(q.id))};
const MAP_THEMES={eu:['eu','de']};  // Avrupa haritasında Almanya soruları da tema sayılır
function themed(list){const th=MAP&&MAP.theme;if(!th)return list;const ths=MAP_THEMES[th]||[th];
  const tl=fresh(list.filter(q=>ths.includes(q.m)));return tl.length&&Math.random()<THEME_CHANCE?tl:list}
/* Tahmin sorusu; özel etkinlikte (futbol gibi) varsa o etkinliğin tahmin soruları */
function nextEst(ev){const e=ev?pools.est.filter(q=>q.c===ev):[];return draw(e.length>=3?e:themed(pools.est.filter(q=>!EVENT_CATS.includes(q.c))))}
/* Düello sorusu: bölgenin kategorisinden; kategoride taze bir sıralama bulmacası varsa %30 ihtimalle o gelir */
const ORDER_CHANCE=0.3;
function nextDuel(cat){const ords=pools.ord.filter(q=>q.c===cat);if(fresh(ords).length&&Math.random()<ORDER_CHANCE)return draw(themed(ords));return draw(themed(pools.mc.filter(q=>q.c===cat)))}
