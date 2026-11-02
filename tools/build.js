// Tek dosyalık sürüm üretir: node tools/build.js  ->  dist/pusula.html
// index.html'deki yerel CSS ve JS dosyalarını sayfanın içine gömer.
// Bu dosya tek başına açılabilir, paylaşılabilir ya da yayınlanabilir.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet" href="(?!https?:)([^"]+)">/g, (_, href) =>
  `<style>\n${fs.readFileSync(path.join(root, href), 'utf8')}</style>`);

html = html.replace(/<script src="(?!https?:)([^"]+)"><\/script>/g, (_, src) =>
  `<script>\n/* ${src} */\n${fs.readFileSync(path.join(root, src), 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'pusula.html'), html);
console.log(`dist/pusula.html yazıldı (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
