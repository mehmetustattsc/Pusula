// Derleme: node tools/build.js
//   web/                      telefona kurulabilir uygulama (GitHub Pages'te yayınlanan klasör):
//                             tek dosyalık index.html + manifest + service worker + ikonlar
//   dist/pusula.html          tek başına açılabilen tek dosya
//   dist/pusula-embed.html    iskeletsiz sürüm (Claude artifact sayfası gibi kendi iskeletini ekleyen ortamlar için)
// index.html'deki yerel CSS ve JS dosyaları sayfanın içine gömülür.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet" href="(?!https?:)([^"]+)">/g, (_, href) =>
  `<style>\n${fs.readFileSync(path.join(root, href), 'utf8')}</style>`);

html = html.replace(/<script src="(?!https?:)([^"]+)"><\/script>/g, (_, src) =>
  `<script>\n/* ${src} */\n${fs.readFileSync(path.join(root, src), 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`);

/* ---- web/: uygulama ---- */
const web = path.join(root, 'web');
fs.rmSync(web, { recursive: true, force: true });
fs.mkdirSync(path.join(web, 'icons'), { recursive: true });
fs.writeFileSync(path.join(web, 'index.html'), html);
const pub = path.join(root, 'public');
for (const f of fs.readdirSync(pub)) if (f !== 'icons') fs.copyFileSync(path.join(pub, f), path.join(web, f));
for (const f of fs.readdirSync(path.join(pub, 'icons'))) fs.copyFileSync(path.join(pub, 'icons', f), path.join(web, 'icons', f));
// service worker önbellek adı içerik özetinden: her yeni sürümde telefonlar yenisini indirir
const version = crypto.createHash('sha1').update(html).digest('hex').slice(0, 10);
const swPath = path.join(web, 'sw.js');
fs.writeFileSync(swPath, fs.readFileSync(swPath, 'utf8').replace('__VERSION__', version));
fs.writeFileSync(path.join(web, '.nojekyll'), '');
console.log(`web/ yazıldı (sürüm ${version}, ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);

/* ---- dist/: tek dosya ve gömülebilir sürüm (uygulama bağlantıları olmadan) ---- */
const plain = html
  .replace(/<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\s*/g, '')
  .replace(/<meta name="(apple-mobile-web-app-[^"]+|mobile-web-app-capable)"[^>]*>\s*/g, '');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'pusula.html'), plain);
const head = plain.slice(plain.indexOf('<head>') + 6, plain.indexOf('</head>'))
  .replace(/<meta charset[^>]*>\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '');
const body = plain.slice(plain.indexOf('<body>') + 6, plain.lastIndexOf('</body>'));
fs.writeFileSync(path.join(root, 'dist', 'pusula-embed.html'), head.trim() + '\n' + body.trim() + '\n');
console.log('dist/pusula.html ve dist/pusula-embed.html yazıldı');
