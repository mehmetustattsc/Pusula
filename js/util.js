/* ===================== helpers ===================== */
const $=s=>document.querySelector(s);
/* Otomatik test modu: adres #auto ile biterse oyun kendi kendine, çok hızlı oynar (geliştirme için) */
const AUTO=location.hash==='#auto';
const SPEED=AUTO?.01:1;
const sleep=ms=>new Promise(r=>setTimeout(r,ms*SPEED));
const rnd=(a,b)=>a+Math.random()*(b-a);
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function gauss(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LOC={tr:'tr-TR',de:'de-DE',en:'en-US'};
const fmtN=(n,year)=>n==null?'—':new Intl.NumberFormat(LOC[lang],{useGrouping:!year}).format(n);
const hexRgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];

