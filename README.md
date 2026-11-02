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
- **10 kişilik bot kadrosu:** Her karakterin sabit güçlü/zayıf kategorisi, futbol bilgisi ve saldırganlığı var; her oyunda ikisi rakip olur
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
js/util.js            küçük yardımcılar
js/i18n.js            arayüz metinleri (tr/de/en)
js/sound.js           kısa ses efektleri (dosyasız, Web Audio)
js/questions.js       soru havuzu: tekrar etmeden soru seçme
js/map.js             harita oluşturma, bölgeler, komşuluklar, çizim
js/view.js            harita görüntüleyici: kaydırma, yakınlaştırma, odaklanma, dokunma
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

Düelloların yaklaşık %30'u sıralama bulmacasıdır (öğeleri doğru sıraya dizmek).

**İpucu jokeri:** Oyun başına 3 hak, soru başına en fazla bir kez. Çoktan seçmelide iki yanlış şıkkı siler, tahminde cevabın bulunduğu aralığı gösterir, sıralamada ilk öğeyi yerleştirir.

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
- [ ] Soru bankasını büyütmek (şu an kategori başına ~45, hedef 100+)
- [ ] Bot dengesini gerçek oyun testlerine göre ayarlamak
- [ ] Online çok oyunculu mod: oda kodu ile arkadaşla oynama, eksik oyuncuyu bot doldurur; sorular ve cevap kontrolü sunucuda
- [ ] Telefona uygulama olarak paketleme
- [ ] Yeni haritalar (Dünya, Amerika, Orta Doğu, Afrika…) ve özel etkinlikler (Osmanlı, Fizik…)
