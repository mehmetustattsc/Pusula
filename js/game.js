/* ===================== game flow ===================== */
function allowedFor(pid){const free=new Set(freeR());const adj=new Set();owned(pid).forEach(r=>ADJ[r].forEach(n=>{if(free.has(n))adj.add(n)}));return adj.size?[...adj]:[...free]}
function targetsFor(pid){const s=new Set();owned(pid).forEach(r=>ADJ[r].forEach(n=>{const o=G.regions[n].owner;if(o>=0&&o!==pid&&G.players[o].alive)s.add(n)}));return [...s]}
function setActive(pid){G.active=pid;renderPlayers()}
const rn=i=>T(G.regions[i].name);

async function pickRegion(pid,left,first){
  const allowed=allowedFor(pid);if(!allowed.length)return;setActive(pid);
  let r;
  if(pid===0){setStatus(()=>[left>1?t('pick2'):t('pick1'),t('pickHint')]);setHL(allowed);focusOn(allowed);
    if(first)await banner(t('bYourPick'),left>1?t('pick2'):t('pick1'),YOU_COLOR,TIMING.bannerYou,true);
    r=await waitRegionTap(allowed);sfx('tap')}
  else{setStatus(()=>[t('botPick',{p:pname(pid)}),'']);showFact();setHL(allowed);await sleep(tm('botThink'));
    const P=G.players[pid];r=allowed.map(i=>({i,s:P.p[G.regions[i].cat]+ADJ[i].filter(n=>G.regions[n].owner<0).length*.04+Math.random()*.25})).sort((a,b)=>b.s-a.s)[0].i;
    setHL([],r);await sleep(tm('botChosen'))}
  G.regions[r].owner=pid;clearHL();redrawAll();flashRegion(r,G.players[pid].color);toast(t('picked',{p:pname(pid),r:rn(r)}));
}

async function duel(a,d,ri){
  const R=G.regions[ri];const q=(a===0||d===0)&&factQuestion(R.cat)||nextDuel(R.cat);
  const ctxH=duelHead(a,d,ri);
  const res=q.type==='ord'?await askOrder(q,[a,d],ctxH):await askMC(q,[a,d],ctxH);
  if(res[a]&&!res[d])return 'att';if(res[d]&&!res[a])return 'def';if(!res[a]&&!res[d])return 'none';
  toast(t('tie'));const rk=await askEst(nextEst(MODE().event),[a,d],t('tiebreak'),ctxH);return rk[0]===a?'att':'def';
}

/* senin açından sonucun sesi: aldıysan/savunduysan sevinç, kaybettiysen hüzün */
function outcomeSfx(a,d,o){if(a!==0&&d!==0)return;const good=(o==='att'&&a===0)||(o==='def'&&d===0);if(o!=='none')sfx(good?'take':'lose')}

/* ---------- tur öncesi hamleler: kule onarımı ve yedek kale ----------
 * Yıkılan kuleler kalıcıdır; saldıran bir sonraki saldırısında kaldığı yerden devam eder.
 * Savunan, kendi turunun başında bir kuleyi onarabilir: GOLD.repair altınla ya da bir sıralama
 * bulmacasını doğru çözerek (bedava). Tur başına bir onarım.
 * Yedek kale (GOLD.backup altın): ana kale düşerse oyuncu elenmez; yedek kale 2 kuleyle ana kale olur.
 */
const myCastle=pid=>G.regions[G.players[pid].castle];
const backupSpots=pid=>owned(pid).filter(i=>!G.regions[i].castle&&i!==G.players[pid].backup);
function canBuild(pid){const P=G.players[pid];return P.backup<0&&P.gold>=GOLD.backup&&backupSpots(pid).length>0}
async function repairByPuzzle(pid){
  const R=myCastle(pid);const ords=pools.ord.filter(q=>!EVENT_CATS.includes(q.c)||q.c===MODE().event);const q=draw(ords);
  const ctxH=`<span class="tg">${t('repairCtx',{r:rn(G.players[pid].castle)})}</span>`;
  const res=await askOrder(q,[pid],ctxH);hideCard();
  if(res[pid]){R.towers=Math.min(3,R.towers+1);redrawAll();toast(t('repaired',{p:pname(pid),n:R.towers}));sfx(pid===0?'take':'tap')}
  else toast(t('repairFail'));
}
function repairByGold(pid){const R=myCastle(pid);addGold(pid,-GOLD.repair);R.towers=Math.min(3,R.towers+1);redrawAll();flashRegion(G.players[pid].castle,G.players[pid].color);toast(t('repaired',{p:pname(pid),n:R.towers}))}
async function buildBackup(pid,ri){const P=G.players[pid];addGold(pid,-GOLD.backup);P.backup=ri;redrawAll();flashRegion(ri,P.color);toast(t('backupBuilt',{p:pname(pid),r:rn(ri)}));if(pid!==0)await sleep(tm('botChosen'))}

async function preTurn(pid){
  const P=G.players[pid],R=myCastle(pid),hurt=R.towers<3;
  if(pid===0){
    if(!hurt&&!canBuild(0))return;
    if(AUTO){if(hurt&&P.gold>=GOLD.repair)repairByGold(0);return}
    const choice=await new Promise(res=>{
      showCard(`<div class="acth"><span class="chip" style="--k:${YOU_COLOR}">${t('prepL')}</span><span class="gold big">${coin()}${fmtN(P.gold)}</span></div>
        <div class="qt">${hurt?t('castleHurt',{n:R.towers}):t('prepTitle')}</div>
        <div class="acts">
          ${hurt?`<button class="act" data-a="gold" ${P.gold>=GOLD.repair?'':'disabled'}><b>${t('repairGold')}</b><small>${coin()}${GOLD.repair}</small></button>
          <button class="act" data-a="puzzle"><b>${t('repairPuzzle')}</b><small>${t('repairPuzzleSub')}</small></button>`:''}
          ${P.backup<0?`<button class="act" data-a="backup" ${canBuild(0)?'':'disabled'}><b>${t('buildBackup')}</b><small>${coin()}${GOLD.backup} · ${t('buildBackupSub')}</small></button>`:''}
        </div>
        <button class="cta" data-a="skip">${t('toAttack')}</button>`);
      card.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{sfx('tap');res(b.dataset.a)})});
    hideCard();
    if(choice==='gold')repairByGold(0);
    else if(choice==='puzzle')await repairByPuzzle(0);
    else if(choice==='backup'){const spots=backupSpots(0);setStatus(()=>[t('pickBackup'),'']);setHL(spots);focusOn(spots);const r=await waitRegionTap(spots);clearHL();await buildBackup(0,r)}
    return;
  }
  /* bot: hasarlıysa önce altınla, yoksa bulmacayla onarır; tehlikedeyse ya da zenginse yedek kale kurar */
  if(hurt){if(P.gold>=GOLD.repair)repairByGold(pid);else if(Math.random()<.6)await repairByPuzzle(pid);await sleep(tm('botChosen'))}
  if(canBuild(pid)&&(R.towers<3||P.gold>=GOLD.backup+40||Math.random()<.35)){
    const spot=backupSpots(pid).map(i=>({i,s:-ADJ[i].filter(n=>G.regions[n].owner>=0&&G.regions[n].owner!==pid).length+Math.random()*.5})).sort((x,y)=>y.s-x.s)[0].i;
    await buildBackup(pid,spot)}
}

/* ana kale düştü: yedek kale varsa oraya taşınır, yoksa oyuncu elenir ve toprakları saldırana geçer */
async function castleFalls(a,d,ri){
  const R=G.regions[ri],D=G.players[d];R.castle=false;R.towers=0;R.owner=a;
  if(D.backup>=0&&G.regions[D.backup].owner===d){
    const B=G.regions[D.backup];B.castle=true;B.towers=2;B.value=Math.max(B.value,800);D.castle=D.backup;D.backup=-1;
    redrawAll();flashRegion(D.castle,D.color);
    await banner(t('bFell',{d:pname(d)}),t('movedSub',{r:rn(D.castle)}),D.color,1500,d===0);
  }else{
    G.regions.forEach(x=>{if(x.owner===d)x.owner=a});D.alive=false;D.backup=-1;redrawAll();flashRegion(ri,G.players[a].color);
    toast(t('fell',{a:pname(a),d:pname(d)}));setStatus(()=>[t('fell',{a:pname(a),d:pname(d)}),'']);await sleep(TIMING.resultHold+800)}
}

async function attackTurn(pid){
  setActive(pid);if(pid!==0)showFact();
  if(G.phase==='war')await preTurn(pid);
  const tg=targetsFor(pid);
  if(!tg.length){setStatus(()=>[t('noTarget',{p:pname(pid)}),'']);await sleep(tm('botChosen'));return}
  let ri;
  if(pid===0){setStatus(()=>[t('yourTurn'),t('attackHint')]);setHL(tg);focusOn(tg);
    await banner(t('bYourTurn'),t('attackHint'),YOU_COLOR,TIMING.bannerYou,true);
    ri=await waitRegionTap(tg);sfx('tap')}
  else{setStatus(()=>[t('botTurn',{p:pname(pid)}),'']);setHL(tg);await sleep(tm('botThink'));const P=G.players[pid];
    /* saldırgan botlar kalelere ve değerli bölgelere, temkinliler zayıf savunmalara yönelir */
    ri=tg.map(i=>{const R=G.regions[i];const da=accOf(R.owner,R.cat);let s=accOf(pid,R.cat)-da*(1.1-P.agg*.6)+R.value/2000*(.5+P.agg)+Math.random()*.25;if(R.castle)s+=(3-R.towers)*.25-.55+P.agg*.4;return{i,s}}).sort((x,y)=>y.s-x.s)[0].i}
  const R=G.regions[ri],d=R.owner;
  /* harita sadece seni ilgilendiren hamlelerde yaklaşır; botlar arası hamlelerde sabit kalır */
  setHL([],ri);if(pid===0||d===0)focusOn([ri],2);
  const tw=R.castle?' · '+t('towersLeft',{n:R.towers}):'';
  if(pid!==0){const youDef=d===0;
    await banner(t('bBotTurn',{p:pname(pid)}),(youDef?t('bYouDefend',{r:rn(ri)}):t('bTarget',{r:rn(ri),d:pname(d)}))+tw,G.players[pid].color,youDef?TIMING.bannerYou+700:tm('botBanner'),youDef)}
  else if(R.castle)await banner(t('bSiege',{d:pname(d)}),t('towersLeft',{n:R.towers}),YOU_COLOR,TIMING.banner);
  else await sleep(300);
  if(R.castle){
    while(R.towers>0){const o=await duel(pid,d,ri);hideCard();outcomeSfx(pid,d,o);
      if(o==='att'){R.towers--;redrawAll();flashRegion(ri,G.players[pid].color);if(R.towers>0){toast(t('tower',{r:rn(ri),n:R.towers}));await sleep(tm('towerPause'))}}
      else{if(o==='def'){R.value+=100;toast(t('held',{d:pname(d),r:rn(ri)}))}else toast(t('none',{r:rn(ri)}));redrawAll();break}}
    if(R.towers===0)await castleFalls(pid,d,ri);
  }else{
    const o=await duel(pid,d,ri);hideCard();outcomeSfx(pid,d,o);
    if(o==='att'){R.owner=pid;if(G.players[d].backup===ri)G.players[d].backup=-1;addGold(pid,GOLD.capture,true);flashRegion(ri,G.players[pid].color);toast(t('took',{a:pname(pid),r:rn(ri)}))}
    else if(o==='def'){R.value+=100;toast(t('held',{d:pname(d),r:rn(ri)}))}else toast(t('none',{r:rn(ri)}));
    redrawAll();
  }
  await sleep(tm('resultHold')*.5);clearHL();await sleep(tm('afterTurn'));
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
  while(freeR().length){G.round++;renderPhase();setActive(-1);setStatus(()=>[t('bExpand',{n:G.round}),t('bExpandSub')]);
    if(G.round===1)await banner(t('bExpand',{n:G.round}),t('bExpandSub'),'',TIMING.banner);else await sleep(900);
    const rk=await askEst(nextEst(MODE().event),alive(),t('est'),t('all'));hideCard();addGold(rk[0],GOLD.estWin,true);
    /* en yakın tahmin 2, ikinci 1 bölge; 4+ oyuncuda üçüncü de 1 bölge seçer */
    const picks=[[rk[0],2],[rk[1],1]];if(rk.length>=4)picks.push([rk[2],1]);
    for(const [pid,n] of picks)for(let k=0;k<n;k++){if(!freeR().length)break;await pickRegion(pid,n-k,k===0)}
  }
  G.phase='war';const WAR=MODE().war;animateView({z:1,cx:W/2,cy:H/2});await banner(t('bWar'),t('bWarSub',{n:WAR}),'',TIMING.banner+600);
  const NP=G.players.length;
  for(let rd=1;rd<=WAR;rd++){G.round=rd;renderPhase();const order=[...Array(NP).keys()].map(k=>(k+rd-1)%NP);
    for(const pid of order){if(!G.players[0].alive||alive().length<2)break;if(G.players[pid].alive)await attackTurn(pid)}
    if(!G.players[0].alive||alive().length<2)break}
  if(my!==gameNo)return;
  G.phase='end';setActive(-1);renderPhase();hideFact();showEnd();
}

function showEnd(){
  const rk=[...G.players.keys()].sort((a,b)=>(G.players[b].alive-G.players[a].alive)||score(b)-score(a));
  const won=G.players[0].alive&&rk[0]===0;sfx(won?'win':'lose');
  const cats=[...CATS,...EVENT_CATS].filter(c=>G.stats[c]);
  const draw=()=>{const head=!G.players[0].alive?t('youLost'):won?t('win'):t('lose',{p:pname(rk[0])});
    showCard(`<div class="endt">${esc(head)}</div>
     <div class="rows">${rk.map((p,k)=>`<div class="row${k===0?' first':''}" style="--c:${G.players[p].color}"><span class="rk">${k+1}</span><span class="who2">${avatar(p,'sm')}${esc(pname(p))}${G.players[p].alive?'':' · '+t('out')}</span><span class="g">${fmtN(score(p))}</span><span class="df">${t('score')}</span></div>`).join('')}</div>
     ${cats.length?`<div class="report"><div class="lt">${t('report')}</div>${cats.map(c=>{const s=G.stats[c];const pct=Math.round(s.r/s.t*100);return `<div class="rep"><span class="badge" style="--k:${CAT[c].c}">${T(CAT[c].ab)}</span><span class="rn">${T(CAT[c].n)}</span><span class="bar"><i style="width:${pct}%;background:${CAT[c].c}"></i></span><span class="rv">${s.r}/${s.t}</span></div>`}).join('')}
       ${G.best>=2?`<div class="hint" style="text-align:left">${t('bestStreak',{n:G.best})}</div>`:''}</div>`:''}
     ${G.facts.length?`<details class="learned"><summary>${t('learned',{n:G.facts.length})}</summary><ul>${G.facts.map(id=>{const f=FACTS.find(x=>x.id===id);return `<li style="--k:${CAT[f.c].c}">${esc(T(f.f))}</li>`}).join('')}</ul></details>`:''}
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
    <div class="setgrp"><div class="lt ltrow"><span>${t('oppL')}</span><button class="link" id="reroll">${t('reroll')}</button></div>${seg('nOpp',[['2','2'],['3','3'],['4','4']],String(SET.nOpp))}<div class="opps">${SET.opps.map(oppCard).join('')}</div></div>
    <div class="setgrp"><div class="lt">${t('diffL')}</div>${seg('diff',[['easy',t('dEasy')],['normal',t('dNormal')],['hard',t('dHard')]],SET.diff)}</div>
    <button class="cta big" id="go">${t('start')}</button>
    <details class="how"><summary>${t('how')}</summary><ol class="rules"><li>${t('r1')}</li><li>${t('r2')}</li><li>${t('r3')}</li><li>${t('r4')}</li><li>${t('r5')}</li><li>${t('r6',{n:HINTS_PER_GAME,g:GOLD.hint})}</li><li>${t('r7',{w:GOLD.watchCorrect,o:GOLD.ownCorrect})}</li><li>${t('r8',{r:GOLD.repair,b:GOLD.backup})}</li></ol></details>`);
    card.querySelectorAll('[data-seg]').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{const k=g.dataset.seg;SET[k]=k==='nOpp'?+b.dataset.v:b.dataset.v;sfx('tap');
      g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-checked',String(x===b)));
      if(k==='nOpp'){SET.opps=pickOpps(SET.nOpp);card.querySelector('.opps').innerHTML=SET.opps.map(oppCard).join('')}
      saveSet();if(k==='map'||k==='nOpp')previewMap()}));
    $('#reroll').onclick=()=>{sfx('tap');let n,k=0;do{n=pickOpps(SET.nOpp)}while(n.join()===SET.opps.join()&&++k<20);SET.opps=n;saveSet();card.querySelector('.opps').innerHTML=SET.opps.map(oppCard).join('');previewMap()};
    $('#go').onclick=()=>{sfx('tap');hideCard();run()}};
  ovRerender=draw;draw();
}
/* başlangıç ekranının arkasında seçili haritayı göster */
async function previewMap(){await prepareMap();newGame();redrawAll();renderLegend();renderPhase();resetView();setStatus(()=>['',''])}

/* ===================== boot ===================== */
document.documentElement.lang=lang;
renderLangs();renderMute();renderSpeed();
buildMap(SET.map);newGame();renderLegend();renderPhase();resetView();
document.fonts.load('800 30px "Nunito"').catch(()=>{}).then(()=>document.fonts.ready).then(()=>{paint()});
redrawAll();
showStart();
