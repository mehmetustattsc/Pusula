/* ===================== state ===================== */
const PCOL=['#2BB3C0','#E0565B','#9B7BEA'];

/* Oyun modları: war = savaş turu sayısı, event = bütün bölgeler bu özel kategoriden,
   pace = botların kendi aralarındaki düellolarda gösterim hızı (küçük = hızlı) */
const MODES={
  classic:{war:4,pace:1},
  quick:{war:2,pace:.6},
  football:{war:4,pace:.85,event:'fb'}
};
/* Zorluk: botların doğru cevap ihtimaline eklenen değer */
const DIFFS={easy:-.15,normal:0,hard:.12};
const HINTS_PER_GAME=3;

let SET={map:'tr',mode:'classic',diff:'normal'};
try{const s=JSON.parse(localStorage.getItem('pusula.set')||'null');if(s&&MAPS[s.map]&&MODES[s.mode]&&s.diff in DIFFS)SET=s}catch(e){}
function saveSet(){try{localStorage.setItem('pusula.set',JSON.stringify(SET))}catch(e){}}
const MODE=()=>MODES[SET.mode];

let G=null;
function newGame(){
  const castles=shuffle(MAP.castles[Math.floor(Math.random()*MAP.castles.length)]);
  const n=MAP.regions.length,ev=MODE().event;
  let cats=[];if(ev)cats=new Array(n).fill(ev);else{while(cats.length<n)cats.push(...shuffle(CATS));cats=shuffle(cats.slice(0,n))}
  const regions=MAP.regions.map((r,i)=>({name:r[0],cat:cats[i],owner:-1,value:200,castle:false,towers:0}));
  const strong=shuffle(CATS);
  const prof=k=>{const p={};CATS.forEach(c=>p[c]=rnd(.5,.68));EVENT_CATS.forEach(c=>p[c]=rnd(.45,.75));const s=strong[k*2],w=strong[k*2+1];p[s]=.84;p[w]=.34;return{p,s,w}};
  const players=[{name:null,human:true,color:PCOL[0],alive:true},{name:'Ayla',color:PCOL[1],alive:true,...prof(0)},{name:'Kaan',color:PCOL[2],alive:true,...prof(1)}];
  castles.forEach((ri,pid)=>{const r=regions[ri];r.owner=pid;r.castle=true;r.towers=3;r.value=1000;players[pid].castle=ri});
  G={players,regions,phase:'expand',round:0,active:-1,hints:HINTS_PER_GAME,streak:0,best:0,stats:{}};
}
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
