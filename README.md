# Pusula

> „Hayatta en hakiki mürşit ilimdir.“ — Atatürk

Bil ve Fethet (Triviador) kalıbında bir **bilgi + strateji + bulmaca** oyunu. Soruları bilerek harita üzerinde toprak kazanır, rakip kaleleri düşürürsün. Botlara karşı ve (ileride) gerçek oyuncularla karşılıklı oynanır.

## Şu anki durum: prototip

`index.html` tek dosyalık, tarayıcıda çalışan oynanabilir bir prototip. Bir sunucu ya da kurulum gerektirmez, dosyayı tarayıcıda açmak yeterli.

- Türkiye haritası, 19 bölge, her oyuncunun 3 kuleli bir kalesi
- 6 kategori: Tarih, Coğrafya, Bilim, Spor, Sanat, Genel Kültür
- 3 dil: Türkçe, Almanca, İngilizce (oyun içinde değiştirilebilir)
- 2 bot (Ayla, Kaan), her oyunda rastgele güçlü/zayıf kategorileriyle
- Yaklaşık 95 soru: çoktan seçmeli, tahmin ve sıralama bulmacası

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
- [ ] Soru bankasını ayrı bir veri dosyasına taşımak ve büyütmek (kategori başına 100+ soru)
- [ ] Projeyi modüllere bölmek (harita, oyun mantığı, soru akışları, arayüz)
- [ ] Online çok oyunculu mod: oda kodu ile arkadaşla oynama, eksik oyuncuyu bot doldurur; sorular ve cevap kontrolü sunucuda
- [ ] Telefona uygulama olarak paketleme
- [ ] Yeni haritalar ve özel etkinlikler
