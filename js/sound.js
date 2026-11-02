/* ===================== sounds =====================
 * Dosya gerektirmeyen kısa sesler (Web Audio). Ses, ilk dokunuştan sonra çalabilir.
 */
let muted=false;try{muted=localStorage.getItem('pusula.mute')==='1'}catch(e){}
let actx=null;
function tone(f,dur,type='sine',vol=.12,delay=0){
  if(muted||AUTO)return;
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    const t0=actx.currentTime+delay,o=actx.createOscillator(),g=actx.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t0);g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+.01);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
    o.connect(g).connect(actx.destination);o.start(t0);o.stop(t0+dur+.02)}catch(e){}
}
const SFX={
  ok:()=>{tone(660,.12,'triangle');tone(990,.18,'triangle',.12,.1)},
  no:()=>{tone(180,.25,'sawtooth',.06)},
  tap:()=>tone(520,.05,'triangle',.06),
  take:()=>{tone(440,.1,'square',.05);tone(587,.1,'square',.05,.09);tone(784,.2,'square',.05,.18)},
  lose:()=>{tone(392,.15,'triangle',.08);tone(294,.25,'triangle',.08,.14)},
  win:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,.22,'triangle',.1,i*.12))},
  tick:()=>tone(1200,.03,'square',.03)
};
function sfx(k){SFX[k]&&SFX[k]()}
function toggleMute(){muted=!muted;try{localStorage.setItem('pusula.mute',muted?'1':'0')}catch(e){}renderMute()}
