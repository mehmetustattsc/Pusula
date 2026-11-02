/* ===================== state ===================== */
const PCOL=['#2BB3C0','#E0565B','#9B7BEA'];
let G=null;
function newGame(){
  const castles=shuffle(CASTLES[Math.floor(Math.random()*CASTLES.length)]);
  const cats=shuffle([...CATS,...CATS,...CATS,'gen']);
  const regions=REG.map((r,i)=>({name:r[0],cat:cats[i],owner:-1,value:200,castle:false,towers:0}));
  const strong=shuffle(CATS);
  const prof=k=>{const p={};CATS.forEach(c=>p[c]=rnd(.5,.68));const s=strong[k*2],w=strong[k*2+1];p[s]=.84;p[w]=.34;return{p,s,w}};
  const players=[{name:null,human:true,color:PCOL[0],alive:true},{name:'Ayla',color:PCOL[1],alive:true,...prof(0)},{name:'Kaan',color:PCOL[2],alive:true,...prof(1)}];
  castles.forEach((ri,pid)=>{const r=regions[ri];r.owner=pid;r.castle=true;r.towers=3;r.value=1000;players[pid].castle=ri});
  G={players,regions,phase:'expand',round:0,active:-1};
}
const pname=pid=>pid===0?t('you'):G.players[pid].name;
const accOf=(pid,cat)=>pid===0?.6:G.players[pid].p[cat];
const score=pid=>G.regions.reduce((s,r)=>s+(r.owner===pid?r.value:0),0);
const owned=pid=>G.regions.map((r,i)=>i).filter(i=>G.regions[i].owner===pid);
const freeR=()=>G.regions.map((r,i)=>i).filter(i=>G.regions[i].owner<0);
const alive=()=>G.players.map((p,i)=>i).filter(i=>G.players[i].alive);

