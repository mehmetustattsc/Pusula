"""Otomatik tam oyun testi.

Oyunu index.html#auto ile açar: oyun kendi kendine, çok hızlı oynar.
Her harita/mod/zorluk kombinasyonu için oyunun sonuna kadar gidildiğini
ve tarayıcıda hata çıkmadığını kontrol eder.

Gerekenler: pip install playwright && playwright install chromium

Kullanım:
  python3 tools/test-autoplay.py                      # bütün haritalar x bütün modlar
  python3 tools/test-autoplay.py tr:classic:normal    # tek kombinasyon
  python3 tools/test-autoplay.py eu:classic:normal:4  # 4 rakip botla
"""
import os, sys, time, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'index.html').as_uri() + '#auto'
MAPS, MODES = ['tr', 'de', 'eu', 'asia'], ['classic', 'quick', 'football']
combos = [tuple((a.split(':') + ['2'])[:4]) for a in sys.argv[1:]] or [(m, md, 'normal', str(2 + i % 3)) for i, (m, md) in enumerate((m, md) for m in MAPS for md in MODES)]

fails = 0
with sync_playwright() as p:
    # PW_CHROME ortam değişkeniyle kurulu bir Chrome kullanılabilir (ör. /usr/bin/google-chrome)
    chrome = os.environ.get('PW_CHROME')
    browser = p.chromium.launch(executable_path=chrome, args=['--no-sandbox']) if chrome else p.chromium.launch()
    for (m, mode, diff, nopp) in combos:
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.add_init_script(f"localStorage.setItem('pusula.set', JSON.stringify({{map:'{m}', mode:'{mode}', diff:'{diff}', nOpp:{nopp}}}))")
        t0 = time.time()
        page.goto(URL)
        page.wait_for_selector('#go', timeout=20000)
        page.click('#go')
        try:
            page.wait_for_selector('.endt', timeout=120000)
            print(f'OK    {m}/{mode}/{diff}/{nopp}  {time.time() - t0:.1f}s  {page.inner_text(".endt")}')
        except Exception:
            fails += 1
            print(f'FAIL  {m}/{mode}/{diff}/{nopp}  oyun bitmedi: {page.inner_text("#sm")}')
        if errors:
            fails += 1
            print('      hatalar:', errors[:5])
        page.close()
    browser.close()

print('Bütün testler geçti.' if not fails else f'{fails} sorun bulundu.')
sys.exit(1 if fails else 0)
