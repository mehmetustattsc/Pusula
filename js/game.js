/* ===================== game flow ===================== */
function allowedFor(pid){const free=new Set(freeR());const adj=new Set();owned(pid).forEach(r=>ADJ[r].forEach(n=>{if(free.has(n))adj.add(n)}));return adj.size?[...adj]:[...free]}
function targetsFor(pid){const s=new Set();owned(pid).forEach(r=>ADJ[r].forEach(n=>{const o=G.regions[n].owner;if(o>=0&&o!==pid&&G.players[o].alive)s.add(n)}));return [...s]}
function setActive(pid){G.active=pid;renderPlayers()}
async function pickRegion(pid,left){
  const allowed=allowedFor(pid);if(!allowed.length)return;setActive(pid);
  let r;
  if(pid===0){setStatus(()=>[left>1?t('pick2'):t('pick1'),t('pickHint')]);setHL(allowed);scrollToRegions(allowed);r=await waitRegionTap(allowed)}
  else{setStatus(()=>[t('botPick',{p:pname(pid)}),'']);setHL(allowed);await sleep(650);
    const P=G.players[pid];r=allowed.map(i=>({i,s:P.p[G.regions[i].cat]+ADJ[i].filter(n=>G.regions[n].owner<0).length*.04+Math.random()*.25})).sort((a,b)=>b.s-a.s)[0].i;
    setHL([],r);await sleep(450)}
  G.regions[r].owner=pid;clearHL();redrawAll();toast(t('picked',{p:pname(pid),r:G.regions[r].name}));
}
async function duel(a,d,ri){
  const R=G.regions[ri];const q=nextDuel(R.cat);
  const ctxH=`<b style="color:${G.players[a].color}">${esc(pname(a))}</b> → <b style="color:${G.players[d].color}">${esc(pname(d))}</b> · ${esc(R.name)}${R.castle?' · '+t('castle'):''}`;
  const res=q.type==='ord'?await askOrder(q,[a,d],ctxH):await askMC(q,[a,d],ctxH);
  if(res[a]&&!res[d])return 'att';if(res[d]&&!res[a])return 'def';if(!res[a]&&!res[d])return 'none';
  toast(t('tie'));const rk=await askEst(nextEst(),[a,d],t('tiebreak'),ctxH);return rk[0]===a?'att':'def';
}
async function attackTurn(pid){
  setActive(pid);const tg=targetsFor(pid);
  if(!tg.length){setStatus(()=>[t('noTarget',{p:pname(pid)}),'']);await sleep(900);return}
  let ri;
  if(pid===0){setStatus(()=>[t('yourTurn'),t('attackHint')]);setHL(tg);scrollToRegions(tg);ri=await waitRegionTap(tg)}
  else{setStatus(()=>[t('botTurn',{p:pname(pid)}),'']);setHL(tg);await sleep(700);const P=G.players[pid];
    ri=tg.map(i=>{const R=G.regions[i];const da=accOf(R.owner,R.cat);let s=P.p[R.cat]-da*.8+R.value/2000+Math.random()*.25;if(R.castle)s+=(3-R.towers)*.25-.35;return{i,s}}).sort((x,y)=>y.s-x.s)[0].i}
  setHL([],ri);scrollToRegions([ri]);await sleep(500);
  const R=G.regions[ri],d=R.owner;
  if(R.castle){
    while(R.towers>0){const o=await duel(pid,d,ri);hideCard();
      if(o==='att'){R.towers--;redrawAll();if(R.towers>0){toast(t('tower',{r:R.name,n:R.towers}));await sleep(900)}}
      else{if(o==='def'){R.value+=100;toast(t('held',{d:pname(d),r:R.name}))}else toast(t('none',{r:R.name}));redrawAll();break}}
    if(R.towers===0){G.regions.forEach(x=>{if(x.owner===d)x.owner=pid});R.castle=false;G.players[d].alive=false;redrawAll();toast(t('fell',{a:pname(pid),d:pname(d)}));setStatus(()=>[t('fell',{a:pname(pid),d:pname(d)}),'']);await sleep(1600)}
  }else{
    const o=await duel(pid,d,ri);hideCard();
    if(o==='att'){R.owner=pid;toast(t('took',{a:pname(pid),r:R.name}))}else if(o==='def'){R.value+=100;toast(t('held',{d:pname(d),r:R.name}))}else toast(t('none',{r:R.name}));
    redrawAll();
  }
  clearHL();await sleep(900);
}
async function run(){
  newGame();redrawAll();renderPhase();
  G.phase='expand';
  while(freeR().length){G.round++;renderPhase();setActive(-1);setStatus(()=>[t('waitExpand'),'']);await sleep(500);
    const rk=await askEst(nextEst(),alive(),t('est'),t('all'));hideCard();
    for(const [pid,n] of [[rk[0],2],[rk[1],1]])for(let k=0;k<n;k++){if(!freeR().length)break;await pickRegion(pid,n-k)}
  }
  G.phase='war';
  for(let rd=1;rd<=4;rd++){G.round=rd;renderPhase();const order=[0,1,2].map(k=>(k+rd-1)%3);
    for(const pid of order){if(!G.players[0].alive||alive().length<2)break;if(G.players[pid].alive)await attackTurn(pid)}
    if(!G.players[0].alive||alive().length<2)break}
  G.phase='end';setActive(-1);renderPhase();showEnd();
}
function showEnd(){
  const rk=[0,1,2].sort((a,b)=>(G.players[b].alive-G.players[a].alive)||score(b)-score(a));
  const draw=()=>{const head=!G.players[0].alive?t('youLost'):rk[0]===0?t('win'):t('lose',{p:pname(rk[0])});
    showCard(`<div class="endt">${esc(head)}</div><div class="rows">${rk.map((p,k)=>`<div class="row${k===0?' first':''}" style="--c:${G.players[p].color}"><span class="rk">${k+1}</span><span>${esc(pname(p))}${G.players[p].alive?'':' · '+t('out')}</span><span class="g">${fmtN(score(p))}</span><span class="df">${t('score')}</span></div>`).join('')}</div><button class="cta" id="again">${t('again')}</button>`);
    $('#again').onclick=()=>{hideCard();run()}};
  ovRerender=draw;draw();setStatus(()=>[t('final'),'']);
}
function showStart(){
  const draw=()=>{showCard(`<div class="cardtop"><div class="hero"><h1>PUSULA</h1><p>${t('tag')}</p><p class="qu">“${t('quote')}”<span>— Atatürk</span></p></div><div class="langs">${LANGS.map(l=>`<button data-l="${l}" aria-pressed="${l===lang}">${l.toUpperCase()}</button>`).join('')}</div></div>
    <ol class="rules"><li>${t('r1')}</li><li>${t('r2')}</li><li>${t('r3')}</li><li>${t('r4')}</li><li>${t('r5')}</li></ol><button class="cta" id="go">${t('start')}</button>`);
    $('#go').onclick=()=>{hideCard();run()}};
  ovRerender=draw;draw();
}

/* ===================== boot ===================== */
document.documentElement.lang=lang;
buildMap();renderLangs();$('#sub').textContent=t('sub');renderLegend();renderZoom();renderPhase();
newGame();
document.fonts.load('600 27px "IBM Plex Sans"').catch(()=>{}).then(()=>document.fonts.ready).then(()=>{redrawAll()});
redrawAll();
showStart();
