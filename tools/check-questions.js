// Soru bankasını doğrular: node tools/check-questions.js
// Kontroller: benzersiz id, geçerli kategori, üç dilde metin, 4 seçenek / 4 öğe,
// tekrar eden seçenek, sayısal tahmin cevabı. Sonunda kategori başına sayıları yazar.
const path = require('path');
const { CATS, EVENT_CATS, QUESTIONS } = require(path.join(__dirname, '..', 'data', 'questions.js'));

const LANGS = ['tr', 'de', 'en'];
const errors = [];
const ids = new Set();

const text = (x, where) => {
  if (typeof x === 'string') { if (!x.trim()) errors.push(`${where}: boş metin`); return; }
  if (!x || typeof x !== 'object') { errors.push(`${where}: metin yok`); return; }
  for (const l of LANGS) if (!x[l] || !String(x[l]).trim()) errors.push(`${where}: '${l}' eksik`);
};
const noDupes = (arr, where) => {
  for (const l of LANGS) {
    const vals = arr.map(a => (typeof a === 'string' ? a : a[l]));
    if (new Set(vals).size !== vals.length) errors.push(`${where}: '${l}' dilinde tekrar eden seçenek`);
  }
};

const count = {};
for (const type of ['mc', 'est', 'ord']) {
  for (const q of QUESTIONS[type] || []) {
    const w = q.id || `${type}?`;
    if (!q.id) errors.push(`${type}: id eksik`);
    else if (ids.has(q.id)) errors.push(`${q.id}: id tekrar ediyor`);
    ids.add(q.id);
    if (!CATS.includes(q.c) && !EVENT_CATS.includes(q.c)) errors.push(`${w}: bilinmeyen kategori '${q.c}'`);
    text(q.q, `${w} soru`);
    if (type === 'mc') {
      if (!Array.isArray(q.a) || q.a.length !== 4) errors.push(`${w}: tam 4 seçenek olmalı`);
      else { q.a.forEach((a, i) => text(a, `${w} seçenek ${i + 1}`)); noDupes(q.a, w); }
    }
    if (type === 'est') {
      if (typeof q.v !== 'number' || !isFinite(q.v) || q.v < 0) errors.push(`${w}: v pozitif bir sayı olmalı`);
      if (typeof q.u !== 'string') errors.push(`${w}: u (birim) metin olmalı`);
    }
    if (type === 'ord') {
      if (!Array.isArray(q.items) || q.items.length !== 4) errors.push(`${w}: tam 4 öğe olmalı`);
      else { q.items.forEach((a, i) => text(a, `${w} öğe ${i + 1}`)); noDupes(q.items, w); }
    }
    count[q.c] = count[q.c] || { mc: 0, est: 0, ord: 0 };
    count[q.c][type]++;
  }
}

// "Biliyor muydun?" bilgileri: bilgi metni, soru ve 4 seçenek
const { FACTS } = require(path.join(__dirname, '..', 'data', 'facts.js'));
for (const f of FACTS) {
  const w = f.id || 'fact?';
  if (!f.id) errors.push('fact: id eksik'); else if (ids.has(f.id)) errors.push(`${f.id}: id tekrar ediyor`);
  ids.add(f.id);
  if (!CATS.includes(f.c)) errors.push(`${w}: bilinmeyen kategori '${f.c}'`);
  text(f.f, `${w} bilgi`); text(f.q, `${w} soru`);
  if (!Array.isArray(f.a) || f.a.length !== 4) errors.push(`${w}: tam 4 seçenek olmalı`);
  else { f.a.forEach((a, i) => text(a, `${w} seçenek ${i + 1}`)); noDupes(f.a, w); }
}

console.log('Kategori       çoktan  tahmin  sıralama');
for (const c of [...CATS, ...EVENT_CATS]) {
  const k = count[c] || { mc: 0, est: 0, ord: 0 };
  console.log(`${c.padEnd(14)} ${String(k.mc).padStart(6)}  ${String(k.est).padStart(6)}  ${String(k.ord).padStart(8)}`);
}
console.log(`Bilgi kartı: ${FACTS.length}`);
console.log(`Toplam: ${ids.size - FACTS.length} soru + ${FACTS.length} bilgi`);

if (errors.length) {
  console.error(`\n${errors.length} hata:`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log('Hata yok.');
