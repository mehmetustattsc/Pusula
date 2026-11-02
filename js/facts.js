/* ===================== "Biliyor muydun?" =====================
 * Sen beklerken (botlar bölge seçerken, saldırıya hazırlanırken, kale onarırken) ekranın altında
 * kısa, niş bir bilgi kartı belirir. Kart, sen kapatana ya da sıra sana gelene kadar kalır;
 * soru kartları açıkken gizlenir, kapanınca geri gelir. Okunmadan yenisiyle değişmez.
 * Gördüğün bilgiler aynı oyunda kendi düellonda soru olarak gelebilir (%45 ihtimalle);
 * doğru bilirsen GOLD.factBonus altın bonus.
 * Haritaya özel bilgiler (m) o haritada öncelik alır; oyunlar arasında görülenler hatırlanır.
 */
const FACT_GAP=16000;          // yeni kart, öncekini en erken bu kadar ms sonra değiştirir
const FACT_ASK_CHANCE=.45;     // düelloda öğrenilen bilgiden soru gelme ihtimali
const factQs=FACTS.map(f=>({type:'mc',id:f.id,c:f.c,m:f.m,q:f.q,a:f.a,fact:f}));
let lastFact=-1e9,factSeen=[];
try{factSeen=JSON.parse(localStorage.getItem('pusula.facts')||'[]');if(!Array.isArray(factSeen))factSeen=[]}catch(e){factSeen=[]}
const factEl=$('#fact');

function pickFact(){
  const th=MAP&&MAP.theme,shown=new Set(G.facts);
  let pool=FACTS.filter(f=>!shown.has(f.id)&&(!f.m||f.m===th));
  if(!pool.length)return null;
  const fresh=pool.filter(f=>!factSeen.includes(f.id));if(fresh.length)pool=fresh;
  const themed=pool.filter(f=>f.m===th);if(themed.length&&Math.random()<.6)pool=themed;
  return pool[Math.floor(Math.random()*pool.length)];
}
function showFact(){
  if(!G||!G.players[0].alive||AUTO)return;
  const now=performance.now();if(now-lastFact<FACT_GAP)return;
  const f=pickFact();if(!f)return;lastFact=now;G.facts.push(f.id);
  factSeen=factSeen.filter(x=>x!==f.id);factSeen.push(f.id);if(factSeen.length>300)factSeen=factSeen.slice(-300);
  try{localStorage.setItem('pusula.facts',JSON.stringify(factSeen))}catch(e){}
  factEl.innerHTML=`<div class="fk" style="--k:${CAT[f.c].c}"><div class="fh"><span class="dyk">${t('dyk')}</span>${chip(f.c)}<button class="fx" aria-label="×">×</button></div><p>${esc(T(f.f))}</p><div class="fs">${t('factNote')}</div></div>`;
  factEl.hidden=false;factEl.classList.remove('in','mini');void factEl.offsetWidth;factEl.classList.add('in');
  factEl.querySelector('.fx').onclick=e=>{e.stopPropagation();factEl.hidden=true};
  factEl.querySelector('.fk').onclick=()=>{if(factEl.classList.contains('mini')){factEl.classList.remove('mini');sfx('tap')}};
}
function hideFact(){factEl.hidden=true}
/* sıra sana gelince kart kaybolmaz, küçük bir etikete döner; dokununca yeniden açılır */
function minimizeFact(){if(!factEl.hidden)factEl.classList.add('mini')}
/* senin düellonda: bu oyunda gördüğün ama henüz sorulmamış bir bilgiden soru */
function factQuestion(cat){
  const cand=factQs.filter(q=>q.c===cat&&G.facts.includes(q.id)&&!G.factAsked.includes(q.id));
  if(!cand.length||Math.random()>FACT_ASK_CHANCE)return null;
  const q=cand[Math.floor(Math.random()*cand.length)];G.factAsked.push(q.id);return q;
}
