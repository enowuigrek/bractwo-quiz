# Bractwo Piwne: design system

Źródła:
- https://bractwopiwne.pl: strona główna (WordPress + Divi). Tylko wideo z piwem na pełnym ekranie, białe logo i przycisk „KONTAKT” z obrysem. Kolory Divi (`#2ea3f2`, `#666`) to ustawienia domyślne motywu, a nie marka, więc ich nie przenosimy.
- https://bractwopiwne.pl/szable/szable.html: aplikacja „Szable Kręgu Częstochowa”. Tu jest prawdziwy język wizualny, więc system opiera się na niej.
- Baner jubileuszowy (stopka / papier firmowy, 2025). Z niego są: zasady użycia logo, krój nagłówków wydarzeń, motyw chmielu i dane stałe.

Tokeny w kodzie: [tokens.css](tokens.css)

## Charakter

Ciemna karczma przy świecach. Czarne tło, kremowy tekst jak piana, złoto jak kufel w świetle, ilustracje w stylu starych rycin (anioł i diabeł z kuflami, postacie stopni). Ton jest szlachecko‑sarmacki i z przymrużeniem oka: „szable”, „Krąg”, „Kasztelan Chmielny”, „Podczaszy Koronny”. Zamiast cieni jest złoty blask.

## Marka (stałe)

- Pełna nazwa: **Bractwo Piwne – Towarzystwo Promocji Kultury Piwa**
- Rok założenia: **1995**; w 2025 jubileusz 30‑lecia
- Hasło: „Piwu Cześć!”
- Kontakt: www.bractwopiwne.pl · facebook.com/BractwoPiwne1995 · kontakt@bractwopiwne.pl (główny), lodz@bractwopiwne.pl (Łódź)

## Logo

- Okrągła plakietka w kształcie kapsla z ząbkami. W środku skrzyżowane otwieracze (jak szable), na łuku u góry „Towarzystwo Promocji”, u dołu „Kultury Piwa”, a przez środek pas z napisem BRACTWO PIWNE.
- Na ciemnym tle logo jest zawsze białe. Na Szablach białą wersję robi `filter: invert(1)` na czarnym pliku.
- Nie kolorujemy logo na złoto ani zielono i nie dajemy mu blasku. Akcent stawiamy obok logo, nie na nim.
- Wokół logo zostawiamy minimum wysokość jego pasa z napisem.
- Logo stoi z lewej (baner) albo na środku (strona główna, nagłówek Szabli).

## Kolory

| Token | Hex | Do czego |
|---|---|---|
| `--bg` | `#000000` | tło strony, zawsze czysta czerń |
| `--kamien` | `#1a2129` | karty, akordeon, tor paska postępu |
| `--kamien2` | `#27313b` | obrysy, linie podziału, obrys przycisku |
| `--pole` | `#0b0f13` | tło inputów |
| `--piana` | `#f4ecd8` | tekst główny (kremowy, nigdy `#fff`) |
| `--szary` | `#9aa4ad` | tekst pomocniczy, stopnie jeszcze nieosiągnięte |
| `--zloto` | `#e3ac3f` | główny akcent: stopień, jednostki, linki, focus, górna linia listy |
| `--bursztyn` | `#c8711d` | początek gradientu postępu |
| `--chmiel` | `#8fb63a` | sukces, „Będę”, ✓ |
| `--chmiel-ciemny` | `#4c7420` | obrys przycisku pozytywnego w spoczynku |
| `--karczma` → `--karczma-dno` | `#4a1010` → `#200606` | panel karczmarki (bordowy gradient) |

Gradienty:
- Postęp: `linear-gradient(90deg, #c8711d, #e3ac3f 70%, #f3d27a)`
- Złoty przycisk: `linear-gradient(180deg, #f0c35a, #e3ac3f)` z tekstem `#2a1a00`
- Tło ekranu awansu: `radial-gradient(circle at 50% 38%, #3a2606, #120b02 45%, #000 75%)`

Grafiki drukowane i banery (z jubileuszu):
- `--grafit` `#141414`: tło banerów, mniej „cyfrowe” niż czysta czerń
- `--grafit-liscie` `#262626`: duże, ukośne kształty liści chmielu w tle, ledwo widoczne (ton na tonie)
- `--chmiel-szyszka` `#7a9a3c`: realistyczna, zielona szyszka chmielu jako motyw ilustracyjny

Zasada: złoto to jedyny akcent „wow”. Zieleń chmielu tylko dla potwierdzeń, bordo tylko dla karczmarki.

## Typografia

**Open Sans** w wagach 400, 600 i 800 to krój podstawowy. Hierarchię robi waga 800, a nie rozmiar.

**Nagłówki wydarzeń i jubileuszy** (z banera) składamy krojem zwężonym: **Open Sans Condensed 700** (Google Fonts: `Open Sans` w osi `wdth` 75), WERSALIKAMI, białym albo w kolorze piany. Dopisek obok, np. „w 2025 r.”, jest zwykłą wagą i małymi literami, na tej samej linii bazowej. Pod spodem idzie podtytuł 13–14px, np. „Rok założenia: 1995”.

Na banerze dane kontaktowe są składane małym (11–12px), regularnym tekstem w kolorze piany lub bieli, w kolumnie wyrównanej do lewej, z interlinią ~1.35.

| Rola | Rozmiar / waga | Uwagi |
|---|---|---|
| Liczba (kapsel) | 74 / 800 | `letter-spacing: -0.03em`, `line-height: 1` |
| Stopień (awans) | 30 / 800 | WERSALIKI, złoto |
| H1 | 26 / 800 | `-0.01em` |
| Stopień | 24 / 800 | WERSALIKI, złoto, `line-height: 1.15` |
| H3 (panel) | 21 / 800 | złoto |
| Przycisk | 18 / 800 | |
| Body / H2 | 17 / 400 · 800 | `line-height: 1.45` |
| Pomocniczy | 15 / 400 · 600 | szary; podpis kręgu 15/800 złoty |
| Drobny | 14, 13, 11 | stopka, progi, jednostka w medalu |

## Siatka i odstępy

- Kolumna treści ma `max-width: 420px` i padding `22px 22px 48px`. Projekt jest mobile‑first i nigdy nie rozlewa się szerzej.
- Nagłówek ma `max-width: 640px` i proporcje 8:3: anioł po lewej, logo w środku, diabeł po prawej.
- Odstęp między sekcjami: 34px. Wewnątrz kart: 18px. Wiersze listy: 11–12px w pionie.
- Uwzględnione `env(safe-area-inset-*)`.

## Promienie

Zmienione 19.10 i jeszcze raz 22.10 na prośbę Łukasza: duże zaokrąglenia z Szabli wyglądały zabawkowo. Ramki i pola mają być prawie kanciaste, a zaokrąglone zostają tylko przyciski i drobne znaczki.

| Token | Wartość | Do czego |
|---|---|---|
| `--r-card` | 6 | karty, panele, okna |
| `--r-pole` | 4 | pola formularzy, kafelki, kafelki odpowiedzi, grafiki, ramki linków |
| `--r-btn`, `--r-btn-sm` | 999 | przyciski: pigułki, pełne półkola po bokach |
| `--r-pill` | 999 | pasek postępu, znaczki, nicki |
| `--r-round` | 50% | medal, kółka z literami |

Karty do wyboru (np. szablony nowego quizu) to karty, więc `--r-card`, a nie pigułki: duże ramki z `999px` wyglądały jak zabawkowe kapsuły (poprawka 23.10).

**Wybrana opcja to wypełnienie kolorem, nie poświata** (Łukasz, 25.10). Wybrana karta (szablon quizu) albo pigułka (czas na odpowiedź) dostaje złote wypełnienie jak złoty przycisk (gradient `--zloto-jasne` → `--zloto`), a cały tekst na niej `--na-zlocie`. Niewybrane zostają na `--kamien`/`--kamien2`. Sama złota obwódka z `--glow-md` za słabo odróżniała wybór.

## Przyciski (Bractwo Quiz)

Pigułki **wypełnione kolorem zależnym od rodzaju**, bez samych obramówek:
- zwykły: tło `--kamien2`, po najechaniu `--kamien3`, tekst piana,
- `.zloty` (główna akcja): złoty gradient, tekst `--na-zlocie`,
- `.pozytywny`: `--chmiel`, tekst `--na-chmielu`,
- `.niebezpieczny` (usuń, zakończ): `--czerwien-tlo` `#7c2a1c`, tekst piana,
- `.ikona`: okrągły przycisk z samą ikoną (kosz, strzałki), 40×40,
- `.przycisk-cichy`: sam tekst, dla akcji pobocznych.
Kafelki odpowiedzi w grze (A–F) to nie przyciski w tym sensie: mają `--r-pole`, bo tekst bywa wielowierszowy.

**Plakietki stanu na TV (np. „Gotowi x/y”):** na górze pośrodku sceny, nie w dolnych rogach (tam bywają podpisy demo i przyciski etapu).

**Nazwa z ikoną (TV):** tekst zawsze od lewej, w jednej linii z resztą tekstu, ikona za nazwą po prawej (plansza etapu, od 25.10).

**Akcje to przyciski, nie napisy do klikania** (Łukasz, 25.10). Przejście do innej strony też dostaje wygląd przycisku (`<Link className="przycisk">`, np. „Panel obsługi” w pilocie, po grze złoty, „Wpisz inny kod” na telefonie). Tekstowe linki zostają tylko tam, gdzie to nawigacja „← wstecz” w panelu albo podpis autora.

**Pilot (Quiz).** Przyciski akcji zawsze od razu pod nagłówkiem, nad kartą pytania, odpowiedziami i listą graczy, żeby nie uciekały w dół, gdy lista rośnie. „Zakończ grę” (niebezpieczny) osobno na samym dole strony, z dala od zwykłych akcji.

**Nagłówek telefonu (Quiz).** Sam znak Quizu, bez kodu gry (od 24.10): kod jest wewnętrzny, gracz wchodzi z QR. Kod zostaje tam, gdzie jest potrzebny: na TV pod QR („Bez skanowania”), w pilocie, w panelu i na karcie nagrody jako dowód dla obsługi.

**Koniec gry na telefonie (Quiz).** Jeden złoty przycisk „Pobierz grafikę na pamiątkę” na całą szerokość, napis w jednym wierszu (grafika 1080×1920), pod nim konta do oznaczenia z „Kopiuj”. Bez osobnego „Udostępnij wynik” (od 24.10), ale przycisk otwiera systemowe udostępnianie: na iPhonie tylko tak obraz trafia do Zdjęć („Zapisz obraz”), zwykłe pobranie ląduje w Plikach. Na komputerze pobiera plik.

## Linki do skopiowania

Ramka `--pole` z obrysem `--kamien2`, krój o stałej szerokości. Kliknięcie w link otwiera go w nowej karcie, ikona po prawej kopiuje. Na telefonie przytrzymanie palcem na linku też kopiuje. Po skopiowaniu na dole wyskakuje zielony dymek „Skopiowano link”.

## Panel admina: dwa układy

- **Mobilny** (< 960px): kolumna do 640px, logo i „Wyloguj” u góry, nawigacja pod spodem.
- **Desktopowy** (≥ 960px): stała szerokość 1120px, logo, nawigacja i „Wyloguj” w jednym pasku. Strony mogą mieć dwie kolumny (`.uklad-dwa`, np. gra: dane i akcje po lewej, pilot i linki po prawej). Formularze zostają węższe (do 640px), a duże przyciski mają szerokość według treści.
- **Szerokość nie zależy od treści.** Pasek przewijania ma zarezerwowane miejsce (`scrollbar-gutter: stable`), więc strona nie skacze, gdy treść się wydłuża.

## Komponenty

**Okno potwierdzenia (Quiz).** Zamiast okien przeglądarki (`confirm`). Wyśrodkowany natywny `<dialog>`, max 440px, tło `--kamien`, obrys 1px w `--kamien2`, radius `--r-card`, cień `--shadow-panel`, tło pod spodem przyciemnione do 75%. Pytanie 17/600, pod nim dwa przyciski obok siebie: „Anuluj” (zwykły, zaznaczony na start, żeby Enter niczego nie usunął) i akcja (niebezpieczny przy usuwaniu i kończeniu, złoty przy pozostałych). Esc i kliknięcie obok zamykają bez akcji. Wjazd 0.25s z lekkim powiększeniem.

**Podpis ikony (Quiz).** Przyciski z samą ikoną (ołówek, kosz, strzałki) mają `data-podpis="Edytuj"`. Po najechaniu albo fokusie z klawiatury nad przyciskiem pojawia się dymek: 13/600, tło `--kamien3`, obrys `--kamien2`, radius `--r-pole`. Zamiast atrybutu `title`, bo systemowy dymek nie pasuje do wyglądu.

**Fanfara podium (Quiz).** Konfetti w kolorach złoto, złoto jasne, blask, piana, chmiel, bursztyn. Medale na telefonie: 160 px, kolor `--zloto` / `--srebro` / `--braz` z jasnym refleksem, wjazd z obrotem 1 s (`--ease-wjazd`). Przed odsłoną trzy skaczące złote kropki i pulsujący napis „Werble…”.

**Werble po finale (Quiz, `components/werble.tsx`).** Ekran gaśnie jak wyłączany telewizor: biały błysk zapada się w poziomą kreskę i punkt (0.9 s), potem czerń, a po 1.8 s przez 3 s wolno wchodzi „Werble…” złotem z poświatą i podpisem „Wynik za chwilę.”, nad nim trzy złote kropki skaczące na zmianę (18 px na telefonie, 38 px na TV). Zwykły bęben w SVG był za brzydki, kropki zostały. Na telefonie błysk nie dotyka górnej i dolnej krawędzi (18% od każdej), bo Safari bierze kolor pasków przeglądarki z krawędzi strony i po białym błysku zostawały jasne paski. Ten sam ciemny ekran pokazuje się od razu, gdy gracz skończy serię (w pijanym finale czeka sam pasek, a werble przychodzą wszystkim naraz), i trwa dalej po „Pokaż podium” aż do odsłony miejsca (`dalej`: bez błysku i bez wejścia). Nie ma osobnej planszy przed odsłoną.

**Szklanka piwa (Quiz, `components/szklanka-piwa.tsx`).** Grafika `public/grafiki/szklanka.webp`. Pusta szklanka to blady zarys tej samej grafiki (szarość, 16%), z brzegiem jako jasna elipsa i mgiełką szkła w jej tylnej połowie. Piwo rośnie od dna, a na nim leży piana: elipsa od ścianki do ścianki (powierzchnia lekko z góry), jaśniejszy wierzch z pęcherzykami i cienka warstwa piany pod nim. Pełna szklanka ma czapę piany z grafiki. Bąbelki unoszą się tylko w nalanym piwie. Bez `clip-path` (TV Samsunga go nie stosuje).

**Prawda / fałsz w serii (Quiz).** Dwa płaskie koła pod kciuki, `min(40vw, 160px)`: `--chmiel` z czarnym ✓ i `--czerwien` z czarnym ✗, bez ramek i bez napisów (napis tylko w `aria-label`), lekki cień pod spodem. Pytanie ma zawsze miejsce na trzy linie, więc koła nie skaczą. Te same koła są w demo na planszy finału na TV (`.demo-kolo`). Poza serią prawda/fałsz to dwa wysokie kafle z ramką i napisem.

**Utrudnienia w finale (Quiz).** Od połowy pytań serii każde pytanie inaczej: drżenie (0.14 s), zamiana kół miejscami, mgła (rozmycie do 4 px), dryf na boki (±16 px), zanikanie (do 12%), uciekające koła, kołysanie (±4°). **Bez zapowiedzi:** nigdzie nie piszemy „utrudnienie”, ani w pasku, ani na planszy finału. Dziwne rzeczy mają się po prostu dziać.

**Liczby pytań (Quiz).** Gracze i TV widzą sam numer („Pytanie 8”), bez sumy („8/31”) i bez „jeszcze N pytań” pod szklanką; sumę widzi tylko pilot. Wyjątek to seria finału na telefonie („Seria · pytanie 3/14”), bo pijany finał ciągnie tę numerację dalej (15/14).

**Pijany finał (Quiz, ukryty tryb).** Gracze nie mogą się zorientować, że to dogrywka: na telefonie i TV nigdy nie piszemy „pijany finał”, zostaje wygląd serii (nagłówek, pasek, koła), tylko coraz bardziej się psuje.
- Telefon: cały ekran faluje (`skewX` + `translateX` + `rotate`, rośnie z `--poziom` 0..1 co pytanie), a każde pytanie ma swój przeszkadzacz: drżenie, zamienione kolory kół, koła jedno nad drugim, mgła, uciekające koła, pytanie do góry nogami, „Fałsz” znika i „Prawda” klika się sama, „wszystko naraz” (koła obok siebie na zmianę rosną do 122% i tracą ostrość, kolory zamienione, pytanie drży). Zegar wariuje jak na TV.
- TV: ten sam nagłówek co w serii, ale cały kołysze się coraz mocniej i delikatnie traci ostrość. Zegar najpierw liczy w dół, potem w górę, potem zmienia kierunek, a pod koniec miga przypadkowymi liczbami i znika (`visibility: hidden`, żeby nagłówek nie skakał). Awatary po 8 s powoli cofają się od szklanki, w 30. sekundzie (połowa dogrywki) drogi po kolei spadają w dół ekranu (każda 3 s, z przechyłem), od 36. awatary latają jak wygaszacz DVD: drżą, pulsują (do +50%), widzą podwójnie (blady drugi awatar obok) i lekko się rozmywają. Szklanka stoi nieruchomo i ostro (pod koniec podmienia ją wideo pękającej szklanki, `.pijany-wideo`, którego pierwsza klatka to ta sama szklanka w tym samym miejscu), a plansza nie faluje. Na wejściu ekran kilka razy nierówno gaśnie. W chwili wybuchu w wideo interfejs się rozpada: nagłówek wylatuje w górę, awatary odlatują od szklanki i kręcą się. Rozmycie tylko na małych elementach, nigdy na całej planszy (Samsung).
- Reakcja po odpowiedzi (od 24.10): błysk tła w losowym kolorze (zielony albo czerwony, tu nic nie jest dobre ani złe), wybrany przycisk pulsuje albo się trzęsie, powtarzając ruch co 0,45 s, a czasem na środku ekranu wyskakuje komentarz: kremowy, czarny krój, z cieniem, pojawia się i znika (bez obrotów i przelotu). Długość rośnie z czasem dogrywki: 1 s → 3,5 s, przyciski stoją wtedy zablokowane.
- Koniec: 5,5 s przed końcem telefon gaśnie z tym samym błyskiem co werble, ale bez napisu (żeby spojrzeć na TV); napis werbli wchodzi dopiero w fazie werbli, bez drugiego błysku. Na TV po wybuchu szklanki werble też bez błysku: ekran jest już ciemny po wideo.
- Przy ograniczonym ruchu: same zamiany kolorów i układu, bez falowania i latania.

**Muzyka na TV (Quiz).** Instrumentalna, w tle, głośność 0,55, przenikanie 1,5 s. Jedyny napis o dźwięku to prośba o zgodę na dole sceny (`.tv-muzyka-podpowiedz`), tylko w poczekalni: złota pigułka, znika, gdy muzyka zagra. W trakcie quizu żadnych napisów, najwyżej cisza. W pijanym finale muzyka psuje się razem z obrazem (zwalnia, faluje, ma dziury) i urywa się w chwili wybuchu szklanki, bez żadnego komunikatu. Werble zaczynają się od nagłej ciszy.

**Finał jako wyścig (Quiz).** Na TV finaliści od startu stoją na drogach w różnych miejscach (przewaga 0–3 z 12 kroków), każdy krok to dobra odpowiedź; nigdzie nie ma liczby pytań. Pod koniec klipu wybuchu obraz zjeżdża w dół (1,1 s), jakby piana spłynęła.

**Ocena w finale serią (Quiz).** Po odpowiedzi finalisty: błysk tła (radialny, `--chmiel` albo `--czerwien` 45%), wybrany przycisk pulsuje (dobrze, do 112%) albo trzęsie się na boki (źle, ±9 px). 0,4 s, od połowy serii (utrudnienia) coraz dłużej, do 1 s. Na TV awatar finalisty podskakuje z zieloną poświatą albo trzęsie się z czerwoną (0,9 s).

**Okrzyki kibiców (Quiz).** Hasło z awatarem finalisty w miejscu kropek (`components/haslo-kibica.tsx`, hasła w `lib/gra/okrzyki.ts`): „Dawaj [awatar]!”, „[awatar], piwo czeka!”. Na telefonie kibica wybór finalisty (awatary) i przyciski z hasłami; na TV dymek nad drogą finalisty z nickiem kibica, unosi się i znika po 3,5 s, a pod nickiem finalisty licznik 📣, który podskakuje przy każdym okrzyku.

**Pieczątka „Odebrana” (Quiz).** Na karcie nagrody po odbiorze: `--czerwien`, podwójna ramka (4 px + wewnętrzna 2 px), obrót −7°, przetarcia z maski szumu SVG (`feTurbulence`), wjazd jak odbicie (od skali 1.8).

**Nastroje etapów na TV (Quiz).** Tło idzie za muzyką: poczekalnia ciepła (złote świece i smugi), etapy 1–3 noir (ukośne cienie żaluzji w lewym górnym rogu, smugi przesunięte w chłodny błękit, przygaszone świece), etap 3 z czerwonym neonem z prawej (mruga co kilka sekund), walka o finał z ciemnoczerwoną winietą bijącą jak serce (1,6 s), podium jaśniejsze. Finał bez dodatków (wideo wybuchu w trybie `screen`). Wszystko bardzo słabe, tekst ma pierwszeństwo.

**Nagłówek poczekalni (Quiz).** Gospodarze obok siebie, tej samej wysokości: logo lokalu, cienka złota kreska, logo Bractwa (× logo browaru przy kranoprzejęciu). Nazwy lokalu nie powtarzamy obok logo.

**Odpadanie (Quiz).** Kreska odcięcia jak strefa finału: złota przerywana linia pod ostatnim, kto gra dalej, z napisem „▲ N najlepszych gra dalej ▲” (wyścig) albo złote podkreślenie wiersza (tabela). Telefon odpadniętego: nick z awatarem, „Odpadasz po N. etapie”, miejsce i spokojne „Dzięki za walkę! Patrz na telewizor i kibicuj.” bez czerwieni (to nie kara). Pilot: karta „Odpadanie przed finałem”, przy każdym etapie − / + i złota liczba („wszyscy” albo „zostaje N”). Pod kreską: wiersz przygaszony (72%), miejsce `--czerwien`. Przeskok kreski: pigułka przy nicku, „▲ nad kreską” `--chmiel` z poświatą albo „▼ pod kreską” `--czerwien-tlo`, wskakuje (skala 0,4 → 1,15 → 1) po jeździe awatarów. Na drodze etapów pod kropką „✂ N” w `--czerwien`.

**Przełącznik (panel Quiz).** Ustawienia tak/nie (widoczność „tylko dla mnie”, pijany finał, seria i finał trójki w etapie, odsłaniana grafika, usunięcie grafiki) to przełącznik, nie checkbox: szyna 44×24 px z gałką 18 px, wyłączony `--kamien2` z obrysem `--kamien3` i szarą gałką, włączony złoty (`--zloto`) z gałką `--na-zlocie` przesuniętą w prawo, 0,18 s. Focus: złota obwódka 2 px. Klasy `.przelacznik` (sam napis obok) i `.pole-wyboru` (pogrubiona nazwa i opis w kilku liniach). Zaznaczanie poprawnych odpowiedzi w edytorze pytań zostaje zwykłym checkboxem, bo to wybór z listy, a nie ustawienie.

**Pole z błędem (Quiz).** Ramka w `--czerwien` (np. powtórzona odpowiedź), a pod polem komunikat `.blad`.

**Nagłówek z animacją.** Anioł i diabeł wjeżdżają z centrum na boki, logo pojawia się ze `scale(.92)`. Całość trwa 2.8s, krzywa `cubic-bezier(.4,0,.2,1)`. Logo jest białe (`filter: invert(1)` + `mix-blend-mode: screen`).

**Kapsel.** Okrągły kapsel w SVG ze złotym blaskiem `0 0 22px rgba(227,172,63,.28)`. W środku duża liczba w kolorze piany i jednostka złotem („szable”).

**Postać + medal.** Ilustracja stopnia z blaskiem, a w prawym dolnym rogu medal 112px z liczbą.

**Drabina stopni.** Lista z górną linią 3px w złocie i separatorami 1px w `--kamien2`. Stany:
- nieosiągnięty: szary tekst, miniatura w grayscale z `opacity: .45`
- `.ma` (zdobyty): tekst w kolorze piany, zielony ✓ przy progu
- `.teraz` (obecny): złoto, waga 800, większa miniatura (52px) z blaskiem
- `.postep`: pasek 12px z gradientem bursztyn→złoto i podpisem „Jeszcze **1** szabla do awansu”

**Karta (`.spotkanie`).** Tło `--kamien`, obrys 1px w `--kamien2`, radius 18, padding 18. Tytuł 17/800, miejsce jako złoty link 15/600.

**Przyciski (Szable, oryginał; w Quizie patrz „Przyciski” wyżej).** Pełna szerokość, 18/800, padding 15, radius 12, obrys 2px.
- domyślny: przezroczysty z obrysem `--kamien2`
- pozytywny („Będę”): obrys `--chmiel-ciemny`, po wybraniu tło i obrys `--chmiel` z ciemnym tekstem
- negatywny po wybraniu: tło `--kamien2`, obrys szary
- `.zloty` (główne CTA): gradient złoty
- disabled: `opacity: .5`
- focus: `outline: 3px solid --zloto; offset 3px`

**Input.** 19px, padding 14, radius 4 (`--r-pole`), obrys 2px w `--kamien2`, tło `#0b0f13`.

**Akordeon (`details.zasady`).** Wygląda jak karta. Strzałka to złoty chevron z obramowań 3px, obracany przy otwarciu. Wiersze mają nazwę (piana, bold), opis (szary, 14) i wartość po prawej (złoto, 17/800).

**Ekran awansu.** Fullscreen z radialnym bursztynowym gradientem. Postać wjeżdża animacją `translateY(40px) scale(.7)` → `none` (1s, `--ease-wjazd`) z dużym blaskiem 40px.

**Karczmarka (toast od dołu).** Przyklejona do dołu, max 420px. Bordowy gradient, złoty obrys 2px, radius 18. Ilustracja wystaje z lewej strony panelu (padding‑left 132px). Wjeżdża z dołu po 0.8s. Ma dwa przyciski 14px i trzeci, „Później”, bez obrysu.

**Stopka.** Wyśrodkowana, 13px, szara, logo 96px z `opacity: .55`, podpis autora.

**Przycisk z obrysem (strona główna).** Biały obrys 2px, radius 3, Open Sans 20/500, padding 6×20, przezroczyste tło na wideo.

## Ruch

- Wjazdy: `cubic-bezier(.2,.9,.25,1.1)`, z lekkim przestrzeleniem.
- Wszystkie animacje mają wyłączenie w `prefers-reduced-motion: reduce`.
- Tło ekranów TV (Quiz) nie jest martwą czernią: na czarnym `--bg` bardzo wolno dryfują trzy ciepłe plamy światła jak od świec (złoto 11%, bursztyn 7%, 70–110 s) i trzy szerokie smugi światła z góry, które kołyszą się i wędrują przez ekran. Bąbelki są tylko w szklance wyścigu. Tylko transformacje i przezroczystość, tekst zawsze czytelny. W werblach tło gaśnie do czerni.
- Logo Bractwa na ekranach gry TV jest w nagłówku po prawej (76 px), nie w rogu sceny.

**Baner / stopka maila.** Proporcje ok. 5:2. Tło grafitowe z ukośnymi liśćmi chmielu ton na tonie. Białe logo u góry z lewej, kolumna kontaktów u góry z prawej, szyszka chmielu w prawym dolnym rogu, która wychodzi poza kadr. Nagłówek jubileuszowy (zwężony) siedzi u dołu z lewej. Złota tu nie ma: na grafikach drukowanych marka jest monochromatyczna, a jedynym kolorem jest zieleń chmielu.

## Ilustracje

Rycinowe, ciepłe sepie, czerwienie i ochra na czystej czerni (PNG z przezroczystością). Każdy stopień ma swoją postać, od „Piwnej Gołoty” (nędzarz z kubkiem i śmiercią) po „Kawalera Złotego Kufla”. Na tle zawsze daje się złoty blask, nigdy cień.

Drugi rodzaj to realistyczny chmiel (szyszka, liście). Używamy go w materiałach oficjalnych i banerach, a ryciny zostawiamy na Krąg i Szable.

Dwa rejestry marki:
- **Oficjalny** (strona główna, banery, druki, papier firmowy): grafit, biel, zieleń chmielu, krój zwężony, bez żartu.
- **Kręgowy** (Szable, wydarzenia, gamifikacja): czerń, piana, złoto, ryciny, sarmacki humor.
Wspólne dla obu: Open Sans, białe logo na ciemnym tle i zawsze ciemny motyw.

## Słownik stopni (treść)

Piwna Gołota (start) → Zaściankowy Piwosz (4) → Pan na Karczmie (12) → Szlachcic Słodowy (30) → Kasztelan Chmielny (50) → Podczaszy Koronny (75) → Kawaler Złotego Kufla (100).


**Ikony zamiast emotek (25.10).** W interfejsie (panel, pilot, telefon, TV) ikony liniowe SVG 24×24 w `currentColor`, kreska 2, zaokrąglone końce, wszystkie w jednym pliku `src/components/ikony.tsx` (m.in. kosz, edytuj, kopiuj, głośnik, automat, dobrze, puchar, uwaga, aparat, kłódka, megafon). Domyślnie mają wielkość tekstu (`:where(.ikona-svg)` w `globals.css`), a rozmiar z miejsca (np. `.pilot-przelacznik svg`) zawsze wygrywa. Emotki tylko tam, gdzie są treścią (hasła kibiców). Znaki ✓ ✗ ✕ ✂ to typografia, nie emotki, i zostają.

**Dopasowanie do ekranu TV (25.10).** Ekrany z listą o zmiennej długości same się zagęszczają, gdy treść nie mieści się na scenie 1920×1080: stopień startowy z liczby elementów, a po narysowaniu pomiar (`useLayoutEffect`) i w razie potrzeby stopień niżej. Poczekalnia: `.tv-nicki.st-0…4` (`nicki.tsx`), odpowiedzi graczy: `.gesto`, `.bardzo-gesto` i wspólne kolumny ramek (`odpowiedzi.tsx`), plansza etapu: `.ciasno-1`, `.ciasno-2` (`etap.tsx`). Nowa lista na TV robi tak samo, zamiast przycinać albo przewijać. Nagłówki przycinane do kilku linii (`-webkit-line-clamp`) mają `padding-bottom: 0.2em` z ujemnym marginesem, żeby nie ucinać ogonków liter.

**Kolory statusów (25.10).** Odpadanie jako informacja („zostaje 6”, „do finału 3”) jasnym złotem (`--zloto-jasne`), czerwień (`--czerwien`) tylko dla zagrożenia i błędu (pod kreską, „Zagrożony odpadnięciem”, zła odpowiedź). Na dobrej drodze: chmiel (`--chmiel`).
