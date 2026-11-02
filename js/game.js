/* ===================== game flow ===================== */
function allowedFor(pid){const free=new Set(freeR());const adj=new Set();owned(pid).forEach(r=>ADJ[r].forEach(n=>{if(free.has(n))adj.add(n)}));return adj.size?[...adj]:[...free]}
function targetsFor(pid){const s=new Set();owned(pid).forEach(r=>ADJ[r].forEach(n=>{const o=G.regions[n].owner;if(o>=0&&o!==pid&&G.players[o].alive)s.add(n)}));return [...s]}
function setActive(pid){G.active=pid;renderPlayers()}
const rn=i=>T(G.regions[i].name);

async function pickRegion(pid,left){
  const allowed=allowedFor(pid);if(!allowed.length)return;setActive(pid);
  let r;
  if(pid===0){setStatus(()=>[left>1?t('pick2'):t('pick1'),t('pickHint')]);setHL(allowed);scrollToRegions(allowed);r=await waitRegionTap(allowed);sfx('tap')}
  else{setStatus(()=>[t('botPick',{p:pname(pid)}),'']);setHL(allowed);await sleep(550*MODE().pace);
    const P=G.players[pid];r=allowed.map(i=>({i,s:P.p[G.regions[i].cat]+ADJ[i].filter(n=>G.regions[n].owner<0).length*.04+Math.random()*.25})).sort((a,b)=>b.s-a.s)[0].i;
    setHL([],r);await sleep(400*MODE().pace)}
  G.regions[r].owner=pid;clearHL();redrawAll();flashRegion(r,G.players[pid].color);toast(t('picked',{p:pname(pid),r:rn(r)}));
}

async function duel(a,d,ri){
  const R=G.regions[ri];const q=nextDuel(R.cat);
  const ctxH=`<b style="color:${G.players[a].color}">${esc(pname(a))}</b> → <b style="color:${G.players[d].color}">${esc(pname(d))}</b> · ${esc(rn(ri))}${R.castle?' · '+t('castle'):''}`;
  const res=q.type==='ord'?await askOrder(q,[a,d],ctxH):await askMC(q,[a,d],ctxH);
  if(res[a]&&!res[d])return 'att';if(res[d]&&!res[a])return 'def';if(!res[a]&&!res[d])return 'none';
  toast(t('tie'));const rk=await askEst(nextEst(MODE().event),[a,d],t('tiebreak'),ctxH);return rk[0]===a?'att':'def';
}

/* senin açından sonucun sesi: aldıysan/savunduysan sevinç, kaybettiysen hüzün */
function outcomeSfx(a,d,o){if(a!==0&&d!==0)return;const good=(o==='att'&&a===0)||(o==='def'&&d===0);if(o!=='none')sfx(good?'take':'lose')}

async function attackTurn(pid){
  setActive(pid);const tg=targetsFor(pid);
  if(!tg.length){setStatus(()=>[t('noTarget',{p:pname(pid)}),'']);await sleep(900);return}
  let ri;
  if(pid===0){setStatus(()=>[t('yourTurn'),t('attackHint')]);setHL(tg);scrollToRegions(tg);ri=await waitRegionTap(tg);sfx('tap')}
  else{setStatus(()=>[t('botTurn',{p:pname(pid)}),'']);setHL(tg);await sleep(650*MODE().pace);const P=G.players[pid];
    ri=tg.map(i=>{const R=G.regions[i];const da=accOf(R.owner,R.cat);let s=accOf(pid,R.cat)-da*.8+R.value/2000+Math.random()*.25;if(R.castle)s+=(3-R.towers)*.25-.35;return{i,s}}).sort((x,y)=>y.s-x.s)[0].i}
  setHL([],ri);scrollToRegions([ri]);await sleep(450*MODE().pace);
  const R=G.regions[ri],d=R.owner;
  if(R.castle){
    while(R.towers>0){const o=await duel(pid,d,ri);hideCard();outcomeSfx(pid,d,o);
      if(o==='att'){R.towers--;redrawAll();flashRegion(ri,G.players[pid].color);if(R.towers>0){toast(t('tower',{r:rn(ri),n:R.towers}));await sleep(900)}}
      else{if(o==='def'){R.value+=100;toast(t('held',{d:pname(d),r:rn(ri)}))}else toast(t('none',{r:rn(ri)}));redrawAll();break}}
    if(R.towers===0){G.regions.forEach(x=>{if(x.owner===d)x.owner=pid});R.castle=false;G.players[d].alive=false;redrawAll();flashRegion(ri,G.players[pid].color);
      toast(t('fell',{a:pname(pid),d:pname(d)}));setStatus(()=>[t('fell',{a:pname(pid),d:pname(d)}),'']);await sleep(1600)}
  }else{
    const o=await duel(pid,d,ri);hideCard();outcomeSfx(pid,d,o);
    if(o==='att'){R.owner=pid;flashRegion(ri,G.players[pid].color);toast(t('took',{a:pname(pid),r:rn(ri)}))}
    else if(o==='def'){R.value+=100;toast(t('held',{d:pname(d),r:rn(ri)}))}else toast(t('none',{r:rn(ri)}));
    redrawAll();
  }
  clearHL();await sleep(800*MODE().pace);
}

async function prepareMap(){
  if(MAP===MAPS[SET.map])return;
  setStatus(()=>[t('building'),'']);await new Promise(r=>setTimeout(r,30));
  buildMap(SET.map);
}

let gameNo=0;
async function run(){
  const my=++gameNo;
  await prepareMap();newGame();redrawAll();renderLegend();renderPhase();window.scrollTo({top:0});
  G.phase='expand';
  while(freeR().length){G.round++;renderPhase();setActive(-1);setStatus(()=>[t('waitExpand'),'']);await sleep(500);
    const rk=await askEst(nextEst(MODE().event),alive(),t('est'),t('all'));hideCard();
    for(const [pid,n] of [[rk[0],2],[rk[1],1]])for(let k=0;k<n;k++){if(!freeR().length)break;await pickRegion(pid,n-k)}
  }
  G.phase='war';const WAR=MODE().war;
  for(let rd=1;rd<=WAR;rd++){G.round=rd;renderPhase();const order=[0,1,2].map(k=>(k+rd-1)%3);
    for(const pid of order){if(!G.players[0].alive||alive().length<2)break;if(G.players[pid].alive)await attackTurn(pid)}
    if(!G.players[0].alive||alive().length<2)break}
  if(my!==gameNo)return;
  G.phase='end';setActive(-1);renderPhase();showEnd();
}

function showEnd(){
  const rk=[0,1,2].sort((a,b)=>(G.players[b].alive-G.players[a].alive)||score(b)-score(a));
  const won=G.players[0].alive&&rk[0]===0;sfx(won?'win':'lose');
  const cats=[...CATS,...EVENT_CATS].filter(c=>G.stats[c]);
  const draw=()=>{const head=!G.players[0].alive?t('youLost'):won?t('win'):t('lose',{p:pname(rk[0])});
    showCard(`<div class="endt">${esc(head)}</div>
     <div class="rows">${rk.map((p,k)=>`<div class="row${k===0?' first':''}" style="--c:${G.players[p].color}"><span class="rk">${k+1}</span><span>${esc(pname(p))}${G.players[p].alive?'':' · '+t('out')}</span><span class="g">${fmtN(score(p))}</span><span class="df">${t('score')}</span></div>`).join('')}</div>
     ${cats.length?`<div class="report"><div class="lt">${t('report')}</div>${cats.map(c=>{const s=G.stats[c];const pct=Math.round(s.r/s.t*100);return `<div class="rep"><span class="badge" style="--k:${CAT[c].c}">${T(CAT[c].ab)}</span><span class="rn">${T(CAT[c].n)}</span><span class="bar"><i style="width:${pct}%;background:${CAT[c].c}"></i></span><span class="rv">${s.r}/${s.t}</span></div>`}).join('')}
       ${G.best>=2?`<div class="hint" style="text-align:left">${t('bestStreak',{n:G.best})}</div>`:''}</div>`:''}
     <div class="row2"><button class="cta" id="again">${t('again')}</button><button class="ghost" id="menu">${t('menu')}</button></div>`);
    $('#again').onclick=()=>{hideCard();run()};$('#menu').onclick=()=>showStart()};
  ovRerender=draw;draw();setStatus(()=>[t('final'),'']);
}

/* ---------- başlangıç ekranı: harita, mod, zorluk ---------- */
function seg(name,items,cur){return `<div class="seg" role="radiogroup" data-seg="${name}">${items.map(([v,l,d])=>`<button role="radio" data-v="${v}" aria-checked="${v===cur}"><b>${esc(l)}</b>${d?`<small>${esc(d)}</small>`:''}</button>`).join('')}</div>`}
function showStart(){
  const draw=()=>{showCard(`<div class="cardtop"><div class="hero"><h1>PUSULA</h1><p>${t('tag')}</p><p class="qu">“${t('quote')}”<span>— Atatürk</span></p></div><div class="langs">${LANGS.map(l=>`<button data-l="${l}" aria-pressed="${l===lang}">${l.toUpperCase()}</button>`).join('')}</div></div>
    <div class="set"><div class="lt">${t('mapL')}</div>${seg('map',MAP_IDS.map(id=>[id,T(MAPS[id].name),t('regionsN',{n:MAPS[id].regions.length})]),SET.map)}</div>
    <div class="set"><div class="lt">${t('modeL')}</div>${seg('mode',[['classic',t('mClassic'),t('mClassicD')],['quick',t('mQuick'),t('mQuickD')],['football',t('mFootball'),t('mFootballD')]],SET.mode)}</div>
    <div class="set"><div class="lt">${t('diffL')}</div>${seg('diff',[['easy',t('dEasy')],['normal',t('dNormal')],['hard',t('dHard')]],SET.diff)}</div>
    <button class="cta" id="go">${t('start')}</button>
    <details class="how"><summary>${t('how')}</summary><ol class="rules"><li>${t('r1')}</li><li>${t('r2')}</li><li>${t('r3')}</li><li>${t('r4')}</li><li>${t('r5')}</li><li>${t('r6',{n:HINTS_PER_GAME})}</li></ol></details>`);
    card.querySelectorAll('[data-seg]').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{SET[g.dataset.seg]=b.dataset.v;saveSet();sfx('tap');
      g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-checked',String(x===b)));
      if(g.dataset.seg==='map')previewMap()}));
    $('#go').onclick=()=>{sfx('tap');hideCard();run()}};
  ovRerender=draw;draw();
}
/* başlangıç ekranının arkasında seçili haritayı göster */
async function previewMap(){await prepareMap();newGame();redrawAll();renderLegend();setStatus(()=>['',''])}

/* ===================== boot ===================== */
document.documentElement.lang=lang;
renderLangs();renderMute();$('#sub').textContent=t('sub');renderZoom();renderPhase();
buildMap(SET.map);newGame();renderLegend();
document.fonts.load('600 27px "IBM Plex Sans"').catch(()=>{}).then(()=>document.fonts.ready).then(()=>{paint()});
redrawAll();
showStart();
