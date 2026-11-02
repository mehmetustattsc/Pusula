/* ===================== map viewer =====================
 * Harita bir çerçevenin içinde durur; sayfa kaymaz. Parmakla sürükleyip kaydırırsın,
 * iki parmakla yakınlaştırırsın; bilgisayarda fare tekerleği. +/− ve "tümü" düğmeleri de var.
 * Sıra sana gelince harita ilgili bölgelere kendiliğinden odaklanır (focusOn).
 * Dokunma ile sürükleme ayrılır: 8 pikselden az hareket eden tek dokunuş, bölge seçimi sayılır.
 */
const vp=$('#viewport');
let V={z:1,cx:0,cy:0},fitS=1,vw=0,vh=0,viewAnim=0;
const ZMIN=1,ZMAX=5;

function layoutViewport(){
  vw=vp.clientWidth||360;
  const ideal=vw*H/W,maxH=Math.max(260,innerHeight*.56);
  vh=Math.round(Math.min(ideal,maxH));vp.style.height=vh+'px';
  fitS=Math.min(vw/W,vh/H);
  cv.style.width=W+'px';cv.style.height=H+'px';
  applyView();
}
function viewScale(){return fitS*V.z}
function clampView(){
  V.z=Math.max(ZMIN,Math.min(ZMAX,V.z));const s=viewScale(),hw=vw/2/s,hh=vh/2/s;
  V.cx=W*s<=vw?W/2:Math.min(W-hw,Math.max(hw,V.cx));
  V.cy=H*s<=vh?H/2:Math.min(H-hh,Math.max(hh,V.cy));
}
function applyView(){
  clampView();const s=viewScale();
  cv.style.transform=`translate(${vw/2-V.cx*s}px,${vh/2-V.cy*s}px) scale(${s})`;
  const zi=$('#zin'),zo=$('#zout'),zf=$('#zfit');
  if(zi){zi.disabled=V.z>=ZMAX-.01;zo.disabled=V.z<=ZMIN+.01;zf.disabled=V.z<=ZMIN+.01}
}
function toMap(clientX,clientY){const b=vp.getBoundingClientRect(),s=viewScale();return[(clientX-b.left-(vw/2-V.cx*s))/s,(clientY-b.top-(vh/2-V.cy*s))/s]}
function resetView(){V={z:1,cx:W/2,cy:H/2};applyView()}

/* yumuşak geçişle hedef görünüme git */
function animateView(to,ms=380){
  cancelAnimationFrame(viewAnim);const from={...V},t0=performance.now();
  if(reduced||AUTO){V={...V,...to};applyView();return}
  const step=n=>{const p=Math.min(1,(n-t0)/ms),e=1-Math.pow(1-p,3);
    V.z=from.z+(to.z-from.z)*e;V.cx=from.cx+(to.cx-from.cx)*e;V.cy=from.cy+(to.cy-from.cy)*e;applyView();
    if(p<1)viewAnim=requestAnimationFrame(step)};
  viewAnim=requestAnimationFrame(step);
}
/* verilen bölgelerin hepsi görünecek şekilde yakınlaş (en fazla 2.6x) */
function focusOn(list,maxZ=2.6){
  if(!list.length||!vw)return;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  list.forEach(i=>{const g=REGINFO[i];x0=Math.min(x0,g.cx);x1=Math.max(x1,g.cx);y0=Math.min(y0,g.cy);y1=Math.max(y1,g.cy)});
  const pad=160,bw=x1-x0+pad*2,bh=y1-y0+pad*2;
  const z=Math.max(ZMIN,Math.min(maxZ,Math.min(vw/(bw*fitS),vh/(bh*fitS))));
  animateView({z,cx:(x0+x1)/2,cy:(y0+y1)/2});
}
function zoomBy(f,cx=vw/2,cy=vh/2){
  const b=vp.getBoundingClientRect(),[mx,my]=toMap(b.left+cx,b.top+cy);
  V.z=Math.max(ZMIN,Math.min(ZMAX,V.z*f));const s=viewScale();
  V.cx=mx-(cx-vw/2)/s;V.cy=my-(cy-vh/2)/s;applyView();
}

/* ---- dokunma / fare ---- */
const ptrs=new Map();let gest=null;
vp.addEventListener('pointerdown',e=>{
  vp.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});cancelAnimationFrame(viewAnim);
  if(ptrs.size===1)gest={mode:'tap',x:e.clientX,y:e.clientY,cx:V.cx,cy:V.cy};
  else if(ptrs.size===2){const [a,b]=[...ptrs.values()],r=vp.getBoundingClientRect();
    gest={mode:'pinch',d0:Math.hypot(a.x-b.x,a.y-b.y)||1,z0:V.z,mid:toMap((a.x+b.x)/2,(a.y+b.y)/2)};void r}
});
vp.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId)||!gest)return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(gest.mode!=='pinch'&&ptrs.size===1){
    const dx=e.clientX-gest.x,dy=e.clientY-gest.y;
    if(gest.mode==='tap'&&Math.hypot(dx,dy)>8)gest.mode='drag';
    if(gest.mode==='drag'){const s=viewScale();V.cx=gest.cx-dx/s;V.cy=gest.cy-dy/s;applyView()}
  }else if(gest.mode==='pinch'&&ptrs.size>=2){
    const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),r=vp.getBoundingClientRect();
    V.z=Math.max(ZMIN,Math.min(ZMAX,gest.z0*d/gest.d0));const s=viewScale();
    const mx=(a.x+b.x)/2-r.left,my=(a.y+b.y)/2-r.top;
    V.cx=gest.mid[0]-(mx-vw/2)/s;V.cy=gest.mid[1]-(my-vh/2)/s;applyView();
  }
});
function endPtr(e){
  if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);
  if(gest&&gest.mode==='tap'&&ptrs.size===0&&e.type==='pointerup')mapTap(e.clientX,e.clientY);
  if(ptrs.size===0)gest=null;else if(gest&&gest.mode==='pinch'&&ptrs.size===1){const [p]=[...ptrs.values()];gest={mode:'drag',x:p.x,y:p.y,cx:V.cx,cy:V.cy}}
}
vp.addEventListener('pointerup',endPtr);vp.addEventListener('pointercancel',endPtr);
vp.addEventListener('wheel',e=>{e.preventDefault();const r=vp.getBoundingClientRect();zoomBy(Math.exp(-e.deltaY*.0018),e.clientX-r.left,e.clientY-r.top)},{passive:false});
vp.addEventListener('dblclick',e=>{const r=vp.getBoundingClientRect();zoomBy(1.8,e.clientX-r.left,e.clientY-r.top)});
$('#zin').onclick=()=>{sfx('tap');zoomBy(1.5)};
$('#zout').onclick=()=>{sfx('tap');zoomBy(1/1.5)};
$('#zfit').onclick=()=>{sfx('tap');animateView({z:1,cx:W/2,cy:H/2})};
addEventListener('resize',()=>{if(MAP)layoutViewport()});

/* bölge seçimi: dokunulan nokta seçilebilir bir bölgeye düşüyorsa (ya da çok yakınsa) */
let tapWaiter=null;
function mapTap(cx,cy){
  if(!tapWaiter)return;const [mx,my]=toMap(cx,cy),x=Math.floor(mx),y=Math.floor(my);
  let r=x>=0&&y>=0&&x<W&&y<H?rmap[y*W+x]:-1;
  if(r<0||!tapWaiter.set.has(r)){let bd=1e9,best=-1;tapWaiter.set.forEach(i=>{const g=REGINFO[i],d=Math.hypot(g.cx-mx,g.cy-my);if(d<bd){bd=d;best=i}});r=bd<70/Math.min(1,viewScale()*2)?best:-1}
  if(r>=0&&tapWaiter.set.has(r)){const w=tapWaiter;tapWaiter=null;w.res(r)}
}
const waitRegionTap=set=>new Promise(res=>{if(AUTO){const a=[...set];setTimeout(()=>res(a[Math.floor(Math.random()*a.length)]),5);return}tapWaiter={set:new Set(set),res}});
