/* ===================== question pools =====================
 * Soruları data/questions.js'ten okur. Aynı maçta bir soru, havuz bitmeden tekrar gelmez.
 */
const pools={
  mc:QUESTIONS.mc.map(q=>({type:'mc',...q})),
  est:QUESTIONS.est.map(q=>({type:'est',...q})),
  ord:QUESTIONS.ord.map(q=>({type:'ord',...q}))
};
const used=new Set();
function draw(list){let f=list.filter(q=>!used.has(q.id));if(!f.length){list.forEach(q=>used.delete(q.id));f=list}const q=f[Math.floor(Math.random()*f.length)];used.add(q.id);return q}
/* Tahmin sorusu; özel etkinlikte (futbol gibi) varsa o etkinliğin tahmin soruları */
function nextEst(ev){const e=ev?pools.est.filter(q=>q.c===ev):[];return draw(e.length>=3?e:pools.est.filter(q=>!EVENT_CATS.includes(q.c)))}
/* Düello sorusu: bölgenin kategorisinden; kategoride sıralama bulmacası varsa %30 ihtimalle o gelir */
const ORDER_CHANCE=0.3;
function nextDuel(cat){const ords=pools.ord.filter(q=>q.c===cat);if(ords.length&&Math.random()<ORDER_CHANCE)return draw(ords);return draw(pools.mc.filter(q=>q.c===cat))}
