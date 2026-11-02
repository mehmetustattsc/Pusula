# Pusula

> „Hayatta en hakiki mürşit ilimdir.“ — Atatürk

Bil ve Fethet (Triviador) kalıbında bir **bilgi + strateji + bulmaca** oyunu. Soruları bilerek harita üzerinde toprak kazanır, rakip kaleleri düşürürsün. Botlara karşı ve (ileride) gerçek oyuncularla karşılıklı oynanır.

## Şu anki durum: prototip

Tarayıcıda çalışan oynanabilir bir prototip. Bir sunucu ya da kurulum gerektirmez.

- **4 harita:** Türkiye (19 bölge), Almanya (20 şehir), Avrupa (26 ülke), Uzak Doğu (26 bölge); her oyuncunun 3 kuleli bir kalesi
- **Haritaya özel sorular:** Her haritanın kendi kültürüne ait soruları o haritada daha sık gelir (ör. Uzak Doğu'da Japonya, Çin, Kore soruları)
- **3 mod:** Klasik (4 savaş turu), Hızlı maç (2 tur, seri tempo), Futbol Gecesi (özel etkinlik: her soru futbol)
- **Bot gücü:** Kolay, Normal, Zor
- **6 kategori:** Tarih, Coğrafya, Bilim, Spor, Sanat, Genel Kültür (+ etkinlik kategorisi Futbol)
- **3 dil:** Türkçe, Almanca, İngilizce (oyun içinde değiştirilebilir)
- **10 kişilik bot kadrosu:** Her karakterin sabit güçlü/zayıf kategorisi, futbol bilgisi ve saldırganlığı var; her oyunda 2–4 tanesi rakip olur
- **Altın:** Doğru cevaplarla, bölge alarak ve botları izlerken cevap vererek kazanılır; ipucu, kule onarımı ve yedek kale için harcanır
- **İzleme hızı:** Botların kendi düellolarını 1x, 2x veya 4x hızda izleyebilirsin
- **"Biliyor muydun?" kartları:** Beklerken ekranın altında 86 niş bilgiden biri belirir; gördüğün bilgi aynı oyunda soru olarak gelebilir, bilirsen +10 altın bonus. Oyun sonunda "Bu oyunda öğrendiklerin" listesi
- **411 soru:** çoktan seçmeli, tahmin ve sıralama bulmacası; görülen sorular oyunlar arasında hatırlanır, tekrar azalır
- **Harita görüntüleyici:** parmakla kaydırma, iki parmakla yakınlaştırma, sıra gelince otomatik odaklanma
- **Sıra duyuruları:** "Sıra sende!", "Ayla saldırıyor" gibi ekran ortası mesajlar
- **İpucu jokeri** (oyun başına 3), doğru cevap serisi, oyun sonunda kategori karnesi, kısa ses efektleri

## Proje yapısı

```
index.html            sayfa iskeleti, dosyaları sırayla yükler
css/style.css         tasarım (renkler, yazı tipleri, yerleşim)
data/questions.js     SORU BANKASI — yeni sorular buraya eklenir
data/maps.js          HARİTALAR — kara sınırları, bölge merkezleri, kaleler, tema
data/bots.js          BOT KADROSU — isim, ünvan, renk, güçlü/zayıf kategori, tarz
data/facts.js         BİLGİ KARTLARI — "Biliyor muydun?" bilgileri, her biri bir soruyla
js/util.js            küçük yardımcılar
js/i18n.js            arayüz metinleri (tr/de/en)
js/sound.js           kısa ses efektleri (dosyasız, Web Audio)
js/questions.js       soru havuzu: tekrar etmeden soru seçme
js/map.js             harita oluşturma, bölgeler, komşuluklar, çizim
js/view.js            harita görüntüleyici: kaydırma, yakınlaştırma, odaklanma, dokunma
js/facts.js           bilgi kartlarını gösterme ve öğrenilen bilgiden soru çıkarma
js/state.js           ayarlar, modlar, oyun durumu, bot profilleri, puan
js/ui.js              oyuncu kartları, durum satırı, harita dokunuşları
js/ask.js             soru ekranları: çoktan seçmeli, tahmin, sıralama
js/game.js            oyun akışı: yayılma, savaş, kale, oyun sonu
tools/check-questions.js   soru bankası doğrulayıcı
tools/build.js             tek dosyalık sürüm üretir (dist/pusula.html, dist/pusula-embed.html)
tools/test-autoplay.py     bütün harita ve modlarda otomatik tam oyun testi
```

Oyunu çalıştırmak için `index.html` dosyasını tarayıcıda açmak yeterli.

Geliştirirken: adresin sonuna `#auto` eklenirse (`index.html#auto`) oyun kendi kendine, çok hızlı oynar. `tools/test-autoplay.py` bunu kullanarak bütün kombinasyonları dener.

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

- Kategori kodları: `hist` Tarih, `geo` Coğrafya, `sci` Bilim, `spo` Spor, `art` Sanat, `gen` Genel Kültür, `fb` Futbol (etkinlik).
- Dile göre değişmeyen seçenekler (isimler, sayılar) düz metin olabilir; değişenler `{tr,de,en}` olarak yazılır.
- Bir sorunun `id`'si bir kez verildikten sonra değiştirilmez (ileride istatistikler ve online mod buna bağlanacak).
- Haritaya özel bir soru için `m` alanı eklenir: `m:"asia"`, `m:"tr"`, `m:"de"`, `m:"eu"`. Bu sorular o haritada %50 öncelikle gelir, diğer haritalarda normal sorular arasında yer alır.

Ekledikten sonra kontrol et:

```
node tools/check-questions.js   # eksik dil, yanlış seçenek sayısı, tekrar eden id vb.
node tools/build.js             # tek dosyalık sürüm: dist/pusula.html
```

## Bilgi kartı eklemek

`data/facts.js` içine bir satır: bilgi metni (`f`), o bilgiden bir soru (`q`) ve 4 seçenek (`a`, ilki doğru). Haritaya özelse `m` alanı eklenir. Bilgiler niş ama kesin doğru olmalı; tartışmalı olanlarda "anlatılır / söylenir" gibi ifadeler kullanılır. `node tools/check-questions.js` bilgileri de denetler.

```js
{id:"geo-fact-015",c:"geo",m:"tr",f:{tr:"…",de:"…",en:"…"},q:{tr:"…",de:"…",en:"…"},a:["Doğru","Yanlış","Yanlış","Yanlış"]},
```

## Harita eklemek

`data/maps.js` içine yeni bir harita nesnesi eklenir: sınır kutusu, kara çokgenleri (boylam, enlem), bölge merkezleri ve başlangıç kalesi üçlüleri. Bölge sınırları merkezlerden otomatik hesaplanır; uzun ülkelere (İtalya, Norveç gibi) ek merkez noktaları verilebilir. Ada ↔ kıta gibi deniz aşırı komşuluklar `seaLinks` ile tanımlanır. Başlangıç ekranı yeni haritayı kendiliğinden listeler.

## Oyun kuralları

1. **Yayılma:** Herkes aynı tahmin sorusunu cevaplar. En yakın tahmin 2, ikinci 1 bölge seçer. Sadece kendi topraklarına komşu boş bölgeler seçilebilir.
2. **Savaş (Klasik'te 4, Hızlı maçta 2 tur):** Oyuncular sırayla komşu bir düşman bölgesine saldırır. Soru, saldırılan bölgenin kategorisinden gelir.
   - Yalnız saldıran bilirse bölgeyi alır.
   - Yalnız savunan bilirse bölge kalır ve değeri +100 artar.
   - İkisi de bilirse tahmin sorusu karar verir. İkisi de bilemezse hiçbir şey değişmez.
3. **Kale:** 3 kulesi vardır. Saldıran, kazandığı her düelloda bir kule yıkar ve kaybedene kadar devam eder. Kale düşerse sahibinin bütün toprakları saldırana geçer ve o oyuncu elenir.
4. **Kazanan:** Savaş turlarının sonunda en yüksek puanlı oyuncu. Bölge 200, kale 1000 puan değerindedir.
5. **Kule onarımı:** Yıkılan kuleler kalıcıdır; saldıran bir sonraki saldırısında kaldığı yerden devam eder. Savunan, kendi turunun başında bir kuleyi 40 altınla ya da bir sıralama bulmacasını doğru çözerek onarabilir (tur başına bir onarım).
6. **Yedek kale:** 80 altınla kendi bölgelerinden birine yedek kale kurulabilir. Ana kale düşerse oyuncu elenmez: ana kale bölgesi saldırana geçer, yedek kale 2 kuleyle yeni ana kale olur.

**Altın:** Oyuna 40 altınla başlanır. Kendi düellonda doğru cevap +10, botların düellosunu izlerken doğru cevap +15, yayılmada en yakın tahmin +10, bölge almak +10. İlk ipucu bedava, sonrakiler 30 altın.

**Oyuncu sayısı:** Sen + 2–4 bot. Kaleler haritada birbirinden olabildiğince uzak bölgelere otomatik yerleşir. 4 ve üzeri oyuncuda yayılmada üçüncü sıradaki de 1 bölge seçer.

Düelloların yaklaşık %30'u sıralama bulmacasıdır (öğeleri doğru sıraya dizmek).

**İpucu jokeri:** İlki bedava, sonrakiler 30 altın; soru başına en fazla bir kez. Çoktan seçmelide iki yanlış şıkkı siler, tahminde cevabın bulunduğu aralığı gösterir, sıralamada ilk öğeyi yerleştirir.

## Tasarım kararları

- **Ana yapı kategoriler.** Dönemler (Sancak'taki gibi) ana sistem değil, ileride görsel tema veya özel etkinlik olarak gelebilir.
- **Bölge = kategori.** Her bölgenin bir kategorisi var; strateji, rakibin zayıf olduğu kategorideki bölgelere saldırmak.
- **Özel etkinlikler:** Dar konularda geçici modlar. İlki Futbol Gecesi; Fizik, Osmanlı gibi yenileri aynı şekilde eklenir (`EVENT_CATS` + o kategoride sorular + `MODES` içinde bir mod).
- **Haritalar** kategoriden bağımsız: Türkiye, Almanya, Avrupa; sırada Dünya vb.
- **Çok dil:** Her soru tek kimlikle, üç dilde saklanır. Farklı dilde oynayan oyuncular aynı maçta aynı soruyu kendi dilinde görür. Dile bağlı kelime oyunlarından kaçınılır.

## Yol haritası

- [x] Tarayıcı prototipi: sen + 2 bot, Türkiye haritası
- [x] Soru bankasını ayrı veri dosyasına taşımak, doğrulayıcı eklemek
- [x] Projeyi modüllere bölmek (harita, oyun mantığı, soru akışları, arayüz)
- [x] Almanya ve Avrupa haritaları
- [x] Oyun modları (Klasik, Hızlı maç, Futbol Gecesi) ve bot gücü
- [x] İpucu jokeri, seriler, kategori karnesi, sesler
- [x] Uzak Doğu haritası ve haritaya özel sorular
- [x] Bot kadrosu, sıra duyuruları, harita yakınlaştırma, yeni tasarım
- [x] 2–4 rakip, izleme hızı, izlerken cevaplama, altın, kule onarımı, yedek kale
- [x] "Biliyor muydun?" bilgi kartları (86 bilgi), öğrenilen bilginin soru olarak dönmesi
- [ ] Bilgi kartlarını büyütmek (hedef 300+, her harita için ayrı set)
- [ ] Soru bankasını büyütmek (şu an kategori başına ~45, hedef 100+)
- [ ] Bot dengesini gerçek oyun testlerine göre ayarlamak
- [ ] Online çok oyunculu mod: oda kodu ile arkadaşla oynama, eksik oyuncuyu bot doldurur; sorular ve cevap kontrolü sunucuda; düellodaki iki kişi dışındakiler izlerken cevap verip altın kazanır
- [ ] Telefona uygulama olarak paketleme
- [ ] Yeni haritalar (Dünya, Amerika, Orta Doğu, Afrika…) ve özel etkinlikler (Osmanlı, Fizik…)
