/* ===================== UI chrome ===================== */
function renderLangs(){$('#langs').innerHTML=LANGS.map(l=>`<button data-l="${l}" aria-pressed="${l===lang}">${l.toUpperCase()}</button>`).join('')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-l]');if(!b)return;lang=b.dataset.l;try{localStorage.setItem('pusula.lang',lang)}catch(_){}document.documentElement.lang=lang;refreshLang()});
function refreshLang(){renderLangs();renderMute();$('#sub').textContent=t('sub');renderPlayers();renderLegend();renderStatus();renderPhase();renderZoom();paint();if(ovRerender)ovRerender()}
function renderMute(){const b=$('#mute');b.setAttribute('aria-pressed',String(!muted));b.textContent=muted?t('soundOff'):t('soundOn')}
$('#mute').onclick=()=>{toggleMute();sfx('tap')};
function renderPlayers(){
  if(!G){$('#players').innerHTML='';return}
  $('#players').innerHTML=G.players.map((p,i)=>{
    const c=G.regions[p.castle];const pips=[0,1,2].map(k=>`<i class="${c.owner===i&&k<c.towers?'':'down'}"></i>`).join('');
    const meta=p.human?`${t('castle')} <span class="pips">${pips}</span>`:`${t('strong')}: <b>${T(CAT[p.s].n)}</b><br>${t('weak')}: <b>${T(CAT[p.w].n)}</b>`;
    return `<div class="pc${G.active===i?' active':''}${p.alive?'':' out'}" style="--c:${p.color}"><div class="nm"><span>${esc(pname(i))}</span>${p.human?'':`<span class="pips">${pips}</span>`}</div><div class="sc">${fmtN(score(i))}<small>${t('score')}</small></div><div class="meta">${p.alive?meta:t('out')}</div></div>`}).join('');
}
function renderLegend(){const used=G?[...new Set(G.regions.map(r=>r.cat))]:CATS;const cats=[...CATS,...EVENT_CATS].filter(c=>used.includes(c));$('#legend').innerHTML=`<div class="lt">${t('legend')}</div>`+cats.map(c=>`<span class="lg"><span class="badge" style="--k:${CAT[c].c}">${T(CAT[c].ab)}</span>${T(CAT[c].n)}</span>`).join('')}
function renderPhase(){$('#phase').textContent=!G||G.round===0?'—':G.phase==='expand'?`${t('expand')} · ${t('round')} ${G.round}`:G.phase==='war'?`${t('war')} · ${t('round')} ${G.round}/${MODE().war}`:t('final')}
let statusFn=()=>['',''];
function setStatus(fn){statusFn=fn;renderStatus()}
function renderStatus(){const [m,s]=statusFn();$('#sm').textContent=m;$('#ss').textContent=s||''}
let toastT;function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),2800)}
const ms=$('#mapscroll');let zoomed=innerWidth<720;
function renderZoom(){ms.classList.toggle('zoom',zoomed);$('#zoomb').textContent=zoomed?t('zoomOut'):t('zoomIn');$('#zoomb').hidden=innerWidth>=720&&!zoomed}
$('#zoomb').onclick=()=>{zoomed=!zoomed;renderZoom()};
function scrollToRegions(list){if(!list.length)return;const x=list.reduce((s,i)=>s+REGINFO[i].cx,0)/list.length,y=list.reduce((s,i)=>s+REGINFO[i].cy,0)/list.length;
  if(ms.scrollWidth>ms.clientWidth)ms.scrollTo({left:x/W*ms.scrollWidth-ms.clientWidth/2,behavior:reduced?'auto':'smooth'});
  /* uzun haritalarda (Almanya) bölge ekranın dışındaysa sayfayı oraya kaydır */
  const b=cv.getBoundingClientRect(),sy=b.top+y/H*b.height;if(sy<60||sy>innerHeight-120)scrollTo({top:scrollY+sy-innerHeight*.4,behavior:reduced?'auto':'smooth'})}

/* region taps */
let tapWaiter=null;
cv.addEventListener('click',e=>{if(!tapWaiter)return;const b=cv.getBoundingClientRect();const x=Math.floor((e.clientX-b.left)/b.width*W),y=Math.floor((e.clientY-b.top)/b.height*H);let r=rmap[y*W+x];
  if(r<0){let bd=1e9;REGINFO.forEach((g,i)=>{const d=Math.hypot(g.cx-x,g.cy-y);if(d<bd&&tapWaiter.set.has(i)){bd=d;r=d<60?i:r}})}
  if(r>=0&&tapWaiter.set.has(r)){const w=tapWaiter;tapWaiter=null;w.res(r)}});
const waitRegionTap=set=>new Promise(res=>{if(AUTO){const a=[...set];setTimeout(()=>res(a[Math.floor(Math.random()*a.length)]),5);return}tapWaiter={set:new Set(set),res}});

/* overlay */
const ov=$('#ov'),card=$('#card');let ovRerender=null;
function showCard(html){card.innerHTML=html;ov.hidden=false}
function hideCard(){ov.hidden=true;card.innerHTML='';ovRerender=null}
function waitOrTap(ms){return new Promise(res=>{let done=false;const h=()=>fin();const fin=()=>{if(done)return;done=true;clearTimeout(tm);ov.removeEventListener('click',h);res()};const tm=setTimeout(fin,ms*SPEED);setTimeout(()=>{if(!done)ov.addEventListener('click',h)},300)})}
function timer(ms,bar){let stop=false,t0=performance.now();const p=new Promise(res=>{function tick(n){if(stop)return;const f=Math.min(1,(n-t0)/ms);if(bar)bar.style.transform=`scaleX(${1-f})`;if(f>=1)return res('timeout');requestAnimationFrame(tick)}requestAnimationFrame(tick)});return{p,cancel(){stop=true},el(){return(performance.now()-t0)/1000}}}
const chip=c=>`<span class="chip" style="--k:${CAT[c].c}">${T(CAT[c].n)}</span>`;
const dot=pid=>`<i style="--c:${G.players[pid].color}" title="${esc(pname(pid))}"></i>`;
function resLine(pids,res){return `<div class="res">${pids.map(p=>`<span><i class="d" style="--c:${G.players[p].color}"></i>${esc(pname(p))} <b class="${res[p]?'y':'n'}">${res[p]?t('correct'):t('wrong')}</b></span>`).join('')}</div>`}

