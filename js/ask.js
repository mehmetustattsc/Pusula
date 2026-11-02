/* ===================== question flows ===================== */
async function askMC(q,pids,ctxHtml){
  const human=pids.includes(0);
  const opts=shuffle(q.a.map((a,i)=>({a,ok:i===0})));const okIdx=opts.findIndex(o=>o.ok);
  const bot={};pids.filter(p=>p!==0).forEach(p=>{const ok=Math.random()<accOf(p,q.c);let idx=okIdx;if(!ok){const w=[0,1,2,3].filter(i=>i!==okIdx);idx=w[Math.floor(Math.random()*3)]}bot[p]=idx});
  showCard(`<div class="qh">${chip(q.c)}<span class="ctx">${ctxHtml}</span></div><div class="timer"><i id="tb"></i></div><div class="qt">${esc(T(q.q))}</div>
   <div class="opts">${opts.map((o,i)=>`<button class="opt" data-i="${i}" ${human?'':'disabled'}><span class="l">${'ABCD'[i]}</span><span class="tx">${esc(T(o.a))}</span><span class="who"></span></button>`).join('')}</div><div id="foot"></div>`);
  let hi=null;
  if(human){const tm=timer(15000,$('#tb'));await Promise.race([tm.p,new Promise(res=>card.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{hi=+b.dataset.i;b.classList.add('pick');res()}))]);tm.cancel()}
  else{const tm=timer(1600,$('#tb'));await tm.p}
  card.querySelectorAll('.opt').forEach((b,i)=>{b.disabled=true;if(i===okIdx)b.classList.add('ok');else if(i===hi)b.classList.add('no');
    const w=pids.filter(p=>(p===0?hi:bot[p])===i);b.querySelector('.who').innerHTML=w.map(dot).join('')});
  const res={};pids.forEach(p=>res[p]=p===0?hi===okIdx:bot[p]===okIdx);
  $('#foot').innerHTML=(human&&hi==null?`<div class="hint">${t('timeout')}</div>`:'')+resLine(pids,res)+`<div class="hint">${t('tapSkip')}</div>`;
  await waitOrTap(human?2600:1900);return res;
}
async function askOrder(q,pids,ctxHtml){
  const human=pids.includes(0);const items=shuffle(q.items.map((it,i)=>({it,i})));
  const res={};pids.filter(p=>p!==0).forEach(p=>res[p]=Math.random()<accOf(p,q.c)*.85);
  showCard(`<div class="qh">${chip(q.c)}<span class="ctx">${ctxHtml}</span></div><div class="timer"><i id="tb"></i></div><div class="qt">${esc(T(q.q))}</div>
   <div class="hint" style="text-align:left">${t('order')} · ${t('orderHint')}</div>
   <div class="ord">${items.map((o,k)=>`<button class="oi" data-k="${k}" ${human?'':'disabled'}><span class="n"></span><span>${esc(T(o.it))}</span></button>`).join('')}</div>
   ${human?`<button class="ghost" id="rs">${t('reset')}</button>`:''}<div id="foot"></div>`);
  let seq=[];
  if(human){const tm=timer(25000,$('#tb'));const btns=[...card.querySelectorAll('.oi')];
    const upd=()=>btns.forEach(b=>{const p=seq.indexOf(+b.dataset.k);b.classList.toggle('set',p>=0);b.querySelector('.n').textContent=p>=0?p+1:''});
    await Promise.race([tm.p,new Promise(res2=>{btns.forEach(b=>b.onclick=()=>{const k=+b.dataset.k;if(seq.includes(k))return;seq.push(k);upd();if(seq.length===items.length)res2()});$('#rs').onclick=()=>{seq=[];upd()}})]);tm.cancel();
    res[0]=seq.length===items.length&&seq.every((k,pos)=>items[k].i===pos)}
  else{const tm=timer(1800,$('#tb'));await tm.p}
  card.querySelectorAll('.oi').forEach(b=>{const k=+b.dataset.k;b.disabled=true;b.querySelector('.n').textContent=items[k].i+1;b.classList.add('set');if(human)b.classList.add(seq.indexOf(k)===items[k].i?'ok':'no')});
  const rs=$('#rs');if(rs)rs.remove();
  $('#foot').innerHTML=resLine(pids,res)+`<div class="hint">${t('tapSkip')}</div>`;
  await waitOrTap(human?3000:2000);return res;
}
async function askEst(q,pids,label,ctxHtml){
  const human=pids.includes(0);const year=q.u==='y';const unit=year?'':q.u;
  const guesses={};
  pids.filter(p=>p!==0).forEach(p=>{const a=accOf(p,q.c);let g=year?Math.round(q.v+gauss()*(12+(1-a)*90)):Math.round(q.v*Math.max(.05,1+gauss()*(.06+(1-a)*.32)));guesses[p]={v:Math.max(0,g),tm:rnd(3,11)}});
  let val='';
  showCard(`<div class="qh">${chip(q.c)}<span class="ctx">${label}${ctxHtml?' · '+ctxHtml:''}</span></div><div class="timer"><i id="tb"></i></div><div class="qt">${esc(T(q.q))}</div><div id="body">
   ${human?`<div class="disp" id="disp">&nbsp;</div><div class="pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-n="${n}">${n}</button>`).join('')}<button data-n="del" aria-label="del">⌫</button><button data-n="0">0</button><button class="go" data-n="go">${t('send')}</button></div><div class="hint">${t('estHint')}</div>`:`<div class="hint">${t('estHint')}</div>`}</div>`);
  if(human){const tm=timer(15000,$('#tb'));const disp=$('#disp');
    const upd=()=>disp.innerHTML=(val?esc(fmtN(+val,year)):'&nbsp;')+(unit?`<span class="u">${esc(unit)}</span>`:'');upd();
    await Promise.race([tm.p,new Promise(res=>card.querySelectorAll('.pad button').forEach(b=>b.onclick=()=>{const n=b.dataset.n;if(n==='go'){if(val)res()}else if(n==='del')val=val.slice(0,-1);else if(val.length<9)val=(val==='0'?'':val)+n;upd()}))]);
    guesses[0]={v:val===''?null:+val,tm:tm.el()};tm.cancel()}
  else{const tm=timer(1700,$('#tb'));await tm.p}
  const rank=pids.slice().sort((a,b)=>{const da=guesses[a].v==null?Infinity:Math.abs(guesses[a].v-q.v),db=guesses[b].v==null?Infinity:Math.abs(guesses[b].v-q.v);return da-db||guesses[a].tm-guesses[b].tm});
  $('#body').innerHTML=`<div class="truth"><div class="lb">${t('answer')}</div><div class="v">${fmtN(q.v,year)}${unit?` <span style="font-size:1rem;color:var(--muted)">${esc(unit)}</span>`:''}</div></div>
   <div class="rows">${rank.map((p,k)=>{const g=guesses[p];return `<div class="row${k===0?' first':''}" style="--c:${G.players[p].color}"><span class="rk">${k+1}</span><span>${esc(pname(p))}</span><span class="g">${g.v==null?t('noAnswer'):fmtN(g.v,year)}</span><span class="df">${g.v==null?'':t('diff')+' '+fmtN(Math.abs(g.v-q.v),year)} · ${g.tm.toFixed(1)}s</span></div>`}).join('')}</div><div class="hint">${t('tapSkip')}</div>`;
  await waitOrTap(human?3400:2400);return rank;
}

