/* ===================== map geometry ===================== */
const W=1400,LON0=25.7,LON1=45.0,LAT0=35.6,LAT1=42.3,K=W/(LON1-LON0),H=Math.round((LAT1-LAT0)*1.3*K),N=W*H;
const px=lon=>(lon-LON0)*K, py=lat=>(LAT1-lat)*1.3*K;
const OUTER=[[26.05,40.73],[26.35,41.25],[26.33,41.7],[26.6,41.95],[27.5,42.02],[28.0,41.65],[29.1,41.25],[30.3,41.2],[31.3,41.3],[32.3,41.75],[33.3,42.0],[34.8,41.98],[35.2,42.05],[35.6,41.62],[36.3,41.3],[37.0,41.15],[38.3,40.95],[39.7,41.02],[40.6,41.15],[41.5,41.5],[42.5,41.45],[43.4,41.15],[43.6,40.75],[43.7,40.3],[44.4,40.0],[44.8,39.65],[44.4,39.4],[44.3,38.8],[44.25,38.3],[44.4,37.85],[44.7,37.3],[44.25,37.1],[43.3,37.3],[42.4,37.15],[41.2,37.1],[40.0,36.85],[38.8,36.75],[37.8,36.65],[36.7,36.82],[36.45,36.2],[35.95,35.85],[35.8,36.25],[36.15,36.55],[35.6,36.6],[34.7,36.8],[34.0,36.3],[33.4,36.15],[32.6,36.05],[32.0,36.5],[31.2,36.8],[30.6,36.85],[30.45,36.4],[30.2,36.25],[29.6,36.15],[29.1,36.65],[28.2,36.7],[27.6,36.75],[27.3,37.0],[27.25,37.4],[27.0,37.9],[26.3,38.3],[26.6,38.45],[26.9,38.6],[26.75,39.0],[26.7,39.3],[27.0,39.55],[26.6,39.6],[26.1,39.5],[26.15,39.95],[26.2,40.1],[26.15,40.35],[26.3,40.55]];
const HOLE=[[26.75,40.42],[27.3,40.35],[28.0,40.38],[28.9,40.38],[29.4,40.72],[29.0,40.97],[28.5,40.98],[27.6,40.95],[27.0,40.7],[26.7,40.5]];
const REG=[['Edirne',26.75,41.55],['İstanbul',28.9,41.12],['Bursa',29.1,40.05],['Eskişehir',30.6,39.7],['İzmir',27.55,38.45],['Denizli',29.15,37.75],['Antalya',30.8,37.05],['Konya',32.6,37.85],['Ankara',32.9,39.85],['Kastamonu',33.7,41.3],['Samsun',36.0,40.95],['Kayseri',35.6,38.75],['Adana',35.3,37.1],['Sivas',37.1,39.75],['Trabzon',39.6,40.75],['Erzurum',41.3,39.95],['Diyarbakır',40.2,37.95],['Gaziantep',37.5,37.15],['Van',43.4,38.55]];
const CASTLES=[[4,10,16],[0,7,15],[6,9,18],[2,12,14],[1,11,16]];

function hash(i,j){let h=(i*374761393+j*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295}
function vn(x,y){const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),d=hash(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fill(poly,mask,val){const P=poly.map(p=>[px(p[0]),py(p[1])]);for(let y=0;y<H;y++){const yy=y+.5,xs=[];for(let k=0;k<P.length;k++){const a=P[k],b=P[(k+1)%P.length];if((a[1]<=yy&&b[1]>yy)||(b[1]<=yy&&a[1]>yy))xs.push(a[0]+(yy-a[1])/(b[1]-a[1])*(b[0]-a[0]))}xs.sort((p,q)=>p-q);for(let k=0;k+1<xs.length;k+=2){const x0=Math.max(0,Math.ceil(xs[k]-.5)),x1=Math.min(W-1,Math.floor(xs[k+1]-.5));for(let x=x0;x<=x1;x++)mask[y*W+x]=val}}}
const rmap=new Int16Array(N).fill(-1),shade=new Uint8Array(N),coast=new Uint8Array(N),grid=new Uint8Array(N);
let REGINFO=[],ADJ=[];
function buildMap(){
  const land=new Uint8Array(N);fill(OUTER,land,1);fill(HOLE,land,0);
  const seeds=REG.map(r=>[px(r[1]),py(r[2])]);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!land[i])continue;
    const wx=x+(vn(x/55,y/55)*.7+vn(x/18,y/18)*.3-.5)*70,wy=y+(vn(x/55+40,y/55+17)*.7+vn(x/18+9,y/18+3)*.3-.5)*70;
    let best=-1,bd=1e12;for(let s=0;s<seeds.length;s++){const dx=wx-seeds[s][0],dy=wy-seeds[s][1],d=dx*dx+dy*dy;if(d<bd){bd=d;best=s}}
    rmap[i]=best;shade[i]=Math.round(255*(.9+.1*vn(x/7,y/7)))}
  const cnt=REG.map(()=>[0,0,0]);const adjc=REG.map(()=>new Array(REG.length).fill(0));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,r=rmap[i];
    if(r>=0){cnt[r][0]++;cnt[r][1]+=x;cnt[r][2]+=y;
      if(x<W-1){const q=rmap[i+1];if(q>=0&&q!==r){adjc[r][q]++;adjc[q][r]++}}
      if(y<H-1){const q=rmap[i+W];if(q>=0&&q!==r){adjc[r][q]++;adjc[q][r]++}}}
    else{const nb=(x>0&&rmap[i-1]>=0)||(x<W-1&&rmap[i+1]>=0)||(y>0&&rmap[i-W]>=0)||(y<H-1&&rmap[i+W]>=0);if(nb)coast[i]=1}}
  for(let lo=26;lo<=45;lo++){const c=Math.round(px(lo));if(c>=0&&c<W)for(let y=0;y<H;y++)if((y>>2)%2===0)grid[y*W+c]=1}
  for(let la=36;la<=42;la++){const r=Math.round(py(la));if(r>=0&&r<H)for(let x=0;x<W;x++)if((x>>2)%2===0)grid[r*W+x]=1}
  REGINFO=cnt.map((c,i)=>{let cx=c[1]/c[0],cy=c[2]/c[0];if(rmap[Math.round(cy)*W+Math.round(cx)]!==i){cx=seeds[i][0];cy=seeds[i][1]}return{cx,cy}});
  ADJ=adjc.map(row=>row.map((v,j)=>v>=6?j:-1).filter(j=>j>=0));
}

/* ===================== rendering ===================== */
const cv=$('#map'),ctx=cv.getContext('2d');cv.width=W;cv.height=H;
const base=document.createElement('canvas');base.width=W;base.height=H;const bctx=base.getContext('2d');
const hl=document.createElement('canvas');hl.width=W;hl.height=H;const hctx=hl.getContext('2d');
let hlSet=new Set(),focus=-1,anim=0;
function renderBase(){
  const img=bctx.createImageData(W,H),d=img.data;
  const cols=REG.map((r,i)=>hexRgb(G&&G.regions[i].owner>=0?G.players[G.regions[i].owner].color:'#3B4458'));
  const sea=[14,22,38],gr=[24,35,58],co=[36,54,90],bd=[7,11,19];
  for(let i=0,j=0;i<N;i++,j+=4){const r=rmap[i];let c;
    if(r<0){c=coast[i]?co:grid[i]?gr:sea;d[j]=c[0];d[j+1]=c[1];d[j+2]=c[2]}
    else{const x=i%W;const b=(x<W-1&&rmap[i+1]!==r)||(x>0&&rmap[i-1]!==r)||(i+W<N&&rmap[i+W]!==r)||(i>=W&&rmap[i-W]!==r);
      if(b){d[j]=bd[0];d[j+1]=bd[1];d[j+2]=bd[2]}else{c=cols[r];const f=shade[i]/255;d[j]=c[0]*f;d[j+1]=c[1]*f;d[j+2]=c[2]*f}}
    d[j+3]=255}
  bctx.putImageData(img,0,0);
}
function renderHL(){
  hctx.clearRect(0,0,W,H);if(!hlSet.size&&focus<0)return;
  const img=hctx.createImageData(W,H),d=img.data;
  for(let i=0,j=0;i<N;i++,j+=4){const r=rmap[i];if(r<0)continue;if(r===focus){d[j]=255;d[j+1]=210;d[j+2]=90;d[j+3]=255}else if(hlSet.has(r)){d[j]=d[j+1]=d[j+2]=255;d[j+3]=255}}
  hctx.putImageData(img,0,0);
}
function setHL(set,f=-1){hlSet=new Set(set);focus=f;renderHL();if(!anim)anim=requestAnimationFrame(frame);paint()}
function clearHL(){hlSet=new Set();focus=-1;renderHL();paint()}
function frame(now){paint(now);if(hlSet.size||focus>=0)anim=requestAnimationFrame(frame);else anim=0}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function drawCastle(x,y,s,col,towers){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#F3EEDF';ctx.strokeStyle='#070B13';ctx.lineWidth=3;
  ctx.beginPath();const w=s,h=s*.62;ctx.moveTo(-w,h);ctx.lineTo(-w,-h);
  const m=w*2/5;for(let k=0;k<5;k++){const x0=-w+k*m;if(k%2===0){ctx.lineTo(x0,-h-s*.32);ctx.lineTo(x0+m,-h-s*.32);ctx.lineTo(x0+m,-h)}else ctx.lineTo(x0+m,-h)}
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-s*.25,h);ctx.lineTo(-s*.25,0);ctx.arc(0,0,s*.25,Math.PI,0);ctx.lineTo(s*.25,h);ctx.closePath();ctx.fill();
  for(let k=0;k<3;k++){ctx.fillStyle=k<towers?'#F2C14E':'#2a3248';ctx.fillRect(-s+k*s*.75+s*.1,h+7,s*.48,s*.3);ctx.strokeRect(-s+k*s*.75+s*.1,h+7,s*.48,s*.3)}
  ctx.restore();
}
function paint(now=performance.now()){
  ctx.clearRect(0,0,W,H);ctx.drawImage(base,0,0);
  if(hlSet.size||focus>=0){ctx.globalAlpha=reduced?.3:.16+.2*(Math.sin(now/260)+1)/2;ctx.drawImage(hl,0,0);ctx.globalAlpha=1}
  if(!G)return;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  G.regions.forEach((r,i)=>{const {cx,cy}=REGINFO[i];
    ctx.font='600 27px "IBM Plex Sans",system-ui,sans-serif';ctx.lineWidth=6;ctx.strokeStyle='rgba(7,11,19,.85)';ctx.fillStyle='#fff';
    ctx.strokeText(r.name,cx,cy-16);ctx.fillText(r.name,cx,cy-16);
    const k=CAT[r.cat];
    if(r.castle){drawCastle(cx+20,cy+20,17,r.owner>=0?G.players[r.owner].color:'#3B4458',r.towers);drawBadge(cx-20,cy+20,k)}
    else{drawBadge(cx-24,cy+18,k);ctx.font='600 22px "IBM Plex Mono",ui-monospace,monospace';ctx.lineWidth=5;ctx.strokeStyle='rgba(7,11,19,.85)';ctx.fillStyle='#fff';ctx.textAlign='left';ctx.strokeText(r.value,cx-6,cy+19);ctx.fillText(r.value,cx-6,cy+19);ctx.textAlign='center'}
  });
}
function drawBadge(x,y,k){ctx.beginPath();ctx.arc(x,y,15,0,Math.PI*2);ctx.fillStyle='#0B111D';ctx.fill();ctx.lineWidth=3.5;ctx.strokeStyle=k.c;ctx.stroke();ctx.fillStyle=k.c;ctx.font='700 14px "IBM Plex Sans",system-ui,sans-serif';ctx.fillText(T(k.ab),x,y+1)}
function redrawAll(){renderBase();paint();renderPlayers()}

