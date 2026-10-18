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

8 (pasek) · 10 (mały przycisk) · 12 (przycisk, input) · 18 (karta, panel) · 50% (medal).

## Komponenty

**Nagłówek z animacją.** Anioł i diabeł wjeżdżają z centrum na boki, logo pojawia się ze `scale(.92)`. Całość trwa 2.8s, krzywa `cubic-bezier(.4,0,.2,1)`. Logo jest białe (`filter: invert(1)` + `mix-blend-mode: screen`).

**Kapsel.** Okrągły kapsel w SVG ze złotym blaskiem `0 0 22px rgba(227,172,63,.28)`. W środku duża liczba w kolorze piany i jednostka złotem („szable”).

**Postać + medal.** Ilustracja stopnia z blaskiem, a w prawym dolnym rogu medal 112px z liczbą.

**Drabina stopni.** Lista z górną linią 3px w złocie i separatorami 1px w `--kamien2`. Stany:
- nieosiągnięty: szary tekst, miniatura w grayscale z `opacity: .45`
- `.ma` (zdobyty): tekst w kolorze piany, zielony ✓ przy progu
- `.teraz` (obecny): złoto, waga 800, większa miniatura (52px) z blaskiem
- `.postep`: pasek 12px z gradientem bursztyn→złoto i podpisem „Jeszcze **1** szabla do awansu”

**Karta (`.spotkanie`).** Tło `--kamien`, obrys 1px w `--kamien2`, radius 18, padding 18. Tytuł 17/800, miejsce jako złoty link 15/600.

**Przyciski.** Pełna szerokość, 18/800, padding 15, radius 12, obrys 2px.
- domyślny: przezroczysty z obrysem `--kamien2`
- pozytywny („Będę”): obrys `--chmiel-ciemny`, po wybraniu tło i obrys `--chmiel` z ciemnym tekstem
- negatywny po wybraniu: tło `--kamien2`, obrys szary
- `.zloty` (główne CTA): gradient złoty
- disabled: `opacity: .5`
- focus: `outline: 3px solid --zloto; offset 3px`

**Input.** 19px, padding 14, radius 12, obrys 2px w `--kamien2`, tło `#0b0f13`.

**Akordeon (`details.zasady`).** Wygląda jak karta. Strzałka to złoty chevron z obramowań 3px, obracany przy otwarciu. Wiersze mają nazwę (piana, bold), opis (szary, 14) i wartość po prawej (złoto, 17/800).

**Ekran awansu.** Fullscreen z radialnym bursztynowym gradientem. Postać wjeżdża animacją `translateY(40px) scale(.7)` → `none` (1s, `--ease-wjazd`) z dużym blaskiem 40px.

**Karczmarka (toast od dołu).** Przyklejona do dołu, max 420px. Bordowy gradient, złoty obrys 2px, radius 18. Ilustracja wystaje z lewej strony panelu (padding‑left 132px). Wjeżdża z dołu po 0.8s. Ma dwa przyciski 14px i trzeci, „Później”, bez obrysu.

**Stopka.** Wyśrodkowana, 13px, szara, logo 96px z `opacity: .55`, podpis autora.

**Przycisk z obrysem (strona główna).** Biały obrys 2px, radius 3, Open Sans 20/500, padding 6×20, przezroczyste tło na wideo.

## Ruch

- Wjazdy: `cubic-bezier(.2,.9,.25,1.1)`, z lekkim przestrzeleniem.
- Wszystkie animacje mają wyłączenie w `prefers-reduced-motion: reduce`.

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
