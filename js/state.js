/* ===================== state ===================== */
const YOU_COLOR='#14B8A6';

/* Oyun modları: war = savaş turu sayısı, event = bütün bölgeler bu özel kategoriden,
   pace = botların kendi aralarındaki düellolarda gösterim hızı (küçük = hızlı) */
const MODES={
  classic:{war:4,pace:1},
  quick:{war:2,pace:.6},
  football:{war:4,pace:.85,event:'fb'}
};
/* Zorluk: botların doğru cevap ihtimaline eklenen değer */
const DIFFS={easy:-.15,normal:0,hard:.12};
const HINTS_PER_GAME=1;   // oyun başında bedava ipucu hakkı; sonrakiler altınla
/* Altın ekonomisi: kazanma ve harcama miktarları */
const GOLD={factBonus:10,start:40,ownCorrect:10,watchCorrect:15,estWin:10,capture:10,hint:30,repair:40,backup:80};
/* Bot düellolarını izleme hızı: 1x, 2x, 4x (4x'te izlerken cevaplama yok) */
let watchSpeed=1;try{const w=+localStorage.getItem('pusula.speed');if([1,2,4].includes(w))watchSpeed=w}catch(e){}
function setWatchSpeed(v){watchSpeed=v;try{localStorage.setItem('pusula.speed',String(v))}catch(e){}if(typeof renderSpeed==='function')renderSpeed()}
const pace=()=>MODE().pace/watchSpeed;

/* rakip botlar (2–4): renkleri birbirine ve sana çok benzemeyecek şekilde rastgele */
const cdist=(a,b)=>{const x=hexRgb(a),y=hexRgb(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2])};
function pickOpps(n){
  for(let k=0;k<400;k++){const ids=shuffle(BOT_IDS).slice(0,n),cols=[YOU_COLOR,...ids.map(id=>BOTS.find(x=>x.id===id).color)];
    let ok=true;for(let i=0;i<cols.length&&ok;i++)for(let j=i+1;j<cols.length;j++)if(cdist(cols[i],cols[j])<(n>2?95:110)){ok=false;break}
    if(ok)return ids}
  return ['ayla','kaan','emre','nuri'].slice(0,n)}
let SET={map:'tr',mode:'classic',diff:'normal',nOpp:2,opps:null};
try{const s=JSON.parse(localStorage.getItem('pusula.set')||'null');if(s&&MAPS[s.map]&&MODES[s.mode]&&s.diff in DIFFS)SET={...SET,...s}}catch(e){}
if(![2,3,4].includes(SET.nOpp))SET.nOpp=2;
if(!Array.isArray(SET.opps)||SET.opps.length!==SET.nOpp||!SET.opps.every(id=>BOT_IDS.includes(id)))SET.opps=pickOpps(SET.nOpp);
function saveSet(){try{localStorage.setItem('pusula.set',JSON.stringify(SET))}catch(e){}}
const MODE=()=>MODES[SET.mode];

let G=null;
function newGame(){
  const n=MAP.regions.length,ev=MODE().event;
  let cats=[];if(ev)cats=new Array(n).fill(ev);else{while(cats.length<n)cats.push(...shuffle(CATS));cats=shuffle(cats.slice(0,n))}
  const regions=MAP.regions.map((r,i)=>({name:r[0],cat:cats[i],owner:-1,value:200,castle:false,towers:0}));
  /* bot profili: güçlü kategori .84, zayıf .34, diğerleri .5–.68; futbol bilgisi karakterden */
  const prof=b=>{const p={};CATS.forEach(c=>p[c]=rnd(.5,.68));p[b.s]=.84;p[b.w]=.34;EVENT_CATS.forEach(c=>p[c]=b.fb);return{p,s:b.s,w:b.w}};
  const bot=id=>{const b=BOTS.find(x=>x.id===id);return{name:b.name,title:b.title,color:b.color,agg:b.agg,bot:id,alive:true,...prof(b)}};
  const players=[{name:null,human:true,color:YOU_COLOR,alive:true},...SET.opps.map(bot)];
  players.forEach(p=>{p.gold=GOLD.start;p.backup=-1});
  placeCastles(players.length).forEach((ri,pid)=>{const r=regions[ri];r.owner=pid;r.castle=true;r.towers=3;r.value=1000;players[pid].castle=ri});
  G={players,regions,phase:'expand',round:0,active:-1,hints:HINTS_PER_GAME,streak:0,best:0,stats:{},facts:[],factAsked:[]};
}
/* kaleleri birbirinden olabildiğince uzak bölgelere yerleştir (komşuluk grafiğinde en büyük en küçük mesafe) */
function placeCastles(k){
  const n=MAP.regions.length,D=[];for(let a=0;a<n;a++){const d=new Array(n).fill(1e9);d[a]=0;const q=[a];for(let h=0;h<q.length;h++){const u=q[h];ADJ[u].forEach(v=>{if(d[v]>d[u]+1){d[v]=d[u]+1;q.push(v)}})}D.push(d)}
  let best=null,bs=-1;
  for(let tr=0;tr<80;tr++){const set=[Math.floor(Math.random()*n)];
    while(set.length<k){let bi=-1,bd=-1;for(let v=0;v<n;v++){if(set.includes(v))continue;const m=Math.min(...set.map(u=>D[u][v]))+Math.random()*.5;if(m>bd){bd=m;bi=v}}set.push(bi)}
    let m=1e9,sum=0;for(let i=0;i<k;i++)for(let j=i+1;j<k;j++){m=Math.min(m,D[set[i]][set[j]]);sum+=D[set[i]][set[j]]}
    const sc=m*100+sum+Math.random();if(sc>bs){bs=sc;best=set}}
  return shuffle(best);
}
function addGold(pid,n,show){const p=G.players[pid];p.gold=Math.max(0,p.gold+n);if(show&&pid===0&&n>0){toast(t('goldGain',{n}));sfx('coin')}renderPlayers()}
const pname=pid=>pid===0?t('you'):G.players[pid].name;
const accOf=(pid,cat)=>pid===0?.6:Math.max(.08,Math.min(.97,G.players[pid].p[cat]+DIFFS[SET.diff]));
const score=pid=>G.regions.reduce((s,r)=>s+(r.owner===pid?r.value:0),0);
const owned=pid=>G.regions.map((r,i)=>i).filter(i=>G.regions[i].owner===pid);
const freeR=()=>G.regions.map((r,i)=>i).filter(i=>G.regions[i].owner<0);
const alive=()=>G.players.map((p,i)=>i).filter(i=>G.players[i].alive);

/* senin cevap istatistiğin (oyun sonu karnesi ve seri) */
function record(cat,ok){
  const s=G.stats[cat]||(G.stats[cat]={r:0,t:0});s.t++;if(ok)s.r++;
  if(ok){G.streak++;G.best=Math.max(G.best,G.streak);if(G.streak>=3)toast(t('streak',{n:G.streak}))}else G.streak=0;
}
