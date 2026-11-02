/* ===================== game flow ===================== */
function allowedFor(pid){const free=new Set(freeR());const adj=new Set();owned(pid).forEach(r=>ADJ[r].forEach(n=>{if(free.has(n))adj.add(n)}));return adj.size?[...adj]:[...free]}
function targetsFor(pid){const s=new Set();owned(pid).forEach(r=>ADJ[r].forEach(n=>{const o=G.regions[n].owner;if(o>=0&&o!==pid&&G.players[o].alive)s.add(n)}));return [...s]}
function setActive(pid){G.active=pid;renderPlayers()}
const rn=i=>T(G.regions[i].name);

async function pickRegion(pid,left,first){
  const allowed=allowedFor(pid);if(!allowed.length)return;setActive(pid);
  let r;
  if(pid===0){setStatus(()=>[left>1?t('pick2'):t('pick1'),t('pickHint')]);setHL(allowed);focusOn(allowed);
    if(first)await banner(t('bYourPick'),left>1?t('pick2'):t('pick1'),YOU_COLOR,1000,true);
    r=await waitRegionTap(allowed);sfx('tap')}
  else{setStatus(()=>[t('botPick',{p:pname(pid)}),'']);setHL(allowed);await sleep(550*MODE().pace);
    const P=G.players[pid];r=allowed.map(i=>({i,s:P.p[G.regions[i].cat]+ADJ[i].filter(n=>G.regions[n].owner<0).length*.04+Math.random()*.25})).sort((a,b)=>b.s-a.s)[0].i;
    setHL([],r);await sleep(400*MODE().pace)}
  G.regions[r].owner=pid;clearHL();redrawAll();flashRegion(r,G.players[pid].color);toast(t('picked',{p:pname(pid),r:rn(r)}));
}

async function duel(a,d,ri){
  const R=G.regions[ri];const q=nextDuel(R.cat);
  const ctxH=duelHead(a,d,ri);
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
  if(pid===0){setStatus(()=>[t('yourTurn'),t('attackHint')]);setHL(tg);focusOn(tg);
    await banner(t('bYourTurn'),t('attackHint'),YOU_COLOR,1200,true);
    ri=await waitRegionTap(tg);sfx('tap')}
  else{setStatus(()=>[t('botTurn',{p:pname(pid)}),'']);setHL(tg);await sleep(500*MODE().pace);const P=G.players[pid];
    /* saldırgan botlar kalelere ve değerli bölgelere, temkinliler zayıf savunmalara yönelir */
    ri=tg.map(i=>{const R=G.regions[i];const da=accOf(R.owner,R.cat);let s=accOf(pid,R.cat)-da*(1.1-P.agg*.6)+R.value/2000*(.5+P.agg)+Math.random()*.25;if(R.castle)s+=(3-R.towers)*.25-.55+P.agg*.4;return{i,s}}).sort((x,y)=>y.s-x.s)[0].i}
  const R=G.regions[ri],d=R.owner;
  setHL([],ri);focusOn([ri],2);
  if(pid!==0){const youDef=d===0;
    await banner(t('bBotTurn',{p:pname(pid)}),youDef?t('bYouDefend',{r:rn(ri)}):t('bTarget',{r:rn(ri),d:pname(d)}),G.players[pid].color,youDef?1400:1000*MODE().pace,youDef)}
  else await sleep(300);
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
  await prepareMap();newGame();redrawAll();renderLegend();renderPhase();resetView();window.scrollTo({top:0});
  G.phase='expand';
  while(freeR().length){G.round++;renderPhase();setActive(-1);setStatus(()=>[t('waitExpand'),'']);animateView({z:1,cx:W/2,cy:H/2});
    await banner(t('bExpand',{n:G.round}),t('bExpandSub'),'',1000);
    const rk=await askEst(nextEst(MODE().event),alive(),t('est'),t('all'));hideCard();
    for(const [pid,n] of [[rk[0],2],[rk[1],1]])for(let k=0;k<n;k++){if(!freeR().length)break;await pickRegion(pid,n-k,k===0)}
  }
  G.phase='war';const WAR=MODE().war;await banner(t('bWar'),t('bWarSub',{n:WAR}),'',1300);
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
     <div class="rows">${rk.map((p,k)=>`<div class="row${k===0?' first':''}" style="--c:${G.players[p].color}"><span class="rk">${k+1}</span><span class="who2">${avatar(p,'sm')}${esc(pname(p))}${G.players[p].alive?'':' · '+t('out')}</span><span class="g">${fmtN(score(p))}</span><span class="df">${t('score')}</span></div>`).join('')}</div>
     ${cats.length?`<div class="report"><div class="lt">${t('report')}</div>${cats.map(c=>{const s=G.stats[c];const pct=Math.round(s.r/s.t*100);return `<div class="rep"><span class="badge" style="--k:${CAT[c].c}">${T(CAT[c].ab)}</span><span class="rn">${T(CAT[c].n)}</span><span class="bar"><i style="width:${pct}%;background:${CAT[c].c}"></i></span><span class="rv">${s.r}/${s.t}</span></div>`}).join('')}
       ${G.best>=2?`<div class="hint" style="text-align:left">${t('bestStreak',{n:G.best})}</div>`:''}</div>`:''}
     <div class="row2"><button class="cta" id="again">${t('again')}</button><button class="ghost" id="menu">${t('menu')}</button></div>`);
    $('#again').onclick=()=>{hideCard();run()};$('#menu').onclick=()=>showStart()};
  ovRerender=draw;draw();setStatus(()=>[t('final'),'']);
}

/* ---------- başlangıç ekranı: harita, mod, zorluk ---------- */
function seg(name,items,cur){return `<div class="seg" role="radiogroup" data-seg="${name}">${items.map(([v,l,d])=>`<button role="radio" data-v="${v}" aria-checked="${v===cur}"><b>${esc(l)}</b>${d?`<small>${esc(d)}</small>`:''}</button>`).join('')}</div>`}
const LOGO='<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="#FFF6E6" stroke="#2B1748" stroke-width="4"/><circle cx="32" cy="32" r="22" fill="none" stroke="#E9D6B4" stroke-width="2"/><path d="M32 9 L38 32 L32 55 L26 32 Z" fill="#2B1748"/><path d="M32 9 L38 32 L26 32 Z" fill="#FF5A5F"/><path d="M9 32 L32 28 L55 32 L32 36 Z" fill="#2B1748" opacity=".25"/><circle cx="32" cy="32" r="4" fill="#FFC93C" stroke="#2B1748" stroke-width="2"/></svg>';
function oppCard(id){const b=BOTS.find(x=>x.id===id);return `<div class="opp">${botAv(b)}<div class="ot2"><b>${esc(b.name)}</b><small>${esc(T(b.title))}</small><span class="sw"><b class="up" style="--k:${CAT[b.s].c}">${T(CAT[b.s].n)}</b><b class="dn" style="--k:${CAT[b.w].c}">${T(CAT[b.w].n)}</b></span></div></div>`}
function showStart(){
  const draw=()=>{showCard(`<div class="cardtop"><div class="hero">${LOGO}<div><h1>Pusula</h1><p>${t('tag')}</p></div></div><div class="langs">${LANGS.map(l=>`<button data-l="${l}" aria-pressed="${l===lang}">${l.toUpperCase()}</button>`).join('')}</div></div>
    <p class="qu">“${t('quote')}”<span>— Atatürk</span></p>
    <div class="setgrp"><div class="lt">${t('mapL')}</div>${seg('map',MAP_IDS.map(id=>[id,T(MAPS[id].name),t('regionsN',{n:MAPS[id].regions.length})]),SET.map)}</div>
    <div class="setgrp"><div class="lt">${t('modeL')}</div>${seg('mode',[['classic',t('mClassic'),t('mClassicD')],['quick',t('mQuick'),t('mQuickD')],['football',t('mFootball'),t('mFootballD')]],SET.mode)}</div>
    <div class="setgrp"><div class="lt ltrow"><span>${t('oppL')}</span><button class="link" id="reroll">${t('reroll')}</button></div><div class="opps">${SET.opps.map(oppCard).join('')}</div></div>
    <div class="setgrp"><div class="lt">${t('diffL')}</div>${seg('diff',[['easy',t('dEasy')],['normal',t('dNormal')],['hard',t('dHard')]],SET.diff)}</div>
    <button class="cta big" id="go">${t('start')}</button>
    <details class="how"><summary>${t('how')}</summary><ol class="rules"><li>${t('r1')}</li><li>${t('r2')}</li><li>${t('r3')}</li><li>${t('r4')}</li><li>${t('r5')}</li><li>${t('r6',{n:HINTS_PER_GAME})}</li></ol></details>`);
    card.querySelectorAll('[data-seg]').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{SET[g.dataset.seg]=b.dataset.v;saveSet();sfx('tap');
      g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-checked',String(x===b)));
      if(g.dataset.seg==='map')previewMap()}));
    $('#reroll').onclick=()=>{sfx('tap');let n;do{n=pickOpps()}while(n.join()===SET.opps.join());SET.opps=n;saveSet();card.querySelector('.opps').innerHTML=SET.opps.map(oppCard).join('');previewMap()};
    $('#go').onclick=()=>{sfx('tap');hideCard();run()}};
  ovRerender=draw;draw();
}
/* başlangıç ekranının arkasında seçili haritayı göster */
async function previewMap(){await prepareMap();newGame();redrawAll();renderLegend();renderPhase();resetView();setStatus(()=>['',''])}

/* ===================== boot ===================== */
document.documentElement.lang=lang;
renderLangs();renderMute();
buildMap(SET.map);newGame();renderLegend();renderPhase();resetView();
document.fonts.load('800 30px "Nunito"').catch(()=>{}).then(()=>document.fonts.ready).then(()=>{paint()});
redrawAll();
showStart();
