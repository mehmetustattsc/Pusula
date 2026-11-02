/* ===================== UI chrome ===================== */
function renderLangs(){$('#langs').innerHTML=LANGS.map(l=>`<button data-l="${l}" aria-pressed="${l===lang}">${l.toUpperCase()}</button>`).join('')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-l]');if(!b)return;lang=b.dataset.l;try{localStorage.setItem('pusula.lang',lang)}catch(_){}document.documentElement.lang=lang;refreshLang()});
function refreshLang(){renderLangs();renderMute();renderPlayers();renderLegend();renderStatus();renderPhase();paint();if(ovRerender)ovRerender()}
function renderMute(){const b=$('#mute');b.setAttribute('aria-pressed',String(!muted));b.setAttribute('aria-label',muted?t('soundOff'):t('soundOn'));b.innerHTML=muted?ICON.off:ICON.on}
$('#mute').onclick=()=>{toggleMute();sfx('tap')};

const ICON={
  on:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  off:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
};
/* oyuncu avatarı: renkli daire içinde baş harf */
const avatar=(pid,size='')=>{const p=G.players[pid];return `<span class="av ${size}" style="--c:${p.color}">${esc((pid===0?t('you'):p.name).charAt(0))}</span>`};
const botAv=b=>`<span class="av" style="--c:${b.color}">${esc(b.name.charAt(0))}</span>`;

function renderPlayers(){
  if(!G){$('#players').innerHTML='';return}
  $('#players').innerHTML=G.players.map((p,i)=>{
    const c=G.regions[p.castle];const pips=[0,1,2].map(k=>`<i class="${c.owner===i&&k<c.towers?'':'down'}"></i>`).join('');
    const meta=p.human?`<span class="pips" title="${t('castle')}">${pips}</span>`
      :`<span class="sw"><b class="up" style="--k:${CAT[p.s].c}">${T(CAT[p.s].ab)}</b><b class="dn" style="--k:${CAT[p.w].c}">${T(CAT[p.w].ab)}</b></span><span class="pips">${pips}</span>`;
    return `<div class="pc${G.active===i?' active':''}${p.alive?'':' out'}" style="--c:${p.color}">
      <div class="nm">${avatar(i)}<span class="nmt">${esc(pname(i))}</span></div>
      <div class="sc">${fmtN(score(i))}</div>
      <div class="meta">${p.alive?meta:t('out')}</div></div>`}).join('');
}
function renderLegend(){const used=G?[...new Set(G.regions.map(r=>r.cat))]:CATS;const cats=[...CATS,...EVENT_CATS].filter(c=>used.includes(c));
  $('#legend').innerHTML=cats.map(c=>`<span class="lg"><span class="badge" style="--k:${CAT[c].c}">${T(CAT[c].ab)}</span>${T(CAT[c].n)}</span>`).join('')}
function renderPhase(){$('#phase').textContent=!G||G.round===0?T(MAP?MAP.name:''):G.phase==='expand'?`${t('expand')} · ${t('round')} ${G.round}`:G.phase==='war'?`${t('war')} · ${t('round')} ${G.round}/${MODE().war}`:t('final')}
let statusFn=()=>['',''];
function setStatus(fn){statusFn=fn;renderStatus()}
function renderStatus(){const [m,s]=statusFn();$('#sm').textContent=m;$('#ss').textContent=s||''}
let toastT;function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),2800)}

/* ekranın ortasında beliren geçici duyuru: sıra kimde, ne oluyor */
async function banner(main,sub='',color='',ms=1150,you=false){
  const b=$('#banner');b.innerHTML=`<div class="bn${you?' you':''}" style="${color?`--c:${color}`:''}"><div class="bm">${esc(main)}</div>${sub?`<div class="bs">${esc(sub)}</div>`:''}</div>`;
  b.hidden=false;b.classList.remove('go');void b.offsetWidth;b.classList.add('go');
  if(you)sfx('turn');
  await sleep(ms);b.hidden=true;
}

/* overlay */
const ov=$('#ov'),card=$('#card');let ovRerender=null;
function showCard(html){card.innerHTML=html;ov.hidden=false}
function hideCard(){ov.hidden=true;card.innerHTML='';ovRerender=null}
function waitOrTap(ms){return new Promise(res=>{let done=false;const h=()=>fin();const fin=()=>{if(done)return;done=true;clearTimeout(tm);ov.removeEventListener('click',h);res()};const tm=setTimeout(fin,ms*SPEED);setTimeout(()=>{if(!done)ov.addEventListener('click',h)},300)})}
function timer(ms,bar){let stop=false,t0=performance.now();const p=new Promise(res=>{function tick(n){if(stop)return;const f=Math.min(1,(n-t0)/ms);if(bar)bar.style.transform=`scaleX(${1-f})`;if(f>=1)return res('timeout');requestAnimationFrame(tick)}requestAnimationFrame(tick)});return{p,cancel(){stop=true},el(){return(performance.now()-t0)/1000}}}
const chip=c=>`<span class="chip" style="--k:${CAT[c].c}">${T(CAT[c].n)}</span>`;
const dot=pid=>`<i style="--c:${G.players[pid].color}" title="${esc(pname(pid))}"></i>`;
function resLine(pids,res){return `<div class="res">${pids.map(p=>`<span>${avatar(p,'sm')}${esc(pname(p))} <b class="${res[p]?'y':'n'}">${res[p]?t('correct'):t('wrong')}</b></span>`).join('')}</div>`}
/* düello başlığı: iki avatar ve hedef bölge */
function duelHead(a,d,ri){const R=G.regions[ri];return `<span class="vs">${avatar(a,'sm')}<span class="ar">→</span>${avatar(d,'sm')}</span><span class="tg">${esc(T(R.name))}${R.castle?' · '+t('castle'):''}</span>`}
