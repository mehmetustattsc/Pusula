/* ===================== question flows =====================
 * askMC: çoktan seçmeli · askOrder: sıralama bulmacası · askEst: tahmin
 * Sen düellodaysan cevap verirsin. Değilsen botların düellosunu izlersin ve (4x hız hariç)
 * her soru türünde sen de cevap verebilirsin; bu düelloyu etkilemez:
 *   çoktan seçmeli / sıralama doğruysa, tahminde de botlardan daha yakınsan GOLD.watchCorrect altın.
 * İpucu (joker): oyun başında HINTS_PER_GAME bedava hak, sonra GOLD.hint altın. Soru başına bir kez.
 *   çoktan seçmeli → iki yanlış şık silinir · tahmin → cevabın bulunduğu aralık · sıralama → ilk öğe yerleşir
 * Bütün süreler state.js'teki TIMING'den gelir; sonuç ekranları dokunarak geçilebilir.
 */
const HUMAN_MS={mc:15000,ord:25000,est:15000};
const canHint=()=>G.hints>0||G.players[0].gold>=GOLD.hint;
const hintBtn=()=>G.hints>0?`<button class="hintb" id="hint">${t('hint')} <span>${t('hintLeft',{n:G.hints})}</span></button>`
  :`<button class="hintb" id="hint" ${canHint()?'':'disabled'}>${t('hint')} <span>${coin()}${GOLD.hint}</span></button>`;
function useHint(fn){const b=$('#hint');if(!b)return;b.onclick=e=>{e.stopPropagation();if(!canHint())return;
  if(G.hints>0)G.hints--;else addGold(0,-GOLD.hint);sfx('tap');b.remove();fn()}}
function revealSfx(human,ok){if(human)sfx(ok?'ok':'no')}
const watchable=()=>G.players[0].alive&&watchSpeed<4;
/* izleme kartlarında hız düğmesi (karta dokunmak "geç" demek, bu düğme değil) */
const speedPill=()=>`<button class="spd" id="spd">${t('speed')} ${watchSpeed}x</button>`;
function bindSpeed(){const b=$('#spd');if(b)b.onclick=e=>{e.stopPropagation();setWatchSpeed(watchSpeed===1?2:watchSpeed===2?4:1);b.textContent=`${t('speed')} ${watchSpeed}x`;sfx('tap')}}
const watchBanner=()=>`<div class="bonus">${coin()}${t('watchHint',{n:GOLD.watchCorrect})}</div>`;
/* izlerken verdiğin cevabın sonucu: ödül + kart altında not */
function watchResult(q,ok,line){record(q.c,ok);revealSfx(true,ok);if(ok)addGold(0,GOLD.watchCorrect,true);
  return `<div class="bonus ${ok?'won':'lost'}">${line?line+' · ':''}${ok?t('watchWin',{n:GOLD.watchCorrect}):t('watchLose')}</div>`}
const watchFoot=()=>`<div class="row2 end">${speedPill()}</div>`;
const holdOwn=()=>TIMING.revealOwn;
const holdWatch=answered=>tm(answered?'revealWatchAns':'revealWatch');

async function askMC(q,pids,ctxHtml){
  const human=pids.includes(0),watch=!human&&watchable();
  const opts=shuffle(q.a.map((a,i)=>({a,ok:i===0})));const okIdx=opts.findIndex(o=>o.ok);
  const bot={};pids.filter(p=>p!==0).forEach(p=>{const ok=Math.random()<accOf(p,q.c);let idx=okIdx;if(!ok){const w=[0,1,2,3].filter(i=>i!==okIdx);idx=w[Math.floor(Math.random()*3)]}bot[p]=idx});
  showCard(`<div class="qh">${chip(q.c)}${q.fact&&human?`<span class="fq">${t('factQ')}</span>`:''}<span class="ctx">${ctxHtml}</span></div><div class="timer"><i id="tb"></i></div><div class="qt">${esc(T(q.q))}</div>
   ${watch?watchBanner():''}
   <div class="opts">${opts.map((o,i)=>`<button class="opt" data-i="${i}" ${human||watch?'':'disabled'}><span class="l">${'ABCD'[i]}</span><span class="tx">${esc(T(o.a))}</span><span class="who"></span></button>`).join('')}</div>
   ${human?hintBtn():''}${!human?watchFoot():''}<div id="foot"></div>`);
  bindSpeed();
  let hi=null;const btns=[...card.querySelectorAll('.opt')];
  const pickP=ms=>{const tmr=timer(ms,$('#tb'));return Promise.race([tmr.p,new Promise(res=>btns.forEach(b=>b.onclick=e=>{e.stopPropagation();hi=+b.dataset.i;b.classList.add('pick');sfx('tap');res()}))]).then(()=>tmr.cancel())};
  if(human){
    useHint(()=>{shuffle([0,1,2,3].filter(i=>i!==okIdx)).slice(0,2).forEach(i=>{btns[i].disabled=true;btns[i].classList.add('gone')})});
    if(AUTO)hi=Math.random()<.6?okIdx:Math.floor(Math.random()*4);else await pickP(HUMAN_MS.mc);
  }else if(watch){
    if(AUTO)hi=Math.random()<.5?okIdx:null;else await pickP(tm('watchMC'));
  }else{const tmr=timer(tm('specQuestion')*SPEED,$('#tb'));await tmr.p}
  const hb=$('#hint');if(hb)hb.remove();
  btns.forEach((b,i)=>{b.disabled=true;b.classList.remove('gone');if(i===okIdx)b.classList.add('ok');else if(i===hi)b.classList.add('no');
    const w=pids.filter(p=>(p===0?hi:bot[p])===i);b.querySelector('.who').innerHTML=w.map(dot).join('')+(watch&&hi===i?dot(0):'')});
  const res={};pids.forEach(p=>res[p]=p===0?hi===okIdx:bot[p]===okIdx);
  if(human){record(q.c,res[0]);revealSfx(true,res[0]);if(res[0])addGold(0,GOLD.ownCorrect+(q.fact?GOLD.factBonus:0),true);if(res[0]&&q.fact)setTimeout(()=>toast(t('factBonus',{n:GOLD.factBonus})),900)}
  pids.filter(p=>p!==0&&res[p]).forEach(p=>addGold(p,GOLD.ownCorrect));
  const extra=watch&&hi!=null?watchResult(q,hi===okIdx):'';
  $('#foot').innerHTML=(human&&hi==null?`<div class="hint">${t('timeout')}</div>`:'')+extra+resLine(pids,res)+`<div class="hint">${t('tapSkip')}</div>`;
  await waitOrTap(human?holdOwn():holdWatch(watch&&hi!=null));return res;
}

/* Sıralama: öğelere sırayla dokun → numara alır. Numaralı öğeye tekrar dokunursan geri alınır
   (sonrakiler bir kayar). Dördü de yerleşince "Onayla" ile gönderilir. İzlerken de çözebilirsin. */
async function askOrder(q,pids,ctxHtml){
  const human=pids.includes(0),watch=!human&&watchable(),play=human||watch;
  const items=shuffle(q.items.map((it,i)=>({it,i})));
  const res={};pids.filter(p=>p!==0).forEach(p=>res[p]=Math.random()<accOf(p,q.c)*.85);
  showCard(`<div class="qh">${chip(q.c)}<span class="ctx">${ctxHtml}</span></div><div class="timer"><i id="tb"></i></div><div class="qt">${esc(T(q.q))}</div>
   <div class="hint" style="text-align:left">${t('order')}${play?' · '+t('orderHint'):''}</div>
   ${watch?watchBanner():''}
   <div class="ord">${items.map((o,k)=>`<button class="oi" data-k="${k}" ${play?'':'disabled'}><span class="n"></span><span class="ot">${esc(T(o.it))}</span></button>`).join('')}</div>
   ${play?`<div class="row2" id="octl"><button class="ghost" id="undo">${t('undo')}</button><button class="ghost" id="rs">${t('reset')}</button>${human?hintBtn():''}<button class="cta sm" id="ok" disabled>${t('confirm')}</button></div>`:''}
   ${!human?watchFoot():''}<div id="foot"></div>`);
  bindSpeed();
  let seq=[],locked=-1,mine=null;
  if(play){
    const btns=[...card.querySelectorAll('.oi')],okB=$('#ok');
    const upd=()=>{btns.forEach(b=>{const k=+b.dataset.k,p=seq.indexOf(k);b.classList.toggle('set',p>=0);b.classList.toggle('lock',k===locked);b.querySelector('.n').textContent=p>=0?p+1:''});
      okB.disabled=seq.length!==items.length;$('#undo').disabled=seq.length<=(locked>=0?1:0)};
    upd();
    if(AUTO){seq=Math.random()<.5?items.map((o,k)=>k).sort((a,b)=>items[a].i-items[b].i):shuffle(items.map((o,k)=>k))}
    else{const tmr=timer(human?HUMAN_MS.ord:tm('watchOrd'),$('#tb'));
      await Promise.race([tmr.p,new Promise(done=>{
        if(human)useHint(()=>{locked=items.findIndex(o=>o.i===0);seq=[locked,...seq.filter(k=>k!==locked)];upd()});
        btns.forEach(b=>b.onclick=e=>{e.stopPropagation();const k=+b.dataset.k;if(k===locked)return;sfx('tap');
          if(seq.includes(k))seq=seq.filter(x=>x!==k);else seq.push(k);upd()});
        $('#undo').onclick=e=>{e.stopPropagation();if(seq.length>(locked>=0?1:0)){seq.pop();sfx('tap');upd()}};
        $('#rs').onclick=e=>{e.stopPropagation();seq=locked>=0?[locked]:[];sfx('tap');upd()};
        okB.onclick=e=>{e.stopPropagation();if(seq.length===items.length)done()}})]);tmr.cancel()}
    mine=seq.length===items.length&&seq.every((k,pos)=>items[k].i===pos);
    if(human)res[0]=mine;
  }else{const tmr=timer(tm('specQuestion')*SPEED,$('#tb'));await tmr.p}
  card.querySelectorAll('.oi').forEach(b=>{const k=+b.dataset.k;b.disabled=true;b.querySelector('.n').textContent=items[k].i+1;b.classList.add('set');if(play&&seq.length)b.classList.add(seq.indexOf(k)===items[k].i?'ok':'no')});
  const r2=$('#octl');if(r2)r2.remove();
  if(human){record(q.c,res[0]);revealSfx(true,res[0]);if(res[0]&&pids.length>1)addGold(0,GOLD.ownCorrect,true)}
  if(pids.length>1)pids.filter(p=>p!==0&&res[p]).forEach(p=>addGold(p,GOLD.ownCorrect));
  const extra=watch&&seq.length?watchResult(q,mine):'';
  $('#foot').innerHTML=extra+resLine(pids,res)+`<div class="hint">${t('tapSkip')}</div>`;
  await waitOrTap(human?holdOwn():holdWatch(watch&&seq.length>0));return res;
}

/* Tahmin: en yakın tahmin kazanır, eşitlikte hızlı olan. İzlerken de tahmin edebilirsin:
   düelloya katılmaz, ama bütün botlardan daha yakınsan altın kazanırsın. */
async function askEst(q,pids,label,ctxHtml){
  const human=pids.includes(0),watch=!human&&watchable(),play=human||watch;
  const year=q.u==='y';const unit=year?'':q.u;
  const guesses={};
  pids.filter(p=>p!==0).forEach(p=>{const a=accOf(p,q.c);let g=year?Math.round(q.v+gauss()*(15+(1-a)*110)):Math.round(q.v*Math.max(.05,1+gauss()*(.08+(1-a)*.42)));guesses[p]={v:Math.max(0,g),tm:rnd(3,11)}});
  let val='',my=null;
  showCard(`<div class="qh">${chip(q.c)}<span class="ctx">${label}${ctxHtml?' · '+ctxHtml:''}</span></div><div class="timer"><i id="tb"></i></div><div class="qt">${esc(T(q.q))}</div><div id="body">
   ${watch?watchBanner():''}
   ${play?`<div class="disp" id="disp">&nbsp;</div><div class="range" id="range" hidden></div><div class="pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-n="${n}">${n}</button>`).join('')}<button data-n="del" aria-label="del">⌫</button><button data-n="0">0</button><button class="go" data-n="go">${t('send')}</button></div>${human?hintBtn():''}`:''}
   <div class="hint">${t('estHint')}</div>${!human?watchFoot():''}</div>`);
  bindSpeed();
  if(play){
    if(AUTO){my={v:Math.round(q.v*rnd(.7,1.3)),tm:rnd(2,9)}}
    else{const tmr=timer(human?HUMAN_MS.est:tm('watchEst'),$('#tb'));const disp=$('#disp');
      if(human)useHint(()=>{/* cevabı içeren, rastgele kaydırılmış bir aralık */
        let lo,hi;if(year){const w=40,o=Math.floor(Math.random()*w);lo=q.v-o;hi=lo+w}else{const w=.5,o=Math.random()*w;lo=Math.round(q.v*(1-o));hi=Math.round(q.v*(1-o+w))}
        const r=$('#range');r.hidden=false;r.textContent=t('rangeHint',{lo:fmtN(Math.max(0,lo),year),hi:fmtN(hi,year)})});
      const upd=()=>disp.innerHTML=(val?esc(fmtN(+val,year)):'&nbsp;')+(unit?`<span class="u">${esc(unit)}</span>`:'');upd();
      await Promise.race([tmr.p,new Promise(res=>card.querySelectorAll('.pad button').forEach(b=>b.onclick=e=>{e.stopPropagation();const n=b.dataset.n;if(n==='go'){if(val)res()}else if(n==='del')val=val.slice(0,-1);else if(val.length<9)val=(val==='0'?'':val)+n;sfx('tap');upd()}))]);
      my={v:val===''?null:+val,tm:tmr.el()};tmr.cancel()}
    if(human)guesses[0]=my;
  }else{const tmr=timer(tm('specQuestion')*SPEED,$('#tb'));await tmr.p}
  const dist=g=>g.v==null?Infinity:Math.abs(g.v-q.v);
  const rank=pids.slice().sort((a,b)=>dist(guesses[a])-dist(guesses[b])||guesses[a].tm-guesses[b].tm);
  if(human)sfx(rank[0]===0?'ok':'tap');
  let extra='';
  if(watch&&my&&my.v!=null){const ok=pids.every(p=>dist(my)<dist(guesses[p]));extra=watchResult(q,ok,t('yourGuess',{v:fmtN(my.v,year),d:fmtN(Math.abs(my.v-q.v),year)}))}
  $('#body').innerHTML=`<div class="truth"><div class="lb">${t('answer')}</div><div class="v">${fmtN(q.v,year)}${unit?` <span style="font-size:1rem;color:var(--muted)">${esc(unit)}</span>`:''}</div></div>
   ${extra}<div class="rows">${rank.map((p,k)=>{const g=guesses[p];return `<div class="row${k===0?' first':''}" style="--c:${G.players[p].color}"><span class="rk">${k+1}</span><span>${esc(pname(p))}</span><span class="g">${g.v==null?t('noAnswer'):fmtN(g.v,year)}</span><span class="df">${g.v==null?'':t('diff')+' '+fmtN(Math.abs(g.v-q.v),year)} · ${g.tm.toFixed(1)}s</span></div>`}).join('')}</div><div class="hint">${t('tapSkip')}</div>`;
  await waitOrTap(human?holdOwn()+600:holdWatch(watch&&my&&my.v!=null));return rank;
}
