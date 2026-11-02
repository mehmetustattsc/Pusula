/* ===================== uygulama: kurulum, paylaşma, çevrimdışı =====================
 * - Service worker sadece gerçek bir web adresinde (GitHub Pages gibi) kaydedilir;
 *   dosyadan açılınca ya da Claude önizlemesinde kaydedilmez.
 * - Android/Chrome "yükle" isteğini yakalayıp başlangıç ekranında "Ana ekrana ekle" düğmesi gösterir;
 *   iPhone'da Safari'nin Paylaş → Ana Ekrana Ekle yolunu tarif eder.
 * - "Paylaş" telefonun paylaşım menüsünü açar; yoksa bağlantıyı panoya kopyalar.
 */
const APP_URL='https://mehmetustattsc.github.io/Pusula/';
const onWeb=/^https?:$/.test(location.protocol)&&!/(^|\.)claude\.ai$|claudeusercontent|anthropic/.test(location.hostname)&&!/^(localhost|127\.)/.test(location.hostname);
const shareUrl=()=>onWeb?location.origin+location.pathname:APP_URL;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent);
let installEvt=null;
if(onWeb&&'serviceWorker' in navigator){addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})})}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;if(ovRerender)ovRerender()});
addEventListener('appinstalled',()=>{installEvt=null;toast(t('installed'));if(ovRerender)ovRerender()});

async function shareApp(){
  const data={title:'Pusula',text:t('shareText'),url:shareUrl()};
  try{if(navigator.share){await navigator.share(data);return}}catch(e){if(e&&e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(data.url);toast(t('linkCopied'))}catch(e){toast(data.url)}
}
async function installApp(){
  if(installEvt){installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;if(ovRerender)ovRerender();return}
  toast(isIOS?t('iosInstall'):t('browserInstall'));
}
/* başlangıç ekranındaki uygulama satırı */
function appRow(){
  if(standalone())return `<div class="approw"><button class="ghost" id="share">${t('share')}</button></div>`;
  return `<div class="approw"><button class="ghost" id="share">${t('share')}</button>${onWeb?`<button class="ghost" id="install">${t('install')}</button>`:''}</div>`;
}
function bindAppRow(){const s=$('#share');if(s)s.onclick=()=>{sfx('tap');shareApp()};const i=$('#install');if(i)i.onclick=()=>{sfx('tap');installApp()}}
