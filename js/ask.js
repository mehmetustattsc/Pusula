/* ===================== question flows =====================
 * askMC: çoktan seçmeli · askOrder: sıralama bulmacası · askEst: tahmin
 * Sen düellodaysan cevap verirsin; değilsen botların düellosunu izlersin.
 * İpucu (joker): oyun başına HINTS_PER_GAME hak, soru başına en fazla bir kez.
 *   çoktan seçmeli → iki yanlış şık silinir · tahmin → cevabın bulunduğu aralık · sıralama → ilk öğe yerleşir
 */
const HUMAN_MS={mc:15000,ord:25000,est:15000};
const spec=ms=>ms*MODE().pace;   // izleme süreleri moda göre
const hintBtn=()=>G.hints>0?`<button class="hintb" id="hint">${t('hint')} <span>${t('hintLeft',{n:G.hints})}</span></button>`:'';
function useHint(fn){const b=$('#hint');if(!b)return;b.onclick=()=>{if(G.hints<=0)return;G.hints--;sfx('tap');b.remove();fn()}}
function revealSfx(human,ok){if(human)sfx(ok?'ok':'no')}

async function askMC(q,pids,ctxHtml){
  const human=pids.includes(0);
  const opts=shuffle(q.a.map((a,i)=>({a,ok:i===0})));const okIdx=opts.findIndex(o=>o.ok);
  const bot={};pids.filter(p=>p!==0).forEach(p=>{const ok=Math.random()<accOf(p,q.c);let idx=okIdx;if(!ok){const w=[0,1,2,3].filter(i=>i!==okIdx);idx=w[Math.floor(Math.random()*3)]}bot[p]=idx});
  showCard(`<div class="qh">${chip(q.c)}<span class="ctx">${ctxHtml}</span></div><div class="timer"><i id="tb"></i></div><div class="qt">${esc(T(q.q))}</div>
   <div class="opts">${opts.map((o,i)=>`<button class="opt" data-i="${i}" ${human?'':'disabled'}><span class="l">${'ABCD'[i]}</span><span class="tx">${esc(T(o.a))}</span><span class="who"></span></button>`).join('')}</div>${human?hintBtn():''}<div id="foot"></div>`);
  let hi=null;
  if(human){
    const btns=[...card.querySelectorAll('.opt')];
    useHint(()=>{shuffle([0,1,2,3].filter(i=>i!==okIdx)).slice(0,2).forEach(i=>{btns[i].disabled=true;btns[i].classList.add('gone')})});
    if(AUTO){hi=Math.random()<.6?okIdx:Math.floor(Math.random()*4)}
    else{const tm=timer(HUMAN_MS.mc,$('#tb'));await Promise.race([tm.p,new Promise(res=>btns.forEach(b=>b.onclick=()=>{hi=+b.dataset.i;b.classList.add('pick');res()}))]);tm.cancel()}
  }else{const tm=timer(spec(1300)*SPEED,$('#tb'));await tm.p}
  const hb=$('#hint');if(hb)hb.remove();
  card.querySelectorAll('.opt').forEach((b,i)=>{b.disabled=true;b.classList.remove('gone');if(i===okIdx)b.classList.add('ok');else if(i===hi)b.classList.add('no');
    const w=pids.filter(p=>(p===0?hi:bot[p])===i);b.querySelector('.who').innerHTML=w.map(dot).join('')});
  const res={};pids.forEach(p=>res[p]=p===0?hi===okIdx:bot[p]===okIdx);
  if(human){record(q.c,res[0]);revealSfx(true,res[0])}
  $('#foot').innerHTML=(human&&hi==null?`<div class="hint">${t('timeout')}</div>`:'')+resLine(pids,res)+`<div class="hint">${t('tapSkip')}</div>`;
  await waitOrTap(human?2600:spec(1600));return res;
}

/* Sıralama: öğelere sırayla dokun → numara alır. Numaralı öğeye tekrar dokunursan geri alınır
   (sonrakiler bir kayar). Dördü de yerleşince "Onayla" ile gönderilir; süre biterse o anki sıra sayılır. */
async function askOrder(q,pids,ctxHtml){
  const human=pids.includes(0);const items=shuffle(q.items.map((it,i)=>({it,i})));
  const res={};pids.filter(p=>p!==0).forEach(p=>res[p]=Math.random()<accOf(p,q.c)*.85);
  showCard(`<div class="qh">${chip(q.c)}<span class="ctx">${ctxHtml}</span></div><div class="timer"><i id="tb"></i></div><div class="qt">${esc(T(q.q))}</div>
   <div class="hint" style="text-align:left">${t('order')} · ${human?t('orderHint'):''}</div>
   <div class="ord">${items.map((o,k)=>`<button class="oi" data-k="${k}" ${human?'':'disabled'}><span class="n"></span><span class="ot">${esc(T(o.it))}</span></button>`).join('')}</div>
   ${human?`<div class="row2"><button class="ghost" id="undo">${t('undo')}</button><button class="ghost" id="rs">${t('reset')}</button>${hintBtn()}<button class="cta sm" id="ok" disabled>${t('confirm')}</button></div>`:''}<div id="foot"></div>`);
  let seq=[],locked=-1;
  if(human){
    const btns=[...card.querySelectorAll('.oi')],okB=$('#ok');
    const upd=()=>{btns.forEach(b=>{const k=+b.dataset.k,p=seq.indexOf(k);b.classList.toggle('set',p>=0);b.classList.toggle('lock',k===locked);b.querySelector('.n').textContent=p>=0?p+1:''});
      okB.disabled=seq.length!==items.length;$('#undo').disabled=seq.length<=(locked>=0?1:0)};
    upd();
    if(AUTO){seq=Math.random()<.5?items.map((o,k)=>k).sort((a,b)=>items[a].i-items[b].i):shuffle(items.map((o,k)=>k))}
    else{const tm=timer(HUMAN_MS.ord,$('#tb'));
      await Promise.race([tm.p,new Promise(done=>{
        useHint(()=>{locked=items.findIndex(o=>o.i===0);seq=[locked,...seq.filter(k=>k!==locked)];upd()});
        btns.forEach(b=>b.onclick=()=>{const k=+b.dataset.k;if(k===locked)return;sfx('tap');
          if(seq.includes(k))seq=seq.filter(x=>x!==k);else seq.push(k);upd()});
        $('#undo').onclick=()=>{if(seq.length>(locked>=0?1:0)){seq.pop();sfx('tap');upd()}};
        $('#rs').onclick=()=>{seq=locked>=0?[locked]:[];sfx('tap');upd()};
        okB.onclick=()=>{if(seq.length===items.length)done()}})]);tm.cancel()}
    res[0]=seq.length===items.length&&seq.every((k,pos)=>items[k].i===pos)
  }else{const tm=timer(spec(1500)*SPEED,$('#tb'));await tm.p}
  card.querySelectorAll('.oi').forEach(b=>{const k=+b.dataset.k;b.disabled=true;b.querySelector('.n').textContent=items[k].i+1;b.classList.add('set');if(human)b.classList.add(seq.indexOf(k)===items[k].i?'ok':'no')});
  const r2=card.querySelector('.row2');if(r2)r2.remove();
  if(human){record(q.c,res[0]);revealSfx(true,res[0])}
  $('#foot').innerHTML=resLine(pids,res)+`<div class="hint">${t('tapSkip')}</div>`;
  await waitOrTap(human?3000:spec(1800));return res;
}

async function askEst(q,pids,label,ctxHtml){
  const human=pids.includes(0);const year=q.u==='y';const unit=year?'':q.u;
  const guesses={};
  pids.filter(p=>p!==0).forEach(p=>{const a=accOf(p,q.c);let g=year?Math.round(q.v+gauss()*(15+(1-a)*110)):Math.round(q.v*Math.max(.05,1+gauss()*(.08+(1-a)*.42)));guesses[p]={v:Math.max(0,g),tm:rnd(3,11)}});
  let val='';
  showCard(`<div class="qh">${chip(q.c)}<span class="ctx">${label}${ctxHtml?' · '+ctxHtml:''}</span></div><div class="timer"><i id="tb"></i></div><div class="qt">${esc(T(q.q))}</div><div id="body">
   ${human?`<div class="disp" id="disp">&nbsp;</div><div class="range" id="range" hidden></div><div class="pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-n="${n}">${n}</button>`).join('')}<button data-n="del" aria-label="del">⌫</button><button data-n="0">0</button><button class="go" data-n="go">${t('send')}</button></div>${hintBtn()}<div class="hint">${t('estHint')}</div>`:`<div class="hint">${t('estHint')}</div>`}</div>`);
  if(human){
    if(AUTO){guesses[0]={v:Math.round(q.v*rnd(.7,1.3)),tm:rnd(2,9)}}
    else{const tm=timer(HUMAN_MS.est,$('#tb'));const disp=$('#disp');
      useHint(()=>{/* cevabı içeren, rastgele kaydırılmış bir aralık */
        let lo,hi;if(year){const w=40,o=Math.floor(Math.random()*w);lo=q.v-o;hi=lo+w}else{const w=.5,o=Math.random()*w;lo=Math.round(q.v*(1-o));hi=Math.round(q.v*(1-o+w))}
        const r=$('#range');r.hidden=false;r.textContent=t('rangeHint',{lo:fmtN(Math.max(0,lo),year),hi:fmtN(hi,year)})});
      const upd=()=>disp.innerHTML=(val?esc(fmtN(+val,year)):'&nbsp;')+(unit?`<span class="u">${esc(unit)}</span>`:'');upd();
      await Promise.race([tm.p,new Promise(res=>card.querySelectorAll('.pad button').forEach(b=>b.onclick=()=>{const n=b.dataset.n;if(n==='go'){if(val)res()}else if(n==='del')val=val.slice(0,-1);else if(val.length<9)val=(val==='0'?'':val)+n;upd()}))]);
      guesses[0]={v:val===''?null:+val,tm:tm.el()};tm.cancel()}
  }else{const tm=timer(spec(1500)*SPEED,$('#tb'));await tm.p}
  const rank=pids.slice().sort((a,b)=>{const da=guesses[a].v==null?Infinity:Math.abs(guesses[a].v-q.v),db=guesses[b].v==null?Infinity:Math.abs(guesses[b].v-q.v);return da-db||guesses[a].tm-guesses[b].tm});
  if(human)sfx(rank[0]===0?'ok':'tap');
  $('#body').innerHTML=`<div class="truth"><div class="lb">${t('answer')}</div><div class="v">${fmtN(q.v,year)}${unit?` <span style="font-size:1rem;color:var(--muted)">${esc(unit)}</span>`:''}</div></div>
   <div class="rows">${rank.map((p,k)=>{const g=guesses[p];return `<div class="row${k===0?' first':''}" style="--c:${G.players[p].color}"><span class="rk">${k+1}</span><span>${esc(pname(p))}</span><span class="g">${g.v==null?t('noAnswer'):fmtN(g.v,year)}</span><span class="df">${g.v==null?'':t('diff')+' '+fmtN(Math.abs(g.v-q.v),year)} · ${g.tm.toFixed(1)}s</span></div>`}).join('')}</div><div class="hint">${t('tapSkip')}</div>`;
  await waitOrTap(human?3400:spec(2200));return rank;
}
