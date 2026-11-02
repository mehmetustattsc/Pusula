/* ===================== map geometry =====================
 * Harita data/maps.js'ten gelir. Kara çokgenleri rasterleştirilir, her kara pikseli en yakın
 * bölge merkezine atanır (hafif dalgalı sınırlar için koordinatlar gürültüyle bükülür).
 * Komşuluklar, bitişik piksellerden + haritanın seaLinks listesinden çıkar.
 */
const MAXDIM=1400;
let MAP=null,W=0,H=0,N=0,K=1,LON0=0,LAT1=0,YS=1;
const px=lon=>(lon-LON0)*K, py=lat=>(LAT1-lat)*YS*K;
let rmap,shade,coast,grid,REGINFO=[],ADJ=[];

function hash(i,j){let h=(i*374761393+j*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295}
function vn(x,y){const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),d=hash(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fill(poly,mask,val){const P=poly.map(p=>[px(p[0]),py(p[1])]);for(let y=0;y<H;y++){const yy=y+.5,xs=[];for(let k=0;k<P.length;k++){const a=P[k],b=P[(k+1)%P.length];if((a[1]<=yy&&b[1]>yy)||(b[1]<=yy&&a[1]>yy))xs.push(a[0]+(yy-a[1])/(b[1]-a[1])*(b[0]-a[0]))}xs.sort((p,q)=>p-q);for(let k=0;k+1<xs.length;k+=2){const x0=Math.max(0,Math.ceil(xs[k]-.5)),x1=Math.min(W-1,Math.floor(xs[k+1]-.5));for(let x=x0;x<=x1;x++)mask[y*W+x]=val}}}

const mapCache={};
function buildMap(id){
  MAP=MAPS[id];const [lon0,lon1,lat0,lat1]=MAP.bounds;YS=MAP.ys;LON0=lon0;LAT1=lat1;
  const wDeg=lon1-lon0,hDeg=(lat1-lat0)*YS;
  if(wDeg>=hDeg){W=MAXDIM;H=Math.round(MAXDIM*hDeg/wDeg)}else{H=MAXDIM;W=Math.round(MAXDIM*wDeg/hDeg)}
  K=W/wDeg;N=W*H;
  if(mapCache[id]){({rmap,shade,coast,grid,REGINFO,ADJ}=mapCache[id]);sizeCanvases();return}
  rmap=new Int16Array(N).fill(-1);shade=new Uint8Array(N);coast=new Uint8Array(N);grid=new Uint8Array(N);
  const land=new Uint8Array(N);MAP.land.forEach(p=>fill(p,land,1));MAP.holes.forEach(p=>fill(p,land,0));
  /* bir bölgenin birden fazla merkezi olabilir (İtalya, Norveç gibi uzun ülkeler): 4. eleman ek noktalar */
  const R=MAP.regions,seeds=R.map(r=>[px(r[1]),py(r[2])]);
  const pts=[];R.forEach((r,i)=>{pts.push([seeds[i][0],seeds[i][1],i]);(r[3]||[]).forEach(p=>pts.push([px(p[0]),py(p[1]),i]))});
  const warp=Math.min(W,H)*.05;
  /* hız için bölge ataması 2x2 piksel bloklarında hesaplanır */
  const W2=(W+1)>>1,blk=new Int16Array(W2*((H+1)>>1)).fill(-2),blkS=new Uint8Array(blk.length);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!land[i])continue;
    const b=(y>>1)*W2+(x>>1);
    if(blk[b]===-2){const X=x&~1,Y=y&~1;
      const wx=X+(vn(X/55,Y/55)*.7+vn(X/18,Y/18)*.3-.5)*warp,wy=Y+(vn(X/55+40,Y/55+17)*.7+vn(X/18+9,Y/18+3)*.3-.5)*warp;
      let best=-1,bd=1e12;for(let s=0;s<pts.length;s++){const dx=wx-pts[s][0],dy=wy-pts[s][1],d=dx*dx+dy*dy;if(d<bd){bd=d;best=pts[s][2]}}
      blk[b]=best;blkS[b]=Math.round(255*(.9+.1*vn(X/7,Y/7)))}
    rmap[i]=blk[b];shade[i]=blkS[b]}
  const cnt=R.map(()=>[0,0,0]);const adjc=R.map(()=>new Array(R.length).fill(0));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,r=rmap[i];
    if(r>=0){cnt[r][0]++;cnt[r][1]+=x;cnt[r][2]+=y;
      if(x<W-1){const q=rmap[i+1];if(q>=0&&q!==r){adjc[r][q]++;adjc[q][r]++}}
      if(y<H-1){const q=rmap[i+W];if(q>=0&&q!==r){adjc[r][q]++;adjc[q][r]++}}}
    else{const nb=(x>0&&rmap[i-1]>=0)||(x<W-1&&rmap[i+1]>=0)||(y>0&&rmap[i-W]>=0)||(y<H-1&&rmap[i+W]>=0);if(nb)coast[i]=1}}
  const g=MAP.grid;
  for(let lo=Math.ceil(lon0/g)*g;lo<=lon1;lo+=g){const c=Math.round(px(lo));if(c>=0&&c<W)for(let y=0;y<H;y++)if((y>>2)%2===0&&rmap[y*W+c]<0)grid[y*W+c]=1}
  for(let la=Math.ceil(lat0/g)*g;la<=lat1;la+=g){const r=Math.round(py(la));if(r>=0&&r<H)for(let x=0;x<W;x++)if((x>>2)%2===0&&rmap[r*W+x]<0)grid[r*W+x]=1}
  REGINFO=cnt.map((c,i)=>{if(!c[0])return{cx:seeds[i][0],cy:seeds[i][1],empty:true};let cx=c[1]/c[0],cy=c[2]/c[0];if(rmap[Math.round(cy)*W+Math.round(cx)]!==i){cx=seeds[i][0];cy=seeds[i][1]}return{cx,cy,px:c[0]}});
  ADJ=adjc.map(row=>row.map((v,j)=>v>=6?j:-1).filter(j=>j>=0));
  (MAP.seaLinks||[]).forEach(([a,b])=>{if(!ADJ[a].includes(b))ADJ[a].push(b);if(!ADJ[b].includes(a))ADJ[b].push(a)});
  mapCache[id]={rmap,shade,coast,grid,REGINFO,ADJ};
  sizeCanvases();
}

/* ===================== rendering ===================== */
const cv=$('#map'),ctx=cv.getContext('2d');
const base=document.createElement('canvas'),bctx=base.getContext('2d');
const hl=document.createElement('canvas'),hctx=hl.getContext('2d');
function sizeCanvases(){[cv,base,hl].forEach(c=>{c.width=W;c.height=H});if(typeof layoutViewport==='function')layoutViewport()}
let hlSet=new Set(),focus=-1,anim=0,flash=null;
function renderBase(){
  const img=bctx.createImageData(W,H),d=img.data;
  const cols=MAP.regions.map((r,i)=>hexRgb(G&&G.regions[i]&&G.regions[i].owner>=0?G.players[G.regions[i].owner].color:'#EBDDBC'));
  const sea=[29,79,128],gr=[36,92,146],co=[86,140,190],bd=[43,23,72];
  for(let i=0,j=0;i<N;i++,j+=4){const r=rmap[i];let c;
    if(r<0){c=coast[i]?co:grid[i]?gr:sea;d[j]=c[0];d[j+1]=c[1];d[j+2]=c[2]}
    else{const x=i%W;const b=(x<W-1&&rmap[i+1]!==r)||(x>0&&rmap[i-1]!==r)||(i+W<N&&rmap[i+W]!==r)||(i>=W&&rmap[i-W]!==r);
      if(b){d[j]=bd[0];d[j+1]=bd[1];d[j+2]=bd[2]}else{c=cols[r];const f=shade[i]/255;d[j]=c[0]*f;d[j+1]=c[1]*f;d[j+2]=c[2]*f}}
    d[j+3]=255}
  bctx.putImageData(img,0,0);
}
/* vurgulama: seçilebilir bölgeler parlar, diğer kara parçaları kararır (dim), hedef bölge sarı */
const dim=document.createElement('canvas'),dctx=dim.getContext('2d');
function renderHL(){
  hctx.clearRect(0,0,W,H);dim.width=W;dim.height=H;if(!hlSet.size&&focus<0)return;
  const img=hctx.createImageData(W,H),d=img.data,im2=dctx.createImageData(W,H),e=im2.data;
  for(let i=0,j=0;i<N;i++,j+=4){const r=rmap[i];if(r<0)continue;
    if(r===focus){d[j]=255;d[j+1]=201;d[j+2]=60;d[j+3]=255}
    else if(hlSet.has(r)){d[j]=d[j+1]=d[j+2]=255;d[j+3]=255}
    else{e[j]=27;e[j+1]=12;e[j+2]=46;e[j+3]=125}}
  hctx.putImageData(img,0,0);dctx.putImageData(im2,0,0);
}
function kick(){if(!anim)anim=requestAnimationFrame(frame)}
function setHL(set,f=-1){hlSet=new Set(set);focus=f;renderHL();kick();paint()}
function clearHL(){hlSet=new Set();focus=-1;renderHL();paint()}
/* bölge el değiştirince kısa bir halka dalgası */
function flashRegion(i,color){if(reduced)return;flash={i,color,t0:performance.now()};kick()}
function frame(now){paint(now);if(hlSet.size||focus>=0||(flash&&now-flash.t0<900))anim=requestAnimationFrame(frame);else{anim=0;flash=null;paint()}}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function drawCastle(x,y,s,col,towers){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#FFF8EC';ctx.strokeStyle='#2B1748';ctx.lineWidth=3;
  ctx.beginPath();const w=s,h=s*.62;ctx.moveTo(-w,h);ctx.lineTo(-w,-h);
  const m=w*2/5;for(let k=0;k<5;k++){const x0=-w+k*m;if(k%2===0){ctx.lineTo(x0,-h-s*.32);ctx.lineTo(x0+m,-h-s*.32);ctx.lineTo(x0+m,-h)}else ctx.lineTo(x0+m,-h)}
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-s*.25,h);ctx.lineTo(-s*.25,0);ctx.arc(0,0,s*.25,Math.PI,0);ctx.lineTo(s*.25,h);ctx.closePath();ctx.fill();
  for(let k=0;k<3;k++){ctx.fillStyle=k<towers?'#FFC93C':'#8C7BA6';ctx.fillRect(-s+k*s*.75+s*.1,h+7,s*.48,s*.3);ctx.strokeRect(-s+k*s*.75+s*.1,h+7,s*.48,s*.3)}
  ctx.restore();
}
function paint(now=performance.now()){
  if(!MAP)return;
  ctx.clearRect(0,0,W,H);ctx.drawImage(base,0,0);
  if(hlSet.size||focus>=0){ctx.drawImage(dim,0,0);ctx.globalAlpha=reduced?.35:.18+.27*(Math.sin(now/240)+1)/2;ctx.drawImage(hl,0,0);ctx.globalAlpha=1}
  if(!G)return;
  if(flash){const p=(now-flash.t0)/900;if(p<1){const {cx,cy}=REGINFO[flash.i];ctx.beginPath();ctx.arc(cx,cy,30+p*110,0,Math.PI*2);ctx.strokeStyle=flash.color;ctx.globalAlpha=1-p;ctx.lineWidth=8*(1-p)+2;ctx.stroke();ctx.globalAlpha=1}}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  G.regions.forEach((r,i)=>{const {cx,cy}=REGINFO[i];
    ctx.font='800 28px "Nunito",system-ui,sans-serif';ctx.lineWidth=7;ctx.strokeStyle='rgba(43,23,72,.9)';ctx.fillStyle='#fff';
    const nm=T(r.name);ctx.strokeText(nm,cx,cy-16);ctx.fillText(nm,cx,cy-16);
    const k=CAT[r.cat];
    if(r.castle){drawCastle(cx+20,cy+20,17,r.owner>=0?G.players[r.owner].color:'#EBDDBC',r.towers);drawBadge(cx-20,cy+20,k)}
    else{drawBadge(cx-24,cy+18,k);ctx.font='800 24px "Baloo 2","Nunito",system-ui,sans-serif';ctx.lineWidth=6;ctx.strokeStyle='rgba(43,23,72,.9)';ctx.fillStyle='#fff';ctx.textAlign='left';ctx.strokeText(r.value,cx-6,cy+19);ctx.fillText(r.value,cx-6,cy+19);ctx.textAlign='center'}
  });
}
function drawBadge(x,y,k){ctx.beginPath();ctx.arc(x,y,16,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=k.c;ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='rgba(43,23,72,.9)';ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.stroke();ctx.fillStyle=k.c;ctx.font='900 14px "Nunito",system-ui,sans-serif';ctx.fillText(T(k.ab),x,y+1)}
function redrawAll(){renderBase();paint();renderPlayers()}
