# Iluminowana Księga – koncepcja interfejsu modułu Grimoires

## Cel

Okno księgi ma wyglądać i działać jak prawdziwa księga zaklęć ze Starego Świata, a nie jak lista z panelem szczegółów. Zwykła księga magii zawiera około **4 zaklęć albo jeden rytuał**, więc nie przewijamy długiej listy: przewracamy strony. Każde zaklęcie ma własną rozkładówkę, a rytuał zajmuje całą księgę. Każda szkoła magii ma swój styl graficzny: kolor atramentu, sigil, marginalia i jeden znak szczególny strony.

## Gracz i jego pytania

| Kto | Pyta | Odpowiedź w interfejsie |
|---|---|---|
| Czarodziej przy stole | „Co mam w tej księdze i co mogę z niej rzucić?” | Spis treści na pierwszej rozkładówce: sigile szkół, PM, pieczęć stanu (zapamiętane, z księgi, tylko do czytania). |
| Czarodziej w walce | „Rzucam z księgi, szybko.” | Strzałki albo wstążka zaklęcia, duży przycisk-pieczęć **Rzuć**, PM w medalionie. |
| Postać, która nie umie czytać | „Co to za księga?” | Runy zamiast tekstu, zamknięte strony, znaki warunków na marginesie. |
| MG | „Przygotuję księgę kultysty.” | Tryb Skryptorium: wolne foliały, przeciąganie zaklęć, szyfr, łańcuchy księgi zakazanej. |

## Książka jako przestrzeń

```
 ┌──────────────── okładka (skóra w kolorze księgi, okucia, klamra) ────────────────┐
 │  wstążki: ▌Spis ▌Kula Ognia ▌Płomienny Miecz ▌Pochodnia ▌(wolne)                 │
 │ ┌───────────────────────────────┬┬───────────────────────────────┐                │
 │ │ LEWA STRONA                   ││ PRAWA STRONA                  │                │
 │ │                               ││                               │                │
 │ │                               ││                               │                │
 │ │                     f. 3      ││      f. 4                ◢    │ ← róg do       │
 │ └───────────────────────────────┴┴───────────────────────────────┘   przewracania │
 └──────── znaki warunków na dolnej krawędzi: pióro · język · w ręku · szyfr ─────────┘
```

### Rozkładówki

1. **Karta tytułowa i spis treści** (zawsze pierwsza).
   - Lewa: ex libris (właściciel, język zapisu, kolor okładki), znaki warunków z podpisami oraz liczba zajętych foliałów, np. „3 z 4 zapisów”.
   - Prawa: spis treści. Każdy zapis ma sigil szkoły, nazwę, PM, pieczęć stanu i numer foliału. **Wolne miejsca** są pustymi liniami z napisem „— czyste karty —” i w Skryptorium służą jako cel upuszczenia.
2. **Rozkładówka zaklęcia** (jedna na zapis).
   - Lewa (karta iluminowana): nagłówek w stylu szkoły, sigil, nazwa, inicjał, PM w medalionie, Zasięg / Cel / Czas trwania jako trzy pola z ikonami, pieczęć stanu i nota („W księdze, niezapamiętane”).
   - Prawa (tekst): opis zaklęcia w dwóch rytmach (akapity, rubryki), a niżej pieczęcie akcji: **Rzuć**, **Splot** (4e), **Zapamiętaj**, **Na czat**, **Arkusz**, **Przepisz**.
   - Zbyt długi opis przechodzi na kolejną rozkładówkę („ciąg dalszy”), zamiast przewijać stronę. Licznik foliałów rośnie zgodnie z regułą stron (1 strona + 1 na każde 5 PM).
3. **Rozkładówka rytuału**: rytuał zajmuje całą księgę.
   - Lewa: **krąg rytualny** (diagram) z sigilem szkoły w środku. Wokół niego składniki, czas i warunki rytuału.
   - Prawa: kroki rytuału jako numerowane rubryki i opis.
   - Kolejne strony: ciąg dalszy tekstu.
4. **Strony zamknięte.**
   - Szyfr: strona pokryta pismem runicznym z kłódką. Postęp odczytu to rząd woskowych pieczęci (1 pieczęć = 1 PS).
   - Księga zakazana: strona przepasana łańcuchem z czaszką. Ostrzeżenie o ekspozycji na Zepsucie widać przed kliknięciem.
5. **Grzbietowa wstążka** na każdy zapis ma kolor szkoły, więc w zamkniętej księdze widać, co w niej jest.

### Nawigacja

- Rogi stron (zawinięty róg) i klawisze ← →, a Home wraca do spisu. Wstążki u góry przenoszą od razu do zapisu.
- Przewrócenie strony to animacja 3D kartki (do 250 ms), wyłączana przy `prefers-reduced-motion`.
- Wyszukiwarka zostaje jako lupa w spisie treści, ale przy 4 zapisach jest drugorzędna.
- Okno pamięta ostatnio otwartą rozkładówkę dla każdej księgi.

### Pojemność „4 zaklęcia albo 1 rytuał”

Widok pokazuje pojemność jako **zapisy** (sloty na wstążki i linie spisu), a nie abstrakcyjne strony. Reguła (zdecydowana 2026-11-15 i wdrożona w logice):

- Nowa księga zaklęć ma 4 zapisy (`slots: 4`). Rytuał wymaga pustej księgi i zajmuje wszystkie zapisy (`wholeBook` w typie wpisu). MG zmienia liczbę w trybie edycji albo czyści pole (bez limitu).
- Księgi sprzed tej zasady, zwoje i księgi receptur alchemicznych nie mają limitu zapisów. Limit stron (1 + 1 na 5 PM) działa obok, jeśli MG go ustawi.

## Styl graficzny szkół magii

Wspólna baza: pergamin, atrament orzechowy, pismo z czcionek systemu WFRP4e. Każda szkoła zmienia tylko **kolor atramentu rubryk**, **sigil**, **marginalia w rogach i nagłówku** oraz **jeden znak szczególny strony**. Tekst główny zawsze ma kontrast co najmniej 4.5:1.

| Szkoła | Atrament rubryk | Sigil (oryginalny) | Marginalia | Znak szczególny strony |
|---|---|---|---|---|
| Magia Prosta (Petty) | brąz orzechowy | iskra nad świecą | szkice na marginesie, kleksy | luźne notatki ołówkiem w rogu |
| Bez szkoły (Arcane) | granat | otwarty klucz | proste ramki | brak |
| Zwierząt | ochra, bursztyn | poroże | pnącza z kości i pazurów | zadrapania pazurem przy krawędzi |
| Śmierci | ametyst | klepsydra | kruki, kosy, wstęga żałobna | czarna obwódka żałobna strony |
| Ognia | cynober | trójjęzyczny płomień | iskry, żar | przypalone brzegi kartki |
| Niebios | lazur | półksiężyc i gwiazdy | gwiazdozbiory | siatka mapy nieba w tle |
| Metalu | złoto i ołów | młot na kowadle | symbole alchemiczne, nity | złocona linia rubryk |
| Życia | nefryt | kiełkujący liść | winorośl, liście dębu | zasuszony liść na marginesie |
| Światła | biel i złoto | słońce z promieniami | promienie, gloria | złocony inicjał |
| Cieni | szarość dymu | maska i welon | mgła, lustra | tekst lekko „rozmyty” (bez utraty kontrastu) |
| Guślarstwa (Hedgecraft) | oliwka, mech | sierp i jemioła | zioła, sznurek | przypięta gałązka |
| Czarownictwa (Witchcraft) | śliwka | kocioł | ścieg, węzły | szyty margines |
| Demonologii | krew na czerni | pęknięty krąg przywołania | łańcuchy, pieczęcie | strona z czarnym tłem rubryk |
| Nekromancji | kość i zieleń trupia | czaszka z ręką kośćca | kości, ziemia grobowa | plamy na kartce |
| Chaosu (Nurgle, Slaanesh, Tzeentch, Niepodzielny) | zieleń rdzy / róż / turkus / rdza | zniekształcone sigile bez symboli bogów | wykrzywione, „żywe” marginalia | falujące linie rubryk |
| Rytuał (każda szkoła) | atrament szkoły | krąg rytualny | runy na obwodzie | diagram kręgu na całej stronie |

Zasada oryginalności: żadnych znaków Kolegiów, bogów ani Chaosu z podręczników Games Workshop i Cubicle 7, w tym gwiazdy ośmioramiennej i komety dwuogoniastej. Sigile i marginalia to motywy historyczne: narzędzia, rośliny, zwierzęta, ciała niebieskie.

## Okno zwoju

Pionowy zwój z drewnianymi wałkami i gałkami, postrzępione brzegi i woskowa pieczęć szkoły na dole. Liczba zwojów to stos na pieczęci („× 3”). Ma ten sam styl szkoły co księga. **Czytaj i rzuć** jest główną pieczęcią.

## Skryptorium (tryb edycji)

Księga zostaje otwarta. Z prawej wysuwa się pulpit z kałamarzem, gdzie są: język zapisu, kolor okładki, warunki, liczba zapisów lub stron, szyfr i księga zakazana. Wolne linie spisu treści podświetlają się przy przeciąganiu zaklęcia. Kolejność zapisów zmienia się przeciąganiem wstążek albo strzałkami. Usunięcie zapisu to przekreślenie z potwierdzeniem.

## Czat

Karta zaklęcia ma wygląd wyrwanej strony księgi. Na niej sigil szkoły, PM w medalionie, Zasięg, Cel i Czas trwania z ikonami, opis oraz stopka z nazwą księgi, a kolor rubryk zależy od szkoły.

## Zasady UX

- Najczęstsza czynność (rzucenie zaklęcia z księgi) to dwa kliknięcia: wstążka, potem **Rzuć**.
- Stan nigdy nie jest tylko kolorem: pieczęć ma ikonę i podpis.
- Wszystko działa z klawiatury: strzałki stron, Tab po akcjach, Enter na wstążkach.
- Gracz bez uprawnień nie widzi przycisku Skryptorium.
- Wpisy innych modułów (np. receptury *Old World Alchemy*) dostają tę samą rozkładówkę z własnym sigilem. Kontrakt typu wpisu dostaje opcjonalne pola `glyph` i `style`, a gdy ich brak, zostaje ikona Font Awesome.

## Technika

- Sprite SVG `assets/ui/sprite.svg` i pomocnik `{{gmIcon "lore-fire"}}`. Kolor z CSS (`currentColor`), więc jeden sigil służy każdej szkole.
- Motywy szkół przez `data-lore` na rozkładówce i zmienne CSS (`--lore-ink`, `--lore-wash`, marginalia jako `<use>`).
- Paginacja liczona w kodzie widoku: rozkładówki = spis + zapisy (+ ciąg dalszy, gdy tekst nie mieści się). Mierzymy wysokość opisu po renderze i dzielimy akapity między strony.
- Przełącznik w ustawieniach klienta: „Wygląd ksiąg: Iluminowany / klasyczny”. Klasyczny zostaje do czasu pełnego pokrycia.
- Logika bez zmian (akcje `data-action`, typy wpisów, reguły ksiąg), więc testy dalej obowiązują.
- Czcionki z `systems/wfrp4e/fonts`, pergamin z `systems/wfrp4e/ui`.

## Assety

Szczegóły i listy: `ART-BIBLE.md`. Grupy:

| Grupa | Liczba | Kto wykonuje |
|---|---|---|
| Sigile szkół i rodzajów wpisów (`lores/`) | 20 | Sonnet (agent A) |
| Ikony interfejsu (`interface/`) | 36 | Sonnet (agent B) |
| Ornamenty księgi i zwoju (`ornaments/`) | 20 | Opus (agent C) |
| Marginalia szkół (`marginalia/`) | 16 | Opus (agent D) |
| Walidator, sprite, galeria (`tools/build-ui-assets.mjs`) | 1 | przeniesione z Underworld |

## Stan assetów (etap 1)

- **Gotowe:** 92 pliki SVG w `assets/ui/` (20 sigili, 36 ikon interfejsu, 20 ornamentów, 16 marginaliów), sprite `assets/ui/sprite.svg` (92 symbole) i galeria `assets/ui/preview.html`. Podgląd w `docs/ui/podglad/`.
- **Kontrola:** `node tools/build-ui-assets.mjs` sprawdza reguły biblii stylu i buduje sprite oraz galerię; obecnie 0 błędów. Narzędzie nie trafia do module.zip.
- **Kto co robił:** sigile i ikony Sonnet (po jednej rundzie poprawek od dyrektora artystycznego; `new_scroll` i `status_unmemorized` przerysowane ręcznie), ornamenty i marginalia Opus (bez poprawek).
- **Uwagi do CSS:** marginalia odbijamy lustrzanie osobno w poziomie i w pionie (`scale(-1, 1)`, `scale(1, -1)`), nie obrotem o 180°, bo czaszka, kocioł i klepsydra stanęłyby do góry nogami. `deckle_edge` i `scroll_edge` są pełne u dołu; dla górnej krawędzi odbijamy je w pionie. Narożnik ramki strony (`page_frame_corner`) wychodzi liniami poza prawą i dolną krawędź, więc łączy się z ramką z CSS. Środek `cn_medallion` jest półprzezroczysty pod ciemną cyfrę. Ikona `status_unreadable` ma `clipPath` o unikalnym id `gr-unreadable-clip`.
- **Do obserwacji w użyciu:** `undivided` i `tzeentch` są abstrakcyjne; gałązka w `hedgecraft` w 20 px to kilka kropek (sierp wystarcza).

## Etapy wdrożenia

1. **Assety** (zrobiony 2026-11-15): sigile, ikony, ornamenty, marginalia, sprite i galeria.
2. **Fundament stylu** (zrobiony 2026-11-15, sprawdzony w DEV-test): ustawienie klienta `bookStyle`, pomocnik `{{grIcon}}` i mapy ikon w `scripts/ui.mjs`, `styles/illuminated.css` (dołączony `@import` z głównego CSS), okładka z tłoczeniem, okuciami i klamrą, pergamin z postrzępionymi brzegami, motywy 18 szkół przez `data-lore` (kontrast ≥ 4.5:1), marginalia i sigil na stronie wpisu, gałki wałków zwoju. Strony nieczytelne i zaszyfrowane mają neutralny motyw `arcane`.
3. **Księga ze stronami** (zrobiony 2026-11-15, sprawdzony w DEV-test): szablon `templates/parts/book-illuminated.hbs`; karta tytułowa i spis treści (prowadnice, foliały, „czyste karty” przy limicie zapisów), rozkładówka na wpis (medalion PM, parametry z ikonami, tekst dzielony na karty kolumnami CSS z licznikiem), rogi stron, wstążki pod kartami, klawisze ← → PageUp PageDown Home z fokusem przenoszonym na nową rozkładówkę, pamięć ostatniej rozkładówki na sesję, animacja kartki wyłączana przy `prefers-reduced-motion`. Wygląd klasyczny bez zmian.
4. **Style szkół i rytuał** (zrobiony 2026-11-15, sprawdzony w DEV-test na 14 szkołach i rytuale „Spirit-Bonding Ritual”): inicjał w podwójnej ramce i znak wodny sigilu na stronie tekstu; znaki szczególne jako warstwa `::after` strony (CSS, bez nowych assetów, Życie i Guślarstwo przez maskę z pliku sigilu); rytuał z kręgiem `orn-ritual_circle`, PM na obwodzie, rubrykami numerowanymi rzymsko i podwójną ramką. Na małym oknie lewa strona przewija się cienkim paskiem.
5. **Strony zamknięte, Skryptorium, zwój, czat** (zrobiony 2026-11-15, sprawdzony w DEV-test): `lockState` i `cipher` w danych strony; szyfr jako runy (`runes_tile`), szyld zamka i pieczęcie postępu; księga zakazana z dwoma łańcuchami i pieczęcią; pulpit edycji z kałamarzem, klasa `gr-dropping` przy przeciąganiu; pieczęć zwoju; karta czatu z `data-gr-glyph` (ikony dokłada hook `renderChatMessageHTML`, bo sanitizer wycina SVG) i klasą `body.gr-illuminated-chat` zależną od ustawienia oglądającego. Pulpit zostaje paskiem nad księgą, nie wysuwaną szufladą z boku.
6. **Szlif** (zrobiony 2026-11-15, sprawdzony w DEV-test): `applyAccessibility` w `scripts/ui.mjs` (Enter i Spacja na elementach `[data-action]`, etykiety ARIA przycisków i znaczników z samą ikoną), `aria-current` na aktywnej wstążce, audyt kontrastu skryptem w przeglądarce na 15 rozkładówkach (0 wyników poniżej 4.5:1), zrzuty w `docs/screenshots/` i w README. Uwaga: przy bardzo jasnym kolorze okładki złoty tytuł traci kontrast (ma tylko cień).
