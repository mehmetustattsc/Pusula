/* ===================== i18n ===================== */
const LANGS=['tr','de','en'];
let lang='tr';
try{const s=localStorage.getItem('pusula.lang');if(LANGS.includes(s))lang=s;else{const n=(navigator.language||'tr').slice(0,2);if(LANGS.includes(n))lang=n}}catch(e){}
/* Çok dilli metin: düz metin ise aynen, {tr,de,en} ise seçili dilde; eksik dilde Türkçeye düşer */
const T=x=>x&&typeof x==='object'?(x[lang]??x.tr):x;
const S={
tr:{sub:'prototip',bYourPick:'Seçim sırası sende!',bYourTurn:'Sıra sende!',bBotTurn:'{p} saldırıyor',bYouDefend:'{r} bölgeni savunma sırası sende!',bTarget:'Hedef: {r} ({d})',bWar:'Savaş başlıyor!',bWarSub:'{n} tur boyunca sırayla saldırılacak',bExpand:'Yayılma · Tur {n}',bExpandSub:'Herkes aynı tahmin sorusunu cevaplıyor',oppL:'Rakiplerin',reroll:'Değiştir',undo:'Geri al',confirm:'Onayla',streak:'{n} doğru üst üste!',hint:'İpucu',hintLeft:'{n} hak',rangeHint:'Cevap {lo} ile {hi} arasında',soundOn:'Ses açık',soundOff:'Ses kapalı',building:'Harita hazırlanıyor…',report:'Kategori karnen',bestStreak:'En uzun serin: {n} doğru',menu:'Ana menü',mapL:'Harita',modeL:'Mod',diffL:'Botların gücü',regionsN:'{n} bölge',mClassic:'Klasik',mClassicD:'4 savaş turu, bütün kategoriler',mQuick:'Hızlı maç',mQuickD:'2 savaş turu, seri tempo',mFootball:'Futbol Gecesi',mFootballD:'Özel etkinlik: her soru futbol',dEasy:'Kolay',dNormal:'Normal',dHard:'Zor',how:'Nasıl oynanır?',r6:'Oyun başına {n} ipucu hakkın var: iki yanlış şıkkı siler, tahminde aralık verir, sıralamada ilk öğeyi yerleştirir.',quote:'Hayatta en hakiki mürşit ilimdir.',tag:'Bil, seç, fethet. Haritada iki bota karşı bilgi ve strateji.',
r1:'Yayılma: Herkes aynı tahmin sorusunu cevaplar. En yakın tahmin 2, ikinci 1 bölge seçer.',
r2:'Savaş: Sırayla komşu bir bölgeye saldırırsın. Soru o bölgenin kategorisinden gelir.',
r3:'İkiniz de bilirseniz tahmin sorusu karar verir. Savunulan bölge +100 değer kazanır.',
r4:'Kaleyi almak için 3 kulesini de yık. Düşen kalenin bütün toprakları senin olur.',
r5:'Botların güçlü ve zayıf kategorilerine göre saldır. Savaş turları bitince en yüksek puan kazanır.',
start:'Oyuna başla',again:'Tekrar oyna',expand:'Yayılma',war:'Savaş',round:'Tur',you:'Sen',strong:'Güçlü',weak:'Zayıf',out:'Elendi',castle:'Kale',
est:'Tahmin',tiebreak:'Eşitlik bozucu',duel:'Düello',order:'Sıralama bulmacası',send:'Gönder',reset:'Sıfırla',answer:'Doğru cevap',diff:'fark',noAnswer:'cevap yok',
pick2:'İki bölge seç',pick1:'Bir bölge seç',pickHint:'Parlayan bölgelerden birine dokun.',botPick:'{p} bölge seçiyor…',picked:'{p} → {r}',
yourTurn:'Saldırı sırası sende',attackHint:'Parlayan bir düşman bölgesine dokun. Kategoriye ve rakibin zayıf yanına bak.',botTurn:'{p} saldırıyor',
took:'{a}, {r} bölgesini aldı',held:'{d}, {r} bölgesini savundu (+100)',none:'İkisi de bilemedi. {r} el değiştirmedi.',tie:'İkisi de bildi, tahmin karar verecek',
tower:'{r} kalesinde bir kule yıkıldı. Kalan: {n}',fell:'{a}, {d} kalesini fethetti!',noTarget:'{p} saldıracak komşu bulamadı.',
score:'puan',tapSkip:'Devam etmek için dokun',correct:'doğru',wrong:'yanlış',timeout:'Süre doldu',legend:'Bölge kategorileri · harfler haritadaki rozetlerdir',
zoomIn:'Yakınlaştır',zoomOut:'Tümünü gör',youLost:'Kalen düştü.',win:'Kazandın!',lose:'{p} kazandı',all:'Herkes',orderHint:'Öğelere sırayla dokun. Yanlış dokunduğun öğeye tekrar dokunursan geri alınır.',
estHint:'En yakın tahmin kazanır. Eşitlikte hızlı olan önde.',waitExpand:'Tahmin sorusu geliyor…',final:'Son durum'},
de:{sub:'Prototyp',bYourPick:'Du wählst!',bYourTurn:'Du bist dran!',bBotTurn:'{p} greift an',bYouDefend:'Verteidige dein Gebiet {r}!',bTarget:'Ziel: {r} ({d})',bWar:'Der Krieg beginnt!',bWarSub:'{n} Runden lang wird reihum angegriffen',bExpand:'Ausbreitung · Runde {n}',bExpandSub:'Alle beantworten dieselbe Schätzfrage',oppL:'Deine Gegner',reroll:'Wechseln',undo:'Zurück',confirm:'Bestätigen',streak:'{n} richtig in Folge!',hint:'Tipp',hintLeft:'{n} übrig',rangeHint:'Die Antwort liegt zwischen {lo} und {hi}',soundOn:'Ton an',soundOff:'Ton aus',building:'Karte wird vorbereitet…',report:'Dein Zeugnis nach Kategorie',bestStreak:'Längste Serie: {n} richtig',menu:'Hauptmenü',mapL:'Karte',modeL:'Modus',diffL:'Stärke der Bots',regionsN:'{n} Gebiete',mClassic:'Klassisch',mClassicD:'4 Kriegsrunden, alle Kategorien',mQuick:'Schnelles Spiel',mQuickD:'2 Kriegsrunden, hohes Tempo',mFootball:'Fußballabend',mFootballD:'Event: jede Frage dreht sich um Fußball',dEasy:'Leicht',dNormal:'Normal',dHard:'Schwer',how:'Spielregeln',r6:'Du hast {n} Tipps pro Spiel: zwei falsche Antworten weg, ein Bereich bei Schätzfragen oder der erste Eintrag beim Sortieren.',quote:'Der wahrste Wegweiser im Leben ist das Wissen.',tag:'Wissen, wählen, erobern. Wissen und Strategie auf der Karte gegen zwei Bots.',
r1:'Ausbreitung: Alle beantworten dieselbe Schätzfrage. Die beste Schätzung wählt 2 Gebiete, die zweitbeste 1.',
r2:'Krieg: Reihum greifst du ein Nachbargebiet an. Die Frage kommt aus der Kategorie dieses Gebiets.',
r3:'Wissen es beide, entscheidet eine Schätzfrage. Ein verteidigtes Gebiet gewinnt +100 Wert.',
r4:'Für eine Burg musst du alle 3 Türme zerstören. Dann gehört dir das ganze Land des Gegners.',
r5:'Greif dort an, wo die Bots schwach sind. Nach den Kriegsrunden gewinnt die höchste Punktzahl.',
start:'Spiel starten',again:'Nochmal spielen',expand:'Ausbreitung',war:'Krieg',round:'Runde',you:'Du',strong:'Stark',weak:'Schwach',out:'Ausgeschieden',castle:'Burg',
est:'Schätzfrage',tiebreak:'Stechen',duel:'Duell',order:'Sortierrätsel',send:'Senden',reset:'Zurücksetzen',answer:'Richtige Antwort',diff:'Abw.',noAnswer:'keine Antwort',
pick2:'Wähle zwei Gebiete',pick1:'Wähle ein Gebiet',pickHint:'Tippe auf ein leuchtendes Gebiet.',botPick:'{p} wählt…',picked:'{p} → {r}',
yourTurn:'Du greifst an',attackHint:'Tippe auf ein leuchtendes Feindgebiet. Achte auf Kategorie und Schwächen.',botTurn:'{p} greift an',
took:'{a} erobert {r}',held:'{d} verteidigt {r} (+100)',none:'Beide lagen falsch. {r} bleibt, wie es war.',tie:'Beide richtig – die Schätzfrage entscheidet',
tower:'Ein Turm der Burg {r} fällt. Übrig: {n}',fell:'{a} erobert die Burg von {d}!',noTarget:'{p} hat kein Ziel.',
score:'Punkte',tapSkip:'Tippen zum Fortfahren',correct:'richtig',wrong:'falsch',timeout:'Zeit abgelaufen',legend:'Kategorien der Gebiete · die Kürzel stehen auf der Karte',
zoomIn:'Vergrößern',zoomOut:'Ganze Karte',youLost:'Deine Burg ist gefallen.',win:'Du hast gewonnen!',lose:'{p} gewinnt',all:'Alle',orderHint:'Tippe die Einträge der Reihe nach an. Nochmal tippen nimmt einen Eintrag zurück.',
estHint:'Die nächste Schätzung gewinnt. Bei Gleichstand zählt die Zeit.',waitExpand:'Die Schätzfrage kommt…',final:'Endstand'},
en:{sub:'prototype',bYourPick:'Your pick!',bYourTurn:'Your turn!',bBotTurn:'{p} attacks',bYouDefend:'Defend your region {r}!',bTarget:'Target: {r} ({d})',bWar:'War begins!',bWarSub:'{n} rounds of taking turns to attack',bExpand:'Expansion · Round {n}',bExpandSub:'Everyone answers the same estimate',oppL:'Your opponents',reroll:'Shuffle',undo:'Undo',confirm:'Confirm',streak:'{n} right in a row!',hint:'Hint',hintLeft:'{n} left',rangeHint:'The answer is between {lo} and {hi}',soundOn:'Sound on',soundOff:'Sound off',building:'Preparing the map…',report:'Your category report',bestStreak:'Longest streak: {n} right',menu:'Main menu',mapL:'Map',modeL:'Mode',diffL:'Bot strength',regionsN:'{n} regions',mClassic:'Classic',mClassicD:'4 war rounds, all categories',mQuick:'Quick match',mQuickD:'2 war rounds, fast pace',mFootball:'Football Night',mFootballD:'Special event: every question is football',dEasy:'Easy',dNormal:'Normal',dHard:'Hard',how:'How to play',r6:'You get {n} hints per game: remove two wrong answers, get a range on estimates, or place the first item in a puzzle.',quote:'The truest guide in life is knowledge.',tag:'Know, choose, conquer. Knowledge and strategy on the map against two bots.',
r1:'Expansion: everyone answers the same estimate question. Closest picks 2 regions, second picks 1.',
r2:'War: take turns attacking a neighbouring region. The question comes from that region\'s category.',
r3:'If both answer right, an estimate question decides. A defended region gains +100 value.',
r4:'To take a castle, knock down all 3 towers. All of the fallen player\'s land becomes yours.',
r5:'Attack where the bots are weak. When the war rounds end, the highest score wins.',
start:'Start game',again:'Play again',expand:'Expansion',war:'War',round:'Round',you:'You',strong:'Strong',weak:'Weak',out:'Out',castle:'Castle',
est:'Estimate',tiebreak:'Tiebreaker',duel:'Duel',order:'Ordering puzzle',send:'Send',reset:'Reset',answer:'Correct answer',diff:'off by',noAnswer:'no answer',
pick2:'Pick two regions',pick1:'Pick one region',pickHint:'Tap one of the glowing regions.',botPick:'{p} is picking…',picked:'{p} → {r}',
yourTurn:'Your attack',attackHint:'Tap a glowing enemy region. Watch the category and your rival\'s weak spot.',botTurn:'{p} attacks',
took:'{a} takes {r}',held:'{d} holds {r} (+100)',none:'Both missed. {r} stays put.',tie:'Both right – an estimate decides',
tower:'A tower of {r} castle falls. Left: {n}',fell:'{a} conquers {d}\'s castle!',noTarget:'{p} has no target.',
score:'pts',tapSkip:'Tap to continue',correct:'right',wrong:'wrong',timeout:'Time\'s up',legend:'Region categories · the letters are the map badges',
zoomIn:'Zoom in',zoomOut:'Whole map',youLost:'Your castle fell.',win:'You win!',lose:'{p} wins',all:'Everyone',orderHint:'Tap the items in order. Tap a numbered item again to take it back.',
estHint:'Closest guess wins. On a tie, the faster answer leads.',waitExpand:'Estimate question coming…',final:'Final standings'}
};
const t=(k,v)=>{let s=S[lang][k]??k;if(v)s=s.replace(/\{(\w+)\}/g,(m,x)=>v[x]);return s};

