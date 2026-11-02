# Pusula

> „Hayatta en hakiki mürşit ilimdir.“ — Atatürk

Bil ve Fethet (Triviador) kalıbında bir **bilgi + strateji + bulmaca** oyunu. Soruları bilerek harita üzerinde toprak kazanır, rakip kaleleri düşürürsün. Botlara karşı ve (ileride) gerçek oyuncularla karşılıklı oynanır.

## Şu anki durum: prototip

Tarayıcıda çalışan oynanabilir bir prototip. Bir sunucu ya da kurulum gerektirmez.

- Türkiye haritası, 19 bölge, her oyuncunun 3 kuleli bir kalesi
- 6 kategori: Tarih, Coğrafya, Bilim, Spor, Sanat, Genel Kültür
- 3 dil: Türkçe, Almanca, İngilizce (oyun içinde değiştirilebilir)
- 2 bot (Ayla, Kaan), her oyunda rastgele güçlü/zayıf kategorileriyle
- Yaklaşık 95 soru: çoktan seçmeli, tahmin ve sıralama bulmacası

## Proje yapısı

```
index.html            sayfa iskeleti, dosyaları sırayla yükler
css/style.css         tasarım (renkler, yazı tipleri, yerleşim)
data/questions.js     SORU BANKASI — yeni sorular buraya eklenir
js/util.js            küçük yardımcılar
js/i18n.js            arayüz metinleri (tr/de/en)
js/questions.js       soru havuzu: tekrar etmeden soru seçme
js/map.js             Türkiye haritası, bölgeler, komşuluklar, çizim
js/state.js           oyun durumu, oyuncular, bot profilleri, puan
js/ui.js              oyuncu kartları, durum satırı, harita dokunuşları
js/ask.js             soru ekranları: çoktan seçmeli, tahmin, sıralama
js/game.js            oyun akışı: yayılma, savaş, kale, oyun sonu
tools/check-questions.js   soru bankası doğrulayıcı
tools/build.js             tek dosyalık sürüm üretir (dist/pusula.html)
```

Oyunu çalıştırmak için `index.html` dosyasını tarayıcıda açmak yeterli.

## Soru eklemek

`data/questions.js` içindeki ilgili listeye bir satır ekle:

```js
// çoktan seçmeli: İLK seçenek doğru cevaptır, oyun karıştırarak gösterir
{id:"geo-mc-011",c:"geo",q:{tr:"…",de:"…",en:"…"},a:["Doğru","Yanlış 1","Yanlış 2","Yanlış 3"]},
// tahmin: v sayısal cevap, u birim ('y' = yıl, '' = birimsiz)
{id:"sci-est-006",c:"sci",q:{tr:"…",de:"…",en:"…"},v:1234,u:"km"},
// sıralama: öğeler DOĞRU sırada yazılır
{id:"art-ord-003",c:"art",q:{tr:"…",de:"…",en:"…"},items:["1.","2.","3.","4."]},
```

- Kategori kodları: `hist` Tarih, `geo` Coğrafya, `sci` Bilim, `spo` Spor, `art` Sanat, `gen` Genel Kültür.
- Dile göre değişmeyen seçenekler (isimler, sayılar) düz metin olabilir; değişenler `{tr,de,en}` olarak yazılır.
- Bir sorunun `id`'si bir kez verildikten sonra değiştirilmez (ileride istatistikler ve online mod buna bağlanacak).

Ekledikten sonra kontrol et:

```
node tools/check-questions.js   # eksik dil, yanlış seçenek sayısı, tekrar eden id vb.
node tools/build.js             # tek dosyalık sürüm: dist/pusula.html
```

## Oyun kuralları

1. **Yayılma:** Herkes aynı tahmin sorusunu cevaplar. En yakın tahmin 2, ikinci 1 bölge seçer. Sadece kendi topraklarına komşu boş bölgeler seçilebilir.
2. **Savaş (4 tur):** Oyuncular sırayla komşu bir düşman bölgesine saldırır. Soru, saldırılan bölgenin kategorisinden gelir.
   - Yalnız saldıran bilirse bölgeyi alır.
   - Yalnız savunan bilirse bölge kalır ve değeri +100 artar.
   - İkisi de bilirse tahmin sorusu karar verir. İkisi de bilemezse hiçbir şey değişmez.
3. **Kale:** 3 kulesi vardır. Saldıran, kazandığı her düelloda bir kule yıkar ve kaybedene kadar devam eder. Kale düşerse sahibinin bütün toprakları saldırana geçer ve o oyuncu elenir.
4. **Kazanan:** Savaş turlarının sonunda en yüksek puanlı oyuncu. Bölge 200, kale 1000 puan değerindedir.

Düelloların yaklaşık %30'u sıralama bulmacasıdır (öğeleri doğru sıraya dizmek).

## Tasarım kararları

- **Ana yapı kategoriler.** Dönemler (Sancak'taki gibi) ana sistem değil, ileride görsel tema veya özel etkinlik olarak gelebilir.
- **Bölge = kategori.** Her bölgenin bir kategorisi var; strateji, rakibin zayıf olduğu kategorideki bölgelere saldırmak.
- **Özel etkinlikler** (sonra): Futbol, Fizik, Osmanlı gibi dar konularda geçici modlar, kendi haritası ve ödülüyle.
- **Haritalar** kategoriden bağımsız: Türkiye ile başlıyoruz, sonra Avrupa, Dünya vb.
- **Çok dil:** Her soru tek kimlikle, üç dilde saklanır. Farklı dilde oynayan oyuncular aynı maçta aynı soruyu kendi dilinde görür. Dile bağlı kelime oyunlarından kaçınılır.

## Yol haritası

- [x] Tarayıcı prototipi: sen + 2 bot, Türkiye haritası
- [x] Soru bankasını ayrı veri dosyasına taşımak, doğrulayıcı eklemek
- [x] Projeyi modüllere bölmek (harita, oyun mantığı, soru akışları, arayüz)
- [ ] Soru bankasını büyütmek (kategori başına 100+ soru)
- [ ] Online çok oyunculu mod: oda kodu ile arkadaşla oynama, eksik oyuncuyu bot doldurur; sorular ve cevap kontrolü sunucuda
- [ ] Telefona uygulama olarak paketleme
- [ ] Yeni haritalar ve özel etkinlikler
