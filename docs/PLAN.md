# Bractwo Quiz: plan techniczny MVP

Pomysły na później są w [POMYSLY.md](POMYSLY.md), a design system w [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

## Stan na 27.10 w nocy: od czego zacząć

Ta sekcja to skrót dla następnej sesji: co jest, gdzie leży i co jest otwarte. Historia decyzji jest niżej, najnowsze na końcu sekcji „Na 25.10” (od „Uczciwsze punkty, szybsze nalewanie…” do „Kreator na kafelkach, pilot uporządkowany…” z 26.10). Zasady pracy są w `CLAUDE.md`, wygląd w `docs/DESIGN-SYSTEM.md` (ikony, dopasowanie do ekranu TV, kolory statusów), test w `docs/TEST.md`, pomysły w `docs/POMYSLY.md`.

**Produkcja:** `https://quiz.bractwopiwne.pl` (Vercel, region `fra1`, wdrożenie z `main`), baza Supabase `bractwo-quiz` (Frankfurt). Commit, który działa, pokazuje `/api/wersja`.

**Co jest:**
- **Panel** (`/admin`): główny (`ADMIN_HASLO_GLOWNE`, tylko Łukasz, widzi wszystko) i panele lokali pod `/admin/<adres_ekranu>` z własnym hasłem (opis w „Panele lokali”; wspólnego hasła obsługi już nie ma). Lokale: Piwiarnia w Alejach (`piwiarnia-w-alejach`), PPR (`ppr`) i Kwadrat (`kwadrat`, domowy browar Łukasza, dawniej „Dom”). Lokale z logo i adresem ekranu, quizy z etapami (szablony „Klasyczny pub quiz” i „Bez etapów”; ikona etapu `etapy.ikona` na razie tylko migracją), edytor zadań siedmiu rodzajów (wybór, prawda/fałsz, wielokrotny, kolejność, pary, szacowanie, ciekawostka) z grafiką, podpowiedziami i odsłanianą grafiką, kreator gry (miasto → lokal → quiz, okazja, czas, nagrody z samym zdjęciem, widoczność, pijany finał z „Kto dziś stoi za barem”, kranoprzejęcie, zapowiedź domyślnie włączona z godziną za godzinę, jeden przycisk „Uruchom grę”), pytania pijanego finału, przy quizie „Pijany finał: wejście” (tylko główny), historia gier, odbiór nagród, „Pobierz grafikę podium”.
- **TV** (`/ekran/<adres-lokalu>` na stałe w lokalu albo `/tv/<kod>`, scena 1920×1080): plansze lokalu, zapowiedź, poczekalnia z QR (nicki zagęszczają się do 30+), **plansza wstępu** (droga etapów z ikonami do szklanki), plansza etapu z ikoną i demo telefonu, pytanie z odliczaniem, ciekawostki, wynik, odpowiedzi graczy, **wyścig po piwo** po każdym pytaniu (do 12 graczy wszyscy na torach, przy większej grupie dziesiątka i pasek reszty; przed finałem najwyżej 90% drogi), kreska odpadania, pasek „Koniec etapu”, finał trójki jako **wyścig** na 12 kroków z przewagą 0–3 (zła odpowiedź cofa o krok, przed metą najwyżej 85% drogi), ukryty **pijany finał** z wybuchem szklanki, **werble**, podium (dalsze miejsca w jednej przesuwanej linii), tabela, koniec. Przy automacie licznik „Gotowi x/y”, a automat i boty prowadzi także samo TV (`/api/auto`). Nastroje etapów (tła, żaluzje, neon), **muzyka** z Suno na każdy etap i **efekty dźwiękowe** (odliczanie, tykanie, gong, ding, dzwonek końca etapu, kroki w finale, zamiana miejsc w wyścigu, werble; podium bez fanfary). Sam się przeładowuje po wdrożeniu (poza pytaniem, serią i pijanym finałem). Ekrany z listami same się zagęszczają, gdy treść się nie mieści (DESIGN-SYSTEM.md).
- **Telefon** (`/<kod>`): nick i selfie, wszystkie typy odpowiedzi, ranking z miejscem, statusem „Na dobrej drodze” / „Zagrożony odpadnięciem” i szklanką, ekran „Odpadasz”, w finale koła ✓/✗ z utrudnieniami, kibic stuka hasła, pijany finał udający dalszą serię (wejście na temat quizu, potem wspólna pula bez powtórek, komentarze po każdej odpowiedzi), przy automacie „Gotowy!” na planszach, medal, karta nagrody, „Pobierz grafikę na pamiątkę”.
- **Pilot** (`/pilot/<kod>?t=…`): ramka lokalu na górze, przyciski faz, progi odpadania, nagrody do ustawienia przed startem (jak w kreatorze), **boty do testów** (tylko główny, także przed otwarciem poczekalni), **automatyczne prowadzenie** (włącznik obok „Muzyka i dźwięki”), w finale kroki finalistów (z karą), w pijanym finale odliczanie i „Zakończ i pokaż werble”.

**Quizy:**
- **Piwny quiz Bractwa Piwnego** i **Muzyka ponadczasowa** mają te same etapy jako wieczór w barze: **Na jedno** (jedna dobra) → **Jednak więcej** (kilka dobrych) → **Ile?** (szacowanie) → **Jakoś się ułoży** (kolejność i pary, walka o finał: do finału 3) → **Jeszcze zdążę** (finał: wyścig na 12 kroków, ±1 krok za odpowiedź, losowa pula 30 prawda/fałsz, 180 s, koniec też po wyczerpaniu puli) → przy włączonym trybie pijany finał (stałe 60 s) → werble → podium.
- Odpadanie: do 8 graczy nikt, 9–15 po 3. etapie zostaje 6, od 16 po 2. etapie połowa (min. 8), po 3. szóstka. Pilot zmienia progi przed startem.
- Ciekawostki stoją zawsze po pytaniu, którego dotyczą, nigdy na końcu etapu; zasady układania pytań w `CLAUDE.md`.

**Najważniejsze pliki:**
- Baza: `supabase/migrations/`. Funkcje gry: `pilot_akcja`, `zapisz_odpowiedz`, `zapisz_odpowiedz_serii`, `stan_sesji`, `pilot_stan`, `ranking`, `dokoncz_pytanie`, `pijane_pytania`, `zakoncz_pijany`, `kibicuj`, `ustaw_progi`, `dodaj_boty`, `boty_odpowiadaj`, `ustaw_auto`, `gotowy`, `wewn.odetnij`, `wewn.progi_domyslne`, `wewn.ustaw_start_finalu`, `wewn.meta_finalu`, `wewn.kroki_finalu`, `wewn.zamknij_serie_jesli_gotowe`, `wewn.odpowiedz_bota`, `wewn.udawany_czas_bota`. Większość zmieniana podmianą fragmentów, więc całą treść bierz z bazy (`select pg_get_functiondef(…)`).
- TV: `src/app/ekran/_ekran/` (`tv.tsx` rozdziela fazy i rysuje `GotowiTv`; `wstep.tsx`, `etap.tsx` z `.ciasno-1/2`, `nicki.tsx`, `wyscig.tsx` z paskiem reszty, `ranking.tsx` z `KoniecEtapu` i `PasekDalej`, `odpowiedzi.tsx`, `szacowanie.tsx`, `seria.tsx`, `drogi.tsx`, `pijany.tsx`, `muzyka.tsx`, `efekty.tsx`, `tlo.tsx`, `okrzyki.tsx`, `tv.css`).
- Telefon: `src/app/[kod]/` (`gracz.tsx` rozdziela fazy; `rozgrywka.tsx`, `odpowiadanie.tsx`, `seria.tsx`, `kibic.tsx`, `pijany.tsx`, `etap.tsx`, `gotowy.tsx`, `fanfara.tsx`, `moj-wyscig.tsx`, `udostepnij.tsx`).
- Pilot: `src/app/pilot/[kod]/` (`pilot.tsx`, `progi.tsx`, `nagrody.tsx`, `boty.tsx` z akcją serwera `akcje.ts`, `udostepnij.tsx`, `auto.tsx`). Panel: `src/app/admin/(panel)/`.
- Wspólne: `src/components/ikony.tsx` (wszystkie ikony), `src/lib/gra/` (`typy.ts`, `nasluch.ts`, `final.ts` = `wewn.meta_finalu` i kroki z karą, `wyscig.ts`, `odpadanie.ts` z `najblizszeOdciecie`, `nastroj.ts`, `dzwiek.ts`, `efekty.ts` = efekty dźwiękowe TV), `src/lib/pijany.ts`, `src/lib/etapy.ts`, `src/lib/admin.ts`, `src/lib/admin-dostep.ts`. Grafiki: `scripts/grafiki.mjs` (prompty; konto API OpenAI bez środków, więc obrazy robi Łukasz w ChatGPT, a skrypt tylko obrabia).

**Jak testować lokalnie:** szczegóły w `CLAUDE.md` („Testy lokalne”). Najszybciej: gra testowa SQL-em, w pilocie „Dodaj 4 boty” i automatyczne prowadzenie, TV w panelu przeglądarki 1920×1080.

**Otwarte i niepewne:**
- **OLED Samsunga:** wybuch szklanki i muzyka pijanego finału działają (26.10, sprawdził Łukasz: wybuch bez wideo, tory odlatują, muzyka kołysze się bez przerw). Zostaje wygaszacz: żeby ekran nie gasł, Łukasz co jakiś czas klika OK na pilocie TV (klik niczego nie zmienia na ekranie); wyniki badania w „Telewizor: wygaszacz, kursor…” niżej.
- Wyniki gry w panelu liczą ciekawostki i całą pulę finału („Pytań w grze: 63”, „Dobrze 31/63”); trzeba liczyć tylko zadane pytania.
- **Efekty dźwiękowe nikt jeszcze nie słyszał:** sprawdzone tylko, że grają we właściwych chwilach (licznik wywołań Web Audio). Głośność względem muzyki, brzmienie syntezy i Samsung w lokalu do odsłuchania; nagrania można podmienić plikami w `public/dzwieki/`.
- Nowe pytania pijanego finału i komentarze ułożyłem sam (25.10): do przejrzenia przez Łukasza w panelu.
- Nie grane na wielu prawdziwych telefonach naraz: odpadanie, wyścig z paskiem reszty przy 13+ graczach, finał z karą, pijany finał. Finału i podium automatem z botami jeszcze nikt nie przeszedł do końca.
- **Telewizor w Piwiarni niesprawdzony** (25.10): testowy Samsung z Tizen 9 to domowy OLED Łukasza (tam ekran, muzyka i brak wygaszacza działają), a starszy Samsung u mamy Łukasza pokazał na `/ekran` same czarne tło (przeglądarka starsza niż Chrome 111, którego wymaga Next 16). Przesuwany pasek podium i płynność latających awatarów na słabszym TV niesprawdzone.
- W bazie zostały nieużywane rzeczy dla zgodności: tabela `przerobki_ai`, kolumna `sesje.widok_rankingu`, funkcja `gracze_sesji`. Nie przeszkadzają.
- Gry testowe z 26–27.10 do usunięcia w panelu (Łukasz, 27.10): RJMJ, VLYB, VFPQ, XSFK, CLRQ, PXWD, KRVP, YBWP, NXXG, BWXV, ZFEG, CSRT, JZKJ, WASB, BGND, PGYE, BQXX (Kwadrat) i starsze. Kwadrat ma jeszcze testowe hasło lokalu, PPR i Piwiarnia bez haseł.
- **28.10, 18:30 spotkanie Bractwa w Piwiarni, quiz o 19:00** (gra AZKJ, bez automatu, nagrody do ustawienia z pilota). Łukasz przychodzi wcześniej sprawdzić ich TV; w razie czarnego ekranu `?prosty`, a potem laptop przez HDMI.

- **Lista drobnych zmian wizualnych od Łukasza (26.10), do zrobienia po kolei w kolejnej sesji:**
  1. ✅ Pilot: ramka „odpowiedziano” (stoi zawsze, opis niżej).
  2. ✅ Po uruchomieniu od razu pilot, przekazywanie pilota w pilocie, menu panelu na telefonie (opis niżej).
  3. ✅ Osobne panele lokali (26.10, opis niżej w „Panele lokali”). Panele graczy i pytań w pilocie Łukasz uznał za zrobione; wróci do nich po rozdzieleniu lokali, jeśli będzie trzeba.
  4. ✅ „Ile?”: oś na dole, gracze nad nią, poprawna odpowiedź pod nagłówkiem (opis niżej).
  5. ✅ Kreska odpadania z większym odstępem (opis niżej).

- **Dziś (26.10) zmienione, na produkcji, ale niesprawdzone na prawdziwym TV/telefonach w lokalu:** wybuch szklanki na TV z klatek klipu (zamiast konfetti; na komputerze dalej wideo), równoległe drogi finału blisko siebie, scena TV na cały ekran (nagłówek od góry, stopka od dołu), podium i tabela na zmianę na końcu gry, ekran lokalu wraca do logo po „Zakończ grę”, nowy pilot (ramka stanu, ikony muzyki i automatu, menu), kreator na kafelkach. Łukasz testuje na OLED i iPhonie na bieżąco.
- Muzyka klasycznego pub quizu wyłączona (POMYSLY.md), a „Ile?” ma mnożnik ×2.

**Do zrobienia razem z Łukaszem (26.10 wieczorem):**
1. Test paneli lokali (PPR, Piwiarnia): hasło na start, logowanie pod `/admin/ppr`, co lokal widzi (lista w rozmowie z 26.10).
2. Hasła kibiców do ustalenia razem: na zwykły finał (dziś „Dawaj”, „Jedziesz” itd., `HASLA` w `src/lib/gra/okrzyki.ts`, numer hasła w bazie 0..7) i osobne na pijany finał, gdzie kibicowanie zamienia się w troskę: „Wszystko ok?”, „Żyjesz?” itp. (pomysł Łukasza). W pijanym kibic dziś wysyła te same hasła.

**Następny krok:** powyższe dwa punkty, potem odsłuch dźwięków na TV w lokalu i przegląd pytań pijanego finału, liczenie pytań w wynikach gry, potem test na żywo na spotkaniu Kręgu 28.10.

### Lista poprawek Łukasza po teście 26.10 ✅

- **Panel:** przy quizie Bractwa przełącznik „udostępnij lokalom” (zamiast przycisku, który wjeżdżał na tekst). Kreator bez 45vh pustego miejsca na końcu, bez „Grafiki na poczekalnię” (wydarzenie to tylko kranoprzejęcie; `grafika_url` zostaje w bazie dla starszych gier), zdjęcie nagrody w jednym wierszu jak pole pliku (przycisk, miniatura, „Bez zdjęcia”). Limit graczy domyślnie i najwyżej 20 (`MAX_GRACZY`).
- **Pytania z AI** (`quizy/[id]/wklej.tsx`): rodzaje pytań w kolorach rodzajów z pilota, równe kafelki po dwa w wierszu; „Wklej ze schowka” zamiast pola, a pole z tekstem i lista pytań w zwijanym „Podglądzie pytań” (jak podgląd promptu).
- **Telefon:** w nagłówku rodzaj gry („Wyścig po piwo” / „Pub quiz”, `nazwaRodzaju`), a na grafice na pamiątkę bez okazji też rodzaj zamiast „Quiz Bractwa Piwnego”. Podpis „Aplikację zrobił · lukasznowak.dev” jako stopka na dole ekranu. W rankingu wycinek tabeli: pięciu graczy z Tobą w środku, po chwili przesuwają się jak na TV (`moj-ranking.tsx`).
- **Kibice:** odpadający od razu może pobrać grafikę na pamiątkę i wie, że w finale będzie kibicował; na planszy finału kibic (spoza trójki, także odpadły wcześniej) widzi „Finał bez Ciebie” bez „Gotowy”, a licznik gotowych liczy tylko grających (`stan_sesji.gotowi_z`, migracja `20261026161355`). W pijanym finale kibic dalej dopinguje (baza przyjmuje okrzyki w fazie `pijany`, TV pokazuje dymki), a jego ekran lekko faluje. Hasła bez awatara, z nickiem finalisty („Jedziesz, Nowy!”), na TV nick kibica nad tekstem dymku, bez dwukropka.
- **TV:** powierzchnie ciepłe prawie czarne z brązowym obrysem (`--kamien*` nadpisane w `.tv`), bez kreski pod ostatnim graczem w odpowiedziach, „Koniec etapu” niżej, „Gotowi” zielone (liczba szara, zielona przy komplecie), zegar w rogu 64 px na stałej wysokości (nagłówek nie skacze przy „Wynik”), bez mnożnika (×1,5) w nagłówkach pytania i odliczania (także na telefonie). Podium bez zdjęcia nagrody (wypychało zwycięzcę za ekran). Ranking po pytaniu (wyścig i tabela pub quizu) po 10 graczy na stronę, strony co 5 s (`NA_STRONIE_RANKINGU`, `STRONA_RANKINGU_S`), automat czeka dłużej o kolejne strony; pasek reszty zniknął.
- **Pijany finał:** muzyka (Web Audio) ciszej (`PIJANA_CISZEJ` 0,7), poświata pod szklanką gaśnie z wybuchem (sam wybuch bez zmian), kroki pozorowanego wyścigu słychać jak w finale („krok” naprzód, „pudło” w tył).
- **Grafika podium z panelu:** 1080×1920 jak grafika gracza, trójka na stopniach podium.
- **Awatary jako kapsle** (`src/lib/kapsel.ts`, `awatar.tsx`): kapsel z ząbkami to SVG generowany w kolorze (tło elementu, bez masek i `clip-path`). Z selfie zdjęcie w środku, a kapsel w kolorze dobranym ze zdjęcia przy wysyłaniu (najbardziej nasycone piksele, rozjaśnione), zapisanym w adresie zdjęcia jako `#kapsel=rrggbb` (bez nowej kolumny; `usunGrafike` obcina fragment). Bez selfie cały kapsel w jasnym kolorze nicku z ciemną literą (nigdy ciemne tło). Na grafice na pamiątkę i grafice podium ten sam kapsel, rysowany ścieżką (`Path2D`), nie obrazkiem SVG. Obwódki `border` z innych reguł są wyłączone (`border: 0 !important` w `.awatar`).
- **Telefon gracza:** te same prawie czarne powierzchnie co TV (`.ekran-gracza` nadpisuje `--kamien*` i `--pole`). Brązowe (#17130f) robiły całość za brązową, więc od 26.10 wieczorem #121212, z obrysem w ciemnym wyblakłym beżu #3b352c (szary #353535 był za zimny, #4d4538 za jasny); kreski między graczami w odpowiedziach w połowie odstępu na TV, telefonie i prostym ekranie.
- **Kolor kapsla do wyboru** (26.10 wieczorem): przy dołączaniu i w poczekalni osiem kolorów pod podglądem kapsla (pusty, z literą po wpisaniu nicku albo ze zdjęciem, w dowolnej kolejności). Kolor siedzi w `gracze.zdjecie_url` jako `#kapsel=rrggbb`, także bez zdjęcia (sam fragment), więc dociera do TV, rankingów i grafik bez zmian w bazie; prawdziwy adres obrazka daje `adresZdjecia`. Bez wyboru: przy zdjęciu kolor ze zdjęcia, bez zdjęcia po nicku. Usunięcie zdjęcia zostawia kolor. Litera większa i wygrawerowana (ciemna, półprzezroczysta, z jasną krawędzią), też na grafikach.
- **Werble na telefonie:** same skaczące kropki, bez napisu „Werble… Wynik za chwilę”.
- **Telefon prościej (26.10 wieczorem):** po wyniku bez szarych dopisków („Twoja kolejność”, „Ty: …”, „pominięta”, czas odpowiedzi), w rankingu bez szklanki i bez opisów „Na dobrej drodze / Zagrożony”: numer miejsca jest zielony nad najbliższą kreską i czerwony pod nią. Grafika na pamiątkę: okrągłe zdjęcie w obręczy w kolorze kapsla (bez ząbków).
- **Odsłaniana grafika na TV** (`ekran/_ekran/grafika-odslaniana.tsx`): rozmycie przez płótno (`ctx.filter = blur(…)`, a bez niego płynne zmniejszenie i powiększenie), bo Samsung nie stosował CSS `filter: blur` i chmiel na TV był od razu ostry. Siła rozmycia przeliczona na wysokość obrazka względem telefonu (`blur(rozmycie / 2)` przy 220 px), więc oba ekrany wyostrzają się jednakowo (pierwsza wersja z małą rozdzielczością dawała piksele i wyostrzała się szybciej).
- **Po teście na butelkowaniu (27.10, migracja `20261027204332`):**
  - punkty za szybkość spadają z 1000 do 200 (było do 500), bez limitu czasu przez 30 s przy jednej dobrej i 60 s przy kilku dobrych, kolejności i parach (było 20 / 40 s); 10 s różnicy to ok. 270 / 135 pkt przed mnożnikiem;
  - finał bez punktów (migracja `20261027205553`, chwilę wcześniej było ±500): punkty z etapów zamieniają się na pozycję startową (przewaga 0–3 kroki), a w serii finałowej liczy się tylko wyścig (`punkty` = 0, `check punkty >= 0` jak wcześniej). Opis etapu finałowego mówi o tym na planszy przed startem. Przy finalistach na podium (TV, telefon na końcu, grafika „na pamiątkę”, grafika podium w panelu) bez punktów, bo miejsce mówi numer stopnia (`miejsceZWyscigu` w `src/lib/gra/final.ts`), bo zwycięzca wyścigu może mieć mniej punktów z etapów;
  - TV po pytaniu z kilkoma dobrymi, kolejnością albo parami: zielony pasek z dobrą odpowiedzią nad ramkami, a litery gracza zielone (trafione) i czerwone (błędne).
- **Pilot przed startem i cisza na wstępie** (27.10): ramka stanu w poczekalni mówi, co jest na TV („Na TV zapowiedź” albo „Poczekalnia z QR”), a w drugim wierszu złote „Start o 19:00” z odliczaniem (wcześniej wygrywał z nim rodzaj następnego pytania). Plansza wstępu (droga etapów) bez muzyki, żeby prowadzący spokojnie tłumaczył; muzyka wraca z 1. etapem (`utworFazy`).
- **Poczekalnia gracza po dołączeniu** (27.10, `gracz.tsx`): bez zmiany koloru kapsla i zdjęcia (zatwierdzone przy dołączaniu), za to godzina startu z odliczaniem (`StartWPoczekalni`).
- **Zapowiedź z automatem: godzina = start quizu** (27.10): zmianę z nocy (godzina jako otwarcie poczekalni, migracja `20261026234832`) Łukasz cofnął rano (migracja `20261027075229`). Zostaje ustalenie z 26.10: z automatem quiz startuje sam o godzinie z kreatora, a poczekalnia z QR otwiera się `NA_ZAPISY_MIN` (5) minut wcześniej. Bez automatu zapowiedź wisi, aż prowadzący otworzy poczekalnię i wystartuje.
- **Lokal „Dom” → „Kwadrat”** (migracja `20261026212649`): domowy browar Łukasza (browarkwadrat.pl), logo `public/loga/kwadrat.svg` (biały kwadrat ze znaku browaru w czarnym kole). Od migracji `20261026214449` także adres: `/ekran/kwadrat`, `/admin/kwadrat` (stare `/ekran/dom` już nie działa), a logo `dom.svg` usunięte.
- **Pilot: nagrody jak w kreatorze, boty tylko dla głównego** (migracja `20261026212235`): karta „Nagrody” w pilocie składa się z tych samych elementów co kreator (przełącznik „z nagrodami”, kafelki z podium, pola nagród; style przeniesione z `panel.css` do `globals.css`, opis w DESIGN-SYSTEM.md). „Dodaj 4 boty” widzi tylko główny (`rolaAdmina` w `pilot/[kod]/page.tsx`), boty dodaje akcja serwera kluczem serwisowym (`dodaj_boty` bez `anon`), także przed otwarciem poczekalni (`dolacz` przepuszcza wtedy tylko z flagą `bq.dodaje_boty`). W kreatorze rodzaj „Pub quiz” zamiast „Klasyczny pub quiz” (mieści się obok „Wyścig po piwo”).
- **Szacowanie z przedziałem** (migracja `20261026202041`): opcjonalne `dane.poprawna_do`. Dobre są liczby od `poprawna` do `poprawna_do` (pełne punkty), dalej punkty maleją od najbliższego brzegu do zera w odległości `tolerancja`; `poprawna_do` ukrywane przed wynikiem jak `poprawna` (`stan_sesji`, `seria_pytania`), pilot dostaje je w `pilot_stan`. TV: złoty pas przedziału na osi i plakietka „7,5–9,5 %”. Pole „Poprawna do (przedział)” w kreatorze pytań. Tripel w piwnym quizie: 7,5–9,5% na suwaku 4–18 co 0,1, teraz przed pintą (łatwiej trafić). Demo par na planszy etapu: krótkie słowa (Kot, Pies, Krowa / Hau, Muu, Miau), bo „Filiżanka” wychodziła z kafelka.
- **Etap „Ile?” i plakietka widełek** (28.10, migracja `20261028100744`): kolejność kufel → tripel (7,5–9,5%) → ekstrakt czeskiego pilsa (11–12,5 °Blg, suwak 6–24 co 0,5, zdjęcie pilsa zostaje; zamiast roku pierwszego pilsa, którego mało kto pamiętał) → Weihenstephan → pinta (najtrudniejsza, klamra z kuflem). Przed wynikiem `stan_sesji` i `seria_pytania` dokładają do `dane` szacowania z widełkami sam znacznik `przedzial: true` (bez liczb), a TV nad osią, telefon nad suwakiem i prosty ekran piszą „Celuj w widełki” albo „Celuj w konkretną liczbę” (`celSzacowania` w `src/lib/zadania.ts`).
- **Przegląd piwnego quizu** (28.10, migracje `20261028101403`, `20261028101415`): „Jaki to styl?” (kriek) przesunięty na 10. miejsce etapu 1 (po szkle weizen), jęczmień z dobrą pod D; w „polskich tradycjach” szósta myląca odpowiedź koźlak, w „kwaśnych” witbier (obie po 3 dobre, pod B/D/F i A/C/E); zamiast osi czasu z prawem czystości „Ułóż odmiany IPA od najstarszej” (English, American, New England, Cold IPA). IBU zostaje tylko jako wiedza (co mierzy), bez pytań o liczby. Odmiany IPA okazały się złe (American IPA to szeroka rodzina, NEIPA jej odmiana), więc pytanie 33 to „Ułóż style od najstarszego”: grodziskie, porter, pils, New England IPA (migracja `20261028101951`). W „miastach od stylów” szósta myląca odpowiedź Gdańsk (porter bałtycki, jopejskie), dobre pod A, C, F (`20261028102923`). Pytanie o porter: Gdańsk zamiast Monachium jako pułapka, Londyn pod D (`20261028103318`).
- **Pula finału bez powtórek z etapów** (28.10): usunięte jednorazowym skryptem (MCP nie usuwa) zdania prawda/fałsz, które powtarzały fakty z etapów: lambic na drożdżach z hodowli, witbier z kolendrą, kölsch z Kolonii, porter z Irlandii, grodziskie wędzone, IBU mierzy kolor, pils z Bawarii, gose z solą (Łukasz: sól to proteza, dawniej słona była woda z Gose), doppelbock mocniejszy od koźlaka. Potem dopisane 17 nowych zdań (`20261028104124`), w puli jest 38 (20 prawdziwych). Z nich wyleciały zaraz dwa o Oktoberfeście, prohibicja i cask ale, a lager to teraz „lagern, czyli leżakować” (`20261028104711`): w puli 34 zdania (19 prawdziwych). Seria daje każdemu graczowi całą pulę w losowej kolejności (`seria_pytania`), a wyścig kończy się wcześniej, więc pula to zapas, a nie liczba pytań w grze.
- **Finał bez mnożnika** (28.10): finał trójki w serii nie liczy punktów, więc nigdzie nie piszemy „Punkty ×2” (`bezPunktow` w `src/lib/etapy.ts`): plansza etapu na TV, telefonie i prostym ekranie, pilot, nagłówek etapu w panelu, lista etapów szablonu („bez punktów”), wybór etapu w edytorze pytania („wyścig”). W formularzu takiego etapu nie ma wyboru mnożnika, a szablon „Jeszcze zdążę” ma mnożnik 1.
- **Pytania rozwijane na liście quizu** (28.10, `quizy/[id]/zadanie-na-liscie.tsx`): kliknięcie pytania rozwija edytor w miejscu (`<details>`), „Zapisz pytanie” zapisuje bez przejścia na inną stronę (`na_liscie` w `zapiszZadanie` → `refresh()` i `{ ok }`), zwija edytor i zostawia złoty pasek przy ostatnio zapisanym. Miejsca z planu etapu i „+ Dodaj pytanie” rozwijają pusty edytor tak samo. Osobna strona `zadania/[zadanie]` zostaje (np. dla starych linków). W quizie z etapami edytor podsuwa tylko rodzaje etapu (`typyEtapow`: rodzaj domyślny etapu i rodzaje pytań, które już w nim są) plus ciekawostkę (poza serią finału), a przy zmianie etapu przestawia rodzaj na rodzaj nowego etapu; rodzaj edytowanego pytania zostaje zawsze. Etapy zwijają się i rozwijają kliknięciem nazwy (`NaglowekEtapu` z pytaniami jako `children`). **Pijany finał prościej** (28.10, migracja `20261028111139`): bez osobnego wejścia dla każdego quizu. Jedna wspólna lista w dwóch częściach: „O piwie” (`pijane_pytania.piwne`) leci zawsze po kolei według `nr` (spokojnie, jak dalszy ciąg finału; bez limitu 5), potem „Odklejone” losowo. Na początek „O piwie” przeszło 5 pytań z wejścia piwnego quizu (trzeci napój świata, ciemne piwo, mlíko, puszka, najlepsze piwo przed tobą), za nimi 3 żarty (szklanka do połowy pełna, płaci ktoś inny, ostatnie piwo przedostatnie), razem 8; reszta dawnych złotych przeszła do „Odklejonych” (24), a Żubr (koncern) wyleciał (`20261028114901`). 
- **Finał uczciwszy i krótszy pijany wstęp** (28.10, `20261028125017`, `20261028125040`): przewaga na starcie finału to 1 krok za każde 2500 pkt przewagi nad najsłabszym finalistą, najwyżej 4 (`wewn.ustaw_start_finalu`; było: najlepszy zawsze 3, najsłabszy 0); wyczerpana pula nie kończy finału wszystkim, tylko ten gracz czeka (`wewn.zamknij_serie_jesli_gotowe`); czas finału 120 s (było 180). Do piwa: od 8 (przewaga 4) do 12 dobrych odpowiedzi. Pijany finał: na początek 3 losowe „O piwie”, czwarte to pytanie z imieniem zza baru (bez imienia jeszcze jedno „O piwie”), potem „Odklejone” losowo do końca 60 s; ciekawostka po 3. pytaniu (`CIEKAWOSTKA_PIJANA.po`). Literówka „{za_barem} na barem” poprawiona.
- **Strona zasad wyścigu** (28.10, `/admin/quizy/zasady`, przycisk „Zasady i punktacja” w zakładce „Wyścig po piwo”): przebieg gry z ikonami etapów, jak liczymy punkty (wykres szybkości), karta każdej konkurencji z przedziałami punktów za pytanie i za etap (najwolniej/najszybciej przy dobrej odpowiedzi) i przykładami częściowych odpowiedzi, suma przed finałem (15 800–44 000), odpadanie, finał (tor z przewagą) i pijany finał. Liczby liczą się z tych samych stałych co gra: szablony etapów (`SZABLONY_QUIZU`, `SZABLONY_ETAPOW`), `src/lib/gra/punktacja.ts` (kopia `wewn.punkty_odpowiedzi`/`okno_bez_limitu_ms` tylko do opisu, musi się zgadzać z bazą), `PUNKTOW_NA_KROK`/`MAX_PRZEWAGI` w `final.ts`, `CZAS_PIJANEGO_S` w `pijany.ts`. Progi odpadania są opisane tekstem (jak `wewn.progi_domyslne`). Tak samo `/admin/quizy/zasady/pub-quiz` dla pub quizu (link „Zasady i punktacja →” z prawej w rzędzie zakładek, w obu zakładkach): przebieg, punkty bez mnożników i karta każdego rodzaju pytań; opisy rodzajów i częściowych odpowiedzi są wspólne (`quizy/zasady/wspolne.tsx`, `RODZAJE`). Ikony etapów to liniowe `IkonaEtapu` jak na TV (style `.ikona-etapu` przeniesione do `globals.css`).
- **Pub quiz z wagą rodzajów** (28.10, `20261028134759`): pytania bez etapu nie miały mnożnika (×1), teraz `wewn.punkty_odpowiedzi` bierze `coalesce(mnożnik etapu, wewn.waga_typu(typ))`: kilka dobrych ×1,5 (do 1500 pkt), szacowanie, kolejność i pary ×2 (do 2000), jedna odpowiedź i prawda/fałsz ×1. W wyścigu bez zmian (etap zawsze ma mnożnik). W TS `WAGA_TYPU` w `punktacja.ts`; na stronie zasad pub quizu bez słowa „mnożnik”, tylko „do X pkt” przy rodzaju.
- **Pijany finał bez przetasowań** (28.10, `ekran/_ekran/pijany.tsx`): pozorowany wyścig trzyma każdego najwyżej 1 krok od miejsca z końca serii (`KROKOW_OD_STARTU`), a 11 s przed końcem fazy (`PLYWANIE_PRZED_KONCEM_S`, zbieganie 3 s) wszyscy zbiegają się do średniej i pływają wokół niej w swoim rytmie, żeby przed wybuchem nie było widać, kto prowadzi. Strona zasad wyścigu: przy kartach etapów dopisane odpadanie (od 9 graczy po „Ile?”, od 16 po „Jednak więcej”).
- **Plansza wstępu z liczbami** (28.10, `liczbyEtapow` w `src/lib/gra/odpadanie.ts`): pod każdym etapem na TV „grają N” i „przechodzi M” (przed finałem „do finału 3”, bez odpadania szare „przechodzą wszyscy”), liczone od liczby grających i progów z `sesje.progi`; prosty ekran ma to samo w jednej linii. Odmiana: „gra 8”, „grają 4”, „przechodzi 9”, „przechodzą 3” (`zLiczba`); przed finałem też „przechodzą 3”.
- **Odpadanie procentowe** (28.10, `20261028143836`, `wewn.progi_domyslne`): po etapie 1 nikt, po etapie 2 przechodzi 80% (w górę), po etapie 3 połowa (w górę), po etapie 4 trójka; cięcie tylko, gdy zostaje więcej niż 3. Progi zapisują się przy starcie gry (`pilot_akcja` → `sesje.progi`), więc gry już rozpoczęte mają stare. Opis i tabela na stronie zasad (`grajacyWEtapach`).
- **Gry Bractwa u lokalu i zwalnianie ekranu** (28.10, `20261028143957`): lokal widzi na listach rozgrywek (panel, Rozgrywki; `filtrGier(…, true)`) także gry Bractwa (`tylko_glowny`) w swoim lokalu, z logo Bractwa, „ustawiło Bractwo Piwne” i godziną startu, bez pilota, strony gry i usuwania (menu ze skrótem do pilota dalej ich nie bierze). „Podgląd” otwiera ekran gry `/tv/<kod>` w nowej karcie (bez sterowania); ten sam przycisk stoi przy każdej trwającej grze obok „Prowadź”. W fazie `poczekalnia` (zapowiedź i poczekalnia) przycisk „Zwolnij ekran” z potwierdzeniem kończy grę (`zwolnijEkran` w `gry/akcje.ts`), w trakcie gry tylko „prowadzi Bractwo”. Główny dostaje powiadomienie: tabela `powiadomienia`, pasek pod nagłówkiem panelu (`_komponenty/powiadomienia.tsx`) aż do „OK”. Bez automatycznego zamykania porzuconych gier (na razie).
- **Prosty ekran dogoniony** (28.10, `ekran/_prosty/prosty.tsx`, przejście gry z botami na `?prosty`): odpowiedzi w trzech ramkach (dobrze / częściowo, w szacowaniu „W punkt” / „Blisko”, źle), podium po finale bez punktów finalistów, tabela z przebiegiem finału (✓, ✗, kroki), napis „Werble…” zamiast czarnego ekranu, odsłaniana grafika schowana do wyniku (bez rozmycia zdradzała odpowiedź). Poczekalnia, wstęp z liczbami, etap, pytanie z grafiką, ranking i finał były w porządku. Potem: ranking dzieli graczy po równo na strony (`naStronieRankingu` w `src/lib/gra/wyscig.ts`, hook `useStronaRankingu` w `src/lib/gra/strona-rankingu.ts`, wspólny dla głównego i prostego ekranu; 12 graczy = 6 + 6, a nie 10 + 2), prosty ranking ma strony i „Strona 1 z 2” (wcześniej 12. gracz wypadał poza ekran), lider na złoto po miejscu, a pytanie na prostym ekranie stoi na środku w pionie z grafiką obok odpowiedzi.
- **Po grze w Piwiarni (28.10 wieczorem):** odpadnięci nie pokazują się już w kolejnych pytaniach jako „bez odpowiedzi” (`odpowiedzi_zadania`, `20261028204211`); w panelu lokalu na komputerze logo lokalu tylko w nawigacji (bez dubla przy Bractwie); lokal otwiera zakończone gry Bractwa u siebie (`wymagajGry(…, true)` → `gosc`: wyniki, historie graczy, grafiki, bez usuwania i oznaczania nagród). Strona wyników gry: liczba pytań bez puli finału i ciekawostek („Pytań w grze: 29 i finał”), finalista ma „dobrze x/(29 + jego pytania finału)” (`WynikGracza.wSerii`), miejsca z `ranking` jak na TV (po finale decyduje wyścig, wcześniej strona sortowała po punktach); historia gracza w finale tylko z pytaniami, na które odpowiadał, w kolejności odpowiedzi; odpowiedzi blisko/częściowo na złoto.Tabela `pijane_pytania_quizu` zostaje, ale baza jej nie czyta (3 pytania o muzyce z „Muzyki ponadczasowej” tam leżą), a strona `quizy/[id]/pijany` zniknęła. W edytorze quizu (tylko główny) pod finałem stoi blok „Pijany finał · Dogrywka” jak etap (`quizy/[id]/blok-pijany.tsx`, różowy, przerywany obrys, znaczki „opcjonalny”, „wszystkie quizy”), z formularzem całej listy (strzałki w „O piwie”, przenoszenie między częściami); ta sama lista jest w Quizy → Pijany finał. Ciekawostka w pijanym finale stoi po 3. pytaniu. Rodzaj pytania w edytorze to kafelki w kolorach `.rodzaj-pytania` (wybrany wypełniony swoim kolorem), a na liście przy każdym pytaniu stoi kolorowa plakietka rodzaju.
- **Jedna gra w lokalu** (migracja `20261026195938`, kreator w `gry/akcje.ts`): lokal ma jeden ekran, więc póki jego gra nie jest zakończona, kreator nie uruchomi tam drugiej (komunikat z kodem trwającej gry), a w bazie pilnuje tego indeks `sesje_jedna_w_lokalu`. Gry bez lokalu (testy) bez ograniczeń.
- **Nagrody z pilota przed startem** (`pilot/[kod]/nagrody.tsx`, `ustaw_nagrody`, migracja `20261026194950`): w poczekalni karta „Nagrody” (bez nagród, 1. miejsce, pierwsza trójka; nagroda, jak odebrać, zdjęcie), zapis tylko przed startem, TV i telefony dostają je od razu. Zdjęcie nagrody wysyła się z pilota kluczem pilota (`/api/nagroda` przyjmuje kod i klucz gry w poczekalni albo logowanie w panelu).
- **Wycinek rankingu na telefonie:** nad i pod pięcioma wierszami po pół wiersza sąsiada, wygaszone maską, gdy lista ciągnie się dalej (u pierwszego tylko na dole, u ostatniego tylko na górze).
- **Ciekawostka w pijanym finale** (`CIEKAWOSTKA_PIJANA` w `src/lib/pijany.ts`): po 4. pytaniu dogrywki (od 28.10, wcześniej po 3.) telefon pokazuje „Ciekawostka: Kalsarikännit” (fińskie słowo na picie w domu w gaciach, oficjalna emotka fińskiego MSZ z 2015) z grafiką i dłuższym tekstem, który faluje z ekranem; dalej przyciskiem. Grafika `public/grafiki/pijany/kalsarikannit.webp` do zrobienia w ChatGPT (prompt `pijany-kalsarikannit` w `scripts/grafiki.mjs`), bez pliku plansza jest bez obrazka.
- **Automat czeka na wszystkich gotowych** na planszach (bez dawnego limitu 40–45 s); licznik „Gotowi” na TV: napis i liczba jednej wielkości (różna wielkość wybijała napis ze środka pastylki), liczba wyróżniona kolorem.
- **Panel prościej (26.10 wieczorem):** w kreatorze rodzaj quizu to dwa przyciski jak zakładki w Quizach (bez kafelków z ikonami), na liście quizów same tytuły (logo autora, kłódka przy ukrytych; liczba pytań, tematy i opis po wejściu w quiz), w menu bez nagłówka „Przygotowanie” (quizy i lokale oddzielone kreską). Na planszy wstępu i etapu nagłówek ma zawsze wysokość logo, więc bez lokalu tytuł nie wchodzi pod licznik „Gotowi”.
- **Liniowe ikony etapów** (`src/components/ikony-etapow.tsx`): zamiast grafik z AI proste ikony złotą linią jak reszta aplikacji (pinta, deska degustacyjna, menzurka, puzzel, klepsydra), wybierane po nazwie pliku z `etapy.ikona` (baza bez zmian; nieznana nazwa pokazuje dawny obrazek). Numer finału na drodze wstępu wygląda jak pozostałe.
- **O odpadaniu tylko tam, gdzie się odpada:** na planszy etapu (TV i telefon) informacja tylko w etapie z odcięciem i tylko, gdy graczy jest więcej niż przechodzi („Po tym etapie dalej gra N najlepszych”, w walce o finał „3 najlepszych wchodzi do finału”); bez zapowiedzi „po drodze odpada się” w innych etapach (`kolejneOdciecia` usunięte). Plansza wstępu przy 2–3 graczach nie mówi o odpadaniu. Na grafikach do pobrania większy odstęp między logami, na planszy wstępu odstęp logo lokalu od tytułu.
- **Kto jak odpowiedział na telefonie:** w fazie `odpowiedzi` telefon pokazuje te same ramki co TV (dobrze, częściowo, źle i bez odpowiedzi) z kapslami i nickami, swój nick na złoto (`[kod]/odpowiedzi-graczy.tsx`, dane z `odpowiedzi_zadania`), zamiast powtórki pytania z rozwiązaniem.
- **„Gotowy” zawsze** (nie tylko przy automacie): gracze klikają go na planszach etapu, wstępu i przy ciekawostkach, TV i pilot pokazują „Gotowi x/y”, a w pilocie na liście graczy pasek zielony (gotowy) albo czerwony (czekamy; zaginionego prowadzący usuwa ✕). Baza: `pilot_gracze` podaje `gotowy` i `musi_gotowy` (migracja `20261026175303`). Licznik na TV: „Gotowi” zielone, liczba kremowa i większa, „/z ilu” przygaszone, przy komplecie cała pastylka zielona z poświatą.
- **Telefon bez instrukcji pod pytaniem:** bez „Wybierz odpowiedź”, „Połącz w pary” i podpowiedzi przy łączeniu (zasady są na planszach etapów, a tekst przesuwał „Zatwierdź”).
- **Ranking na dwóch stronach:** druga strona wjeżdża cała z dołu ekranu, bez zamiany torów (wcześniej przesunięte tory czekały widoczne pod listą).
- **Podium:** bez górnej ścianki-trapezu na `clip-path` (Samsung jej nie rysował, a gdzie indziej wyglądała jak „niby 3D”), wszędzie płaskie jak na TV w wyścigu.
- **Panel lokalu:** na górze menu „Mój lokal” z logo i nazwą (ekran lokalu, hasło, logo, Instagram), a na komputerze logo lokalu zamiast zębatki.
- **Ikona na ekranie iPhone'a** (`src/app/apple-icon.png`): czarna z całym białym logo Bractwa (wcześniej czarne logo na białym, ucięte).
- **OLED:** przeglądarka nie może sama „nacisnąć” OK na pilocie (zdarzenia z kodu nie są gestem użytkownika, a wygaszacz telewizora patrzy na pilota, nie na stronę). Zostają Wake Lock i wideo czuwania.
- Na TV i telefonach w lokalu niesprawdzone; w przeglądarce sprawdzone: ranking 14 graczy na dwóch stronach, wycinek tabeli na telefonie, kapsle na telefonie i TV, nagłówki pytania.

### Panele lokali (26.10) ✅

- **Logowanie:** lokal wchodzi pod `/admin/<adres_ekranu>` (np. `quiz.bractwopiwne.pl/admin/ppr`, ten sam adres co ekran, tylko pod `/admin/`), widzi swoje logo i pole hasła. Hasło jest w bazie (`lokale_hasla`, skrót scrypt, migracja `20261026131354_panele_lokali`, dostęp tylko z klucza serwisowego). Główny ustawia hasło na start na stronie lokalu (karta „Hasło panelu” i link do panelu lokalu), lokal zmienia je sam u siebie. Zmiana hasła wylogowuje lokal na innych urządzeniach (znacznik hasła w ciasteczku). Wspólne hasło obsługi (`ADMIN_HASLO`) przestało działać; zmienną na Vercelu można usunąć.
- **Co widzi lokal:** w nagłówku swoje logo obok logo Bractwa. Swoje gry (bez gier „tylko dla mnie” głównego), swoje quizy (`quizy.lokal_id`, tworzy i zmienia jak dotąd) i quizy Bractwa bez kłódki z podpisem „quiz Bractwa, tylko do grania”: lista z ikoną oka zamiast edycji i kosza, strona quizu tylko do odczytu (pytania z rozwiązaniami), edycja pytań i kosz dają 404. Kreator bez kroków miasta i lokalu (gra tylko u siebie), z pijanym finałem i „Kto dziś stoi za barem”. Ustawienia: tylko swój lokal (logo, Instagram, hasło, ekran z QR); nazwę, miasto i adres ekranu zmienia główny. Historia, wyniki, nagrody i grafika podium swoich gier jak u głównego.
- **Co widzi główny:** wszystko jak dotąd. W quizach i rozgrywkach filtr „kto” (wszyscy, Bractwo, każdy lokal z logo, `?lokal=`), a przy quizie logo autora (lokalu albo Bractwa). Przełącznik „tylko dla mnie” przy quizie znaczy teraz „lokale nie zobaczą”, a przy grze „lokal nie zobaczy jej w swoim panelu”.
- **Sprawdzone lokalnie:** logowanie główne i lokalu „Dom” (złe hasło odrzucone), lista quizów lokalu (tylko Piwny jako quiz Bractwa), podgląd Piwnego, 404 na ukrytym quizie, na edycji pytań Piwnego i na cudzym lokalu, kreator lokalu, filtry i ikony u głównego. Na produkcji i na telefonie niesprawdzone. Lokal „Dom” ma testowe hasło lokalu z tego testu: ustaw własne na stronie lokalu. PPR i Piwiarnia w Alejach nie mają jeszcze haseł.
- **Finał na TV:** lider (także w pijanym finale) bez złotej obwódki i złotego podpisu, podpis z nickiem stoi z lewej strony awatara (na wysokości środka), długi nick kończy się wielokropkiem; drogi zaczynają się dalej od lewej krawędzi (`START_X` 300 zamiast 130 w `drogi.tsx`), żeby podpis mieścił się na starcie.

## Na 25.10: dźwięki i pijany finał

### Dźwięki (efekty na TV) ✅ zrobione, opis w „Efekty dźwiękowe na TV (25.10)”

Stan przed zmianą: jest tylko muzyka (`muzyka.tsx`, dwa stałe odtwarzacze) i dźwięk wybuchu w wideo pijanego finału. Werble i fanfara są dziś tylko obrazem. Odblokowanie dźwięku przez OK na pilocie TV już jest (`src/lib/gra/dzwiek.ts`, `odblokujDzwiek`).

Propozycja techniczna:
- Efekty tylko na TV (w barze telefony i tak nie słychać, a każdy telefon wymagałby osobnego odblokowania). Na telefonach najwyżej wibracja (Android).
- Web Audio: jeden `AudioContext` wznawiany tym samym gestem co muzyka, krótkie pliki w `public/dzwieki/*.mp3` wczytane raz do buforów, `zagraj("nazwa")` w `src/lib/gra/dzwiek.ts`. Muzyka na czas efektu ściszana (np. do 40%) i z powrotem. Brakujący plik = cisza, jak przy muzyce.
- Wyłącznik efektów w pilocie obok muzyki (osobny albo razem z nią, do ustalenia).
- Zdarzenia z faz i czasów, które TV już zna (`stan.faza`, `faza_do`), bez nowych komunikatów z bazy.

Lista do wybrania z Łukaszem (styl „bar”: kapsel, nalewanie, brzęk szkła, dzwonek):
1. Dołączenie gracza w poczekalni (krótki „pop”/kapsel).
2. Odliczanie 3-2-1 przed pytaniem i tykanie ostatnich 5 s.
3. Koniec czasu (gong albo dzwonek barowy).
4. Odsłonięcie dobrej odpowiedzi (ding).
5. Ruch w wyścigu po pytaniu (nalewanie piwa do szklanki), wskoczenie nad kreskę.
6. Koniec etapu (dzwonek „ostatnia kolejka”) i plansza nowego etapu.
7. Finał: krok gracza, dobiegnięcie do szklanki.
8. Werble przed podium i fanfara przy odsłonie miejsc.

Do ustalenia: skąd pliki (darmowe CC0 z freesound.org, wygenerowane, albo proste tony z Web Audio do tykania), głośność względem muzyki, czy efekty grają też na ekranie lokalu między grami (raczej nie).

### Zgłoszone wieczorem 24.10 (do zrobienia)

- ✅ (25.10, „Pijany finał: wejście, pula i komentarze”) **Pijany finał powtarzał pytania** w teście muzycznym (pula 10 pytań, telefon po końcu puli zaczyna od nowa) i chyba trwał dłużej niż 60 s. Do sprawdzenia, a pytań ma być tyle, żeby w jednej grze żadne się nie powtórzyło (albo bez powtórek po wyczerpaniu).
- **Wyniki gry w panelu:** „Pytań w grze: 63” i „Dobrze 31/63” liczą ciekawostki i całą pulę finału; trzeba liczyć tylko zadane pytania.
- **Kreator z zapowiedzią** (zrobione 24.10/25.10): przełącznik zapowiedzi domyślnie włączony, data i godzina za godzinę (w górę do 5 min), jeden przycisk „Uruchom grę”. Łukasz używał go już na produkcji.

### Poprawki 25.10 (po teście 24.10 wieczorem) ✅

- **Wyścig:** przed finałem najwyżej 90% drogi do szklanki, i to przy komplecie punktów (`DROGA_PRZED_FINALEM` w `src/lib/gra/wyscig.ts`, wcześniej szklanka przy 75% maksimum; w teście 33 tys. z 41,5 tys. po 27 pytaniach stało już przy szklance).
- **Telefon w rankingu:** „Na dobrej drodze” (zielone kółko z ptaszkiem, w walce o finał puchar) albo „Zagrożony odpadnięciem” (czerwony trójkąt), ikony SVG z `src/components/ikony.tsx`, względem najbliższego odcięcia, także gdy to odcięcie jest dopiero za kilka etapów (`najblizszeOdciecie` w `src/lib/gra/odpadanie.ts`), z brakującymi punktami.
- **Plansza wstępu:** więcej miejsca między opisem a ikonami (80 px), szklanka na mecie stoi na linii numerów etapów. **Plansza etapu:** długa nazwa zawija się obok ikony.
- **Wideo wybuchu:** piana spływa i gaśnie 1,3 s przed końcem klipu (wcześniej zjeżdżała zamrożona ostatnia klatka).
- **Finał „15/12 kroków”** z testu: pilot i TV miały jeszcze stary kod (wdrożenie kary było w trakcie gry), który liczył przewagę + dobre bez kary. Baza liczyła już z karą i dlatego seria trwała dalej.
- **Tripel ze zdjęciem:** grafika od Łukasza z ChatGPT (prompt `pyt-tripel` ze `scripts/grafiki.mjs`), przycięta do 4:5, `public/grafiki/pytania/tripel.webp`. **Ikona „Jeszcze zdążę”:** klepsydra z piwem zamiast piasku (od Łukasza z ChatGPT, prompt `etap-jeszcze-zdaze` na magencie, wycięta jak pozostałe ikony). Konto API OpenAI nie ma środków (25.10), więc nowe grafiki na razie przez ChatGPT.

### Boty, automatyczne prowadzenie i zdjęcie nagrody bez AI (25.10) ✅

- **Boty** (migracje `20261025065543_boty_do_testow`, `20261025065610_boty_wolniej`, `src/app/pilot/[kod]/boty.tsx`): w pilocie w poczekalni karta „Boty do testów” i „Dodaj 4 boty” (`dodaj_boty`, nicki „Bot Zenek”, „Bot Halina”…, `gracze.bot`). W pytaniu i w serii finału pilot co 1,5 s woła `boty_odpowiadaj`: za każdym razem część botów bez odpowiedzi odpowiada teraz (w pytaniu wpadają nieregularnie w pierwszych 2–4 s, ale zapisany czas jest udawany, 2–12 s, i od niego liczą się punkty za szybkość: `wewn.udawany_czas_bota`, pilot woła co 0,7 s; w serii co ok. 3,5 s; migracje `20261025071810`–`20261025071844`), zwykłymi `zapisz_odpowiedz` / `zapisz_odpowiedz_serii`, więc punkty, bonus za czas, ranking, odpadanie i finał (z karą) liczą się jak u ludzi. Każdy bot ma stałą „wiedzę” 40–85% dobrych (`wewn.odpowiedz_bota`: dobra albo losowa odpowiedź każdego typu, szacowanie blisko albo daleko). Działa tylko przy otwartym pilocie. Pijanego finału ani kibicowania boty nie robią.
- **Automatyczne prowadzenie** (migracja `20261025070203_automatyczne_prowadzenie`, `src/app/pilot/[kod]/auto.tsx`, `src/app/[kod]/gotowy.tsx`): w pilocie pod muzyką „Prowadzenie automatyczne” (ikona robota) Włącz/Wyłącz (`ustaw_auto`, `sesje.auto`). Otwarty pilot co sekundę sprawdza, co kliknąłby prowadzący (`nastepnyKrok`), i klika to raz na fazę: wynik 6 s → odpowiedzi 6 s → ranking 7 s (koniec etapu 10 s) → dalej; pytanie bez limitu po 45 s; werble 7 s → podium 30 s → tabela (koniec gry klika prowadzący). Na planszach (wstęp, etap, ciekawostka) telefony mają „Gotowy!” (`gotowy`, `gracze.gotowy_od` = `faza_od` planszy); dalej, gdy gotowi są wszyscy grający (boty zawsze; najwcześniej po 5–6 s); od 26.10 bez limitu czasu: automat czeka na wszystkich (zaginionego gracza prowadzący usuwa w pilocie). Start quizu klika prowadzący. Sprawdzone z 4 botami i graczem: od wstępu do 2. pytania sama, ciekawostka, „Gotowy” u gracza od razu puszcza grę dalej.
- **TV przy automacie:** na planszach z „Gotowy” w prawym dolnym rogu „Gotowi x/y” (`GotowiTv` w `tv.tsx`; od 25.10 na górze pośrodku), zielone, gdy gotowi są wszyscy.
- **Kreator:** zapowiedź startu domyślnie włączona (godzina od teraz).
- **Poczekalnia TV:** nicki i awatary mniejsze wraz z liczbą graczy (`src/app/ekran/_ekran/nicki.tsx`, stopnie `.tv-nicki.st-0…4`), a jeśli lista i tak nie mieści się w polu, schodzi o stopień niżej. Sprawdzone: 12 graczy stopień 1, 30 graczy z długimi nickami stopień 4, oba w polu.
- **Pilot:** włączniki muzyki i automatu z ikonami SVG (`src/components/ikony.tsx`) zamiast emotek, przyciski równo po prawej (`.pilot-przelacznik`).
- **Ucięte ogonki liter na TV:** nagłówki przycinane do kilku linii (treść pytania, tytuł quizu w poczekalni, nagłówek odpowiedzi graczy) ucinały „g” i „ę” w ostatniej linii; mają zapas `padding-bottom: 0.2em` z ujemnym marginesem. Pytanie z chmielem: „To dzięki temu piwo ma goryczkę. Co to?”.
- **Odpowiedzi graczy na TV:** wszystkie ramki (dobrze, częściowo, źle) mają tę samą liczbę kolumn liczoną od wszystkich graczy (wcześniej małe ramki zajmowały po kilka wierszy w jednej kolumnie i przy 13 graczach ostatnia wychodziła za ekran), a gdy i tak się nie mieści, ekran gęstnieje o stopień (`gesto`, `bardzo-gesto`, pomiar w `odpowiedzi.tsx`). Sprawdzone: 13 graczy bez zagęszczania, 30 graczy w najgęstszym, oba w ekranie.
- **Szacowanie na TV:** w wyniku pytania złota kreska poprawnej tylko trochę ponad najwyższy stos kropek, więc plakietka z liczbą nie wchodzi na treść pytania, a w trójce najbliższych liczba z jednostką się nie łamie („8,5 %”). Na ekranie odpowiedzi graczy podpisy omijają plakietkę poprawnej, a pod osią jest czwarty rząd podpisów (oś wyżej, `--os` w `.tv-os-odp-pole`).
- **Przegląd stylów 25.10:** emotki w interfejsie zamienione na ikony (puchar, megafon, aparat, kłódka, głośnik), wszystkie ikony w jednym pliku `src/components/ikony.tsx` (wcześniej trzy osobne), plansza etapu sama się zagęszcza, gdy opis z finalistami nie mieści się na ekranie (`.ciasno-1/2`, na planszy finału z karą lista finalistów wypadała pod ekran), bez zbędnych zapasowych kolorów przy `--kamien3`. Zasady (ikony, dopasowanie do ekranu, kolory statusów) w `DESIGN-SYSTEM.md`.
- **Odpadanie na TV:** „zostaje 6” i „do finału 3” na planszy wstępu i etapu jasnym złotem zamiast czerwieni (to informacja, nie ostrzeżenie). Czerwone zostaje tylko „zagrożony” pod kreską w wyścigu i rankingu. Numer finału na drodze wstępu był celowo pełny (złoty); od 26.10 wygląda jak pozostałe.
- **Podium:** dalsze miejsca (od 4. do ostatniego, nawet 30) w jednej linii, która przesuwa się w bok bez końca, gdy się nie mieści (`PasekDalej` w `ranking.tsx`, ok. 70 px/s, brzegi gasną maską). Wcześniej tylko 4.–10. w dwóch rzędach.
- **Finał na TV:** przed metą awatar dochodzi najwyżej do 85% drogi (11 kroków), do szklanki dopiero na 12. kroku (`DROGA_PRZED_META` w `src/lib/gra/final.ts`), żeby nikt nie stał przy piwie przed samym końcem.
- **Zdjęcie nagrody bez przeróbki AI:** kreator wysyła samo zdjęcie (`/api/nagroda` tylko zapisuje w `grafiki/nagrody/<dzień>/`), wybór „po przeróbce / oryginał” zniknął. Aplikacja nie woła już OpenAI.

### Po teście 25.10 po południu (gra MKRJ z botami)

- **Podium bez fanfary:** od razu gra `podium.mp3` (Łukasz: fanfara brzmiała głupio). Plik i synteza fanfary zostają w `src/lib/gra/efekty.ts`, ale nic jej nie woła. **Werble na TV bez napisu** (słychać je), napis „Werble…” zostaje na telefonach.
- **Muzyka w pijanym finale:** w Chrome nic jej nie zatrzymuje na starcie (sprawdzone podsłuchem `play`/`pause`). Z botami seria trwa ok. minuty, więc pętla 98-sekundowego `final.mp3` wypadała w pijanym finale. Pętla przełączała się na drugi odtwarzacz i przewijała go na 3,6 s (`currentTime`), a na Samsungu po takim skoku muzyka już raz cichła. Teraz pętla i każdy start utworu wczytują plik od nowa (`a.src = plik`), nigdy nie przewijają, a utwór wraca od początku (zniknęło `petlaOd`). Na Samsungu niesprawdzone.
- **Szklanka przed wybuchem:** TV chował naszą szklankę, gdy wideo zgłosiło granie. Samsung grał dźwięk klipu, ale obrazu nie było widać, więc piwo znikało bez wybuchu. Teraz szklanka zostaje do chwili wybuchu w klipie (`WYBUCH_S`) i wtedy sama pęka (`szklanka-peka` w `tv.css`: błysk, powiększenie, zniknięcie w 0,45 s). Czemu Samsung nie pokazuje wideo (podejrzane `mix-blend-mode: screen` albo przejście `opacity` na elemencie wideo), jeszcze nie wiadomo.
- **Po teście w Chrome i Safari:** kibic (nie finalista) w pijanym finale nie dostaje dogrywki, tylko ekran kibica z „Finał trwa! Patrz na telewizor.” bez przycisków (`gracz.tsx`, `kibic.tsx`). Hasło „Gaz do dechy” zamienione na „Jedziesz, [awatar]!” (ten sam numer 7 w bazie). Dymek okrzyku na TV bez dwukropka po nicku kibica (nick i tak jest bursztynowy). W wyścigu po pytaniu nie ma już szumu „jazdy” na starcie, zostaje „fiuu” przy zamianie miejsc. Szklanka w klipie wybuchu w Chrome jest jaśniejsza, bo nasza szklanka stoi teraz pod wideo do chwili wybuchu (`screen` sumuje jasność); to cena za to, że na Samsungu piwo nie znika bez wybuchu.
- **Pijany finał bez przerw i migania:** muzyka już nie ma dziur w głośności (zostaje rozciąganie taśmy i łagodniejsze, wolniejsze falowanie głośności), a ekran TV nie mruga na wejściu (`mrugniecie-tv` usunięte, zostaje podskok `czkawka-tv`). Łukasz: przerywanie to bardziej psucie się sprzętu niż pijaństwo.

### Pijany finał ✅ zrobione, opis w „Pijany finał: wejście, pula i komentarze (25.10)”

Stan przed zmianą: wspólna pula `pijane_pytania` (10 pytań, panel → Quizy → Pijany finał), każde z przeszkadzaczem i polami komentarzy po ✓ i ✗ (na razie puste). Kolejność to `nr` plus losowe przesunięcie do 4 miejsc na grę. Wstawki `{za_barem}` i `{lokal}`. Stałe 60 s według zegara serwera (`src/lib/pijany.ts`). Prowizorka 24.10: własne pytania „Muzyki ponadczasowej” w `pijane_pytania_quizu`.

Do zaprojektowania razem:
1. **Pytania i komentarze:** nowa lista z komentarzami po ✓ i ✗ (Łukasz chciał to ułożyć wspólnie). Komentarze krótkie, do 80 znaków.
2. **Płynne wejście:** pierwsze 2–3 pytania brzmią jak dalszy ciąg prawdziwego finału (temat quizu), potem coraz dziwniej. Propozycja: pytania „wejścia” per quiz (z prowizorki zrobić porządną funkcję: w panelu przy quizie), a dalej wspólna pula absurdu. Wtedy losowanie kolejności tylko w części wspólnej.
3. **Porządek po prowizorce:** `pijane_pytania_quizu` do panelu (lista przy quizie) albo zastąpienie powyższym.
4. Pomysły z POMYSLY.md: „wyniki ankiety” z dogrywki na TV, kilka klipów wybuchu losowanych na grę.

### Pijany finał: wejście, pula i komentarze (25.10) ✅

- **Wejście z tematu quizu** (migracja `20261025075623_pijane_pytania_wejscie_i_pula`): `pijane_pytania(kod)` daje najpierw pytania wejścia quizu (`pijane_pytania_quizu`, po kolei), a po nich wspólną pulę (`pijane_pytania`, kolejność z listy z losowym przesunięciem 0..4 miejsca z id gry). Wcześniej własne pytania quizu zastępowały pulę (prowizorka 24.10). Wejście ma 3 pytania w „Piwnym quizie” i w „Muzyce ponadczasowej”: pierwsze brzmi jak zwykłe pytanie finału, drugie trochę dziwnie, trzecie już absurdalnie. Nie powtarzają faktów z pytań quizu.
- **Panel:** przy quizie (tylko główny) sekcja „Pijany finał: wejście” z liczbą pytań i stroną `/admin/quizy/[id]/pijany` (ten sam formularz co pula, do 5 pytań, może być puste). Wspólna pula do 60 pytań (`LIMITY_PIJANE`), w opisie, że powinna mieć przynajmniej 25.
- **Większa pula bez powtórek** (migracja `20261025075719_pijane_pytania_nowa_lista`): 30 pytań, każde z komentarzem po ✓ i po ✗, od łagodnych („Szklanka piwa jest zawsze do połowy pełna”) przez absurd do zapowiedzi wybuchu na końcu („Nie patrz na telewizor”, „Zaraz coś pęknie”, „To już ostatnie pytanie”). Razem z wejściem 33 pytania; szybki gracz przechodzi w 60 s ok. 15–20 (reakcja rośnie od 1 do 3,5 s). Telefon już nie zaczyna puli od nowa: po ostatnim pytaniu zostaje sam pasek, jak po końcu prawdziwej serii. Więcej ogólnych komentarzy (`KOMENTARZE_OGOLNE`), choć wszystkie pytania mają teraz własne.
- **„Trwał ponad 60 s”:** baza daje równo 60 s, a werble przychodzą ok. 1,5 s po końcu (sprawdzone 25.10). Wrażenie dłuższego czasu daje zegar, który celowo liczy też w górę (`zegarPijany`).
- **MCP a usuwanie danych:** migracja z `delete` (także z `WHERE`) została odrzucona, więc nowa lista nadpisuje stare wiersze po `nr`, a zbędne pytania prowizorki usunąłem jednorazowym skryptem z kluczem serwisowym z `.env.local` (`SUPABASE_SECRET_KEY`).
- Sprawdzone lokalnie na grze testowej: wejście leci pierwsze („Pytanie 31”, „Piana na piwie…”), komentarz po odpowiedzi, 33 różne pytania w kolejności, zapis wejścia w panelu.

### Efekty dźwiękowe na TV (25.10) ✅

- **Silnik** (`src/lib/gra/efekty.ts`): Web Audio, jeden `AudioContext` wznawiany tym samym gestem co muzyka (OK na pilocie TV). Każdy efekt ma wersję z syntezy (oscylatory i filtrowany szum), więc gra bez plików; plik `public/dzwieki/<nazwa>.mp3` o nazwie efektu gra zamiast syntezy. `nalewanie` jest tylko z pliku (bez pliku cisza). Głośność efektów 0,6 (muzyka 0,55), bez ściszania muzyki.
- **Kiedy** (`src/app/ekran/_ekran/efekty.tsx`, `EfektyTv` w `tv.tsx`), ze zmian stanu, który TV już zna: `pop` przy nowym graczu w poczekalni, `odliczanie` 3-2-1 i `start` pytania, `tik` w ostatnich 5 s pytania z limitem, `gong` przy końcu czasu, `ding` przy odsłonie dobrej odpowiedzi, `dzwonek` („ostatnia kolejka”) przy rankingu po ostatnim pytaniu etapu, `nalewanie` przy zwykłym rankingu, w finale serią `krok` za dobrą i `pudlo` za złą odpowiedź, `werble` (grają, aż zmieni się faza, także po pijanym finale) i `fanfara` z talerzem przy podium. W pijanym finale żadnych efektów (psuje się muzyka, wybuch jest w wideo). Pierwszy stan po wczytaniu strony nic nie gra.
- **Wyłącznik:** ten sam co muzyka (`sesje.muzyka`), w pilocie „Muzyka i dźwięki na TV”. Ekran lokalu między grami jest cichy.
- Sprawdzone lokalnie (TV 1920×1080, 4 boty, fazy przez `pilot_akcja` i SQL): każdy efekt wywołany raz we właściwej chwili, licząc wywołania Web Audio. Nie sprawdzone uchem ani na Samsungu.

### Poprawki po teście 25.10 przed południem ✅

- **Odpowiedzi graczy na TV:** w zielonej ramce „Dobrze” bez kolumny odpowiedzi (wszystkie są takie same, dobra była już na ekranie wyniku), nicki mają więcej miejsca (`.tv-odpowiedzi-wiersz.bez-odp`). Częściowo i źle dalej z odpowiedzią.
- **„Jak grać?” na ekranie lokalu:** 3. krok bez „im szybciej, tym więcej punktów” (o szybkości mówią plansze etapów): „Odpowiadaj na telefonie, a wyniki zobaczysz na tym ekranie.”
- **Boty:** nicki „Zenek Bot”, „Halina Bot”… (najpierw imię; migracja `20261025081320_boty_imie_przed_bot`).
- **Rozgrzewka bez statusu:** w 1. etapie telefon nie pokazuje w rankingu ani „Na dobrej drodze”, ani „Zagrożony odpadnięciem”, chyba że ktoś odpada już po 1. etapie.
- **Odliczanie „75” przed „3”:** zegar TV i telefonu stoi poza fazami z odliczaniem, więc pierwsza klatka odliczania liczyła się od starej godziny. Teraz `useCzasSerwera` odświeża się od razu przy wejściu w fazę z zegarem, a liczba jest przycięta do 3 (`sekundaOdliczania`, `ODLICZANIE_S` w `src/lib/gra/nasluch.ts`), na TV, telefonie i w pilocie. Sprawdzone: TV po 10 s na planszy etapu pokazał tylko 3, 2, 1.
- **Plansza etapu bez „Kto pierwszy, ten lepszy”** (TV i telefon): przy etapie bez limitu czasu nic, o szybkości mówi opis etapu. Czas na odpowiedź albo serię zostaje, gdy jest.
- **„Gotowi x/y” na górze pośrodku** (mniejsze): w prawym dolnym rogu zasłaniało podpis pod demo telefonu, w lewym przyciski etapu finału. Na górze między logo lokalu a numerami etapów jest wolny pas na wszystkich planszach z „Gotowy”. Sprawdzone skryptem (czy tekst lub obraz leży pod plakietką, z próbą kontrolną): wstęp, etapy 1, 4 i 5, ciekawostka.
- **Awans w wyścigu:** każdy tor startuje na miejscu sprzed pytania (z tamtym numerem), a pod koniec jazdy awatarów (2,6 s od wejścia) tory przesuwają się na nowe miejsca; kto awansował, przejeżdża nad innymi, numer zmienia się razem z zamianą, a przy nicku pojawia się „▲ 2” (o ile miejsc w górę; gdy przeskoczył kreskę, zostaje plakietka kreski). `ZAMIANA_OD_S`, `ZAMIANA_S` w `ekran/_ekran/wyscig.tsx`.
- **Plansza finału bez „Reszta kibicuje…”** (ledwo się mieściło).
- **Ekrany końcowe:** podpis z quizem i lokalem pod podium kremowy (`--piana`) zamiast szarego.
- **Dźwięki łagodniej** (Łukasz: „mniej dzwoniące”): `ding` to dwa ciepłe tony w górę, `gong` miękkie niskie „bum”, `dzwonek` końca etapu trzy miękkie tony w dół. Nowe w wyścigu: `jazda` (szum narastający razem z awatarami, od 0,8 s) i `zamiana` („fiuu” i dwa tony w górę, gdy tory zamieniają się miejscami); gra je `WyscigTv`.
- **Nagrania dźwięków od Łukasza** (`public/dzwieki/*.mp3`, wygenerowane z opisów): przycięte z ciszy na początku i końcu i wyrównane do szczytu −3 dB (ffmpeg, pliki źródłowe miały szczyty od −20 do 0 dB i do 2 s ciszy na starcie), razem 300 KB. `zmiana.mp3` nazwane `zamiana.mp3` jak efekt. Kroki w finale na zmianę z `krok-1` i `krok-2` (`WARIANTY`), werble z pliku w pętli, aż prowadzący pokaże podium: po narastaniu w kółko równy kawałek 5,15–5,65 s (szew w przerwach między uderzeniami) (`WERBLE_PETLA_S`), bez uderzenia kończącego z końca pliku, głośności częstych i tła mniejsze (`GLOSNOSC_EFEKTU`). Synteza zostaje jako zapas, gdy pliku brak. W finale bez dźwięku zamiany torów (każdy ma swoją drogę). Sprawdzone na TV: kroki 1-2-1, werble w pętli, fanfara z pliku.
- **Szacowanie na TV:** bez napisów „← za mało” i „za dużo →” przy osi (oczywiste, a brzydkie). Na telefonie gracz dalej widzi, o ile się pomylił.
- **Automat stał na rankingu do 2 minut:** pilot był w Safari w tle, a ukryta karta budzi minutniki raz na minutę (w logach kliknięcia automatu zawsze ok. :15–:22 każdej minuty). Teraz automat i boty prowadzi też TV, które jest zawsze na wierzchu: przy włączonym automacie co 1,5 s woła `/api/auto` (`useAutoZTv` w `ekran/_ekran/auto.ts`), a trasa kluczem serwisowym czyta `pilot_stan`, każe botom odpowiadać i klika krok z `nastepnyKrok` (`src/lib/gra/auto.ts`, wspólne z pilotem). Krok idzie przez `auto_krok(kod, host_token, faza_od, akcja)` (migracje `20261025081443_auto_krok`, `pilot_stan_dla_serwera`): przechodzi tylko z fazy, którą widział wołający, z blokadą wiersza, więc pilot i kilka ekranów naraz nie przeskoczą fazy. Pilot też klika przez `auto_krok`. Sprawdzone z samym TV (bez pilota) i 4 botami: wstęp → etap → pytania, wynik, odpowiedzi i ranking po ok. 7 s każdy.

### Pijany finał w grupach, stałe utrudnienia, ciekawostka z dźwiękiem (25.10) ✅

- **Dwie grupy pytań** (migracje `20261025092329_pijane_pytania_grupy`, `20261025092753_pijane_pytania_piec_piwnych`): `pijane_pytania.piwne`. W dogrywce najpierw wejście quizu (po kolei), potem **5 losowych złotych** (piwne, w każdej grze inne), potem wszystkie szare losowo; bez powtórek. Oznaczone piwne: 11 pytań o piwie, w tym nowe „Wszyscy lubią się napić Żubra, tylko tak gadają.” (✓ „No wiadomo.”, ✗ „Kogo chcesz oszukać?”). Pytania „na koniec” („Zaraz coś pęknie”, „To już ostatnie pytanie”) przez losowanie nie stoją już na końcu.
- **Utrudnienia według pozycji, nie pytania:** `KOLEJNOSC_EFEKTOW` w `src/lib/pijany.ts` (brak, brak, drżenie, brak, kolory, pion, drżenie, mgła, samoklik, ucieczka, kolory, obrót, mgła, ucieczka, pion, obrót, dalej chaos). Kolumna `efekt` zostaje w bazie nieużywana, panel jej nie pokazuje.
- **Panel → Pijany finał:** dwie grupy kolorami (złota „Na początek”, szara „Potem”), przy pytaniu „↓ Potem” / „↑ Na początek” i usuń, w każdej grupie „+ pytanie” i „Wklej kilka naraz” (pytanie w linii, komentarze po kresce: `pytanie | po ✓ | po ✗`). Wejście quizu bez zmian (po kolei, ze strzałkami), bez wyboru przeszkadzacza.
- **Ciekawostka ma swój dźwięk** (`ciekawostka`: miękki błysk w górę jak zapalona żarówka, synteza; plik `public/dzwieki/ciekawostka.mp3` go zastąpi). Wcześniej grał „ding” dobrej odpowiedzi.
- **Dźwięk planszy odpowiedzi graczy** (`odpowiedzi`): ten sam plik co „ding”, odtworzony w tempie 0,78 (niżej i wolniej, jak echo odsłony; `TEMPO` i `WARIANTY` w `src/lib/gra/efekty.ts`).
- **Szklanka w rankingu na telefonie niżej** (`.moj-wyscig`, 36 px odstępu od miejsca i statusu).
- **Nowe zdjęcie tripla** (od Łukasza z Gemini, w stylu promptu `pyt-tripel`): poziome 1280×853 jak pozostałe grafiki pytań, `public/grafiki/pytania/tripel.webp` (wcześniej pion 960×1200).
- **„Ding” przytłumiony:** wysokie tony z pliku obcięte filtrem (ok. −3 dB powyżej 3 kHz względem całości).
- **Automat szybciej po pytaniu:** wynik 4 s, odpowiedzi 4 s, wyścig 4,5 s, koniec etapu 7 s (było 6/6/7/10; `PO_PYTANIU` w `src/lib/gra/auto.ts`).
- **Zapowiedź na kilka dni naprzód:** „Start w środę 28.10 o 19:00 · za 3 dni” (`kiedyStart`, `opisOdliczania` w `src/lib/gra/zapowiedz.ts`; wcześniej sama godzina, jakby dziś) na ekranie lokalu, TV gry, pilocie i telefonie. Na planszy zapowiedzi po pierwszym OK raz gra „ding” (`ProbaEfektow` w `ekran-lokalu.tsx`), żeby obsługa sprawdziła też efekty. Instrukcja w `docs/TEST.md`. Sprawdzone na lokalu testowym.
- **Plansza etapu na TV:** nazwa od lewej (w linii z „Etap X z Y” i opisem), ikona etapu za nazwą po prawej. To jedyny ekran z ikoną obok nazwy (na wstępie ikony stoją nad numerami, telefon ich nie ma). W demo telefonu „Pils” zamiast „Pilzner”.
- **Muzyka poczekalni nie zaczyna się od nowa** przy otwarciu poczekalni z ekranu zapowiedzi: wspólne odtwarzacze czekają 5 s (było 0,3 s), zanim uznają, że nikt nie przejął muzyki (`ZAPAS_WYMIANY_MS` w `muzyka.tsx`). Na produkcji Łukasz trafił na ciszę do odświeżenia. Sprawdzone lokalnie: po `otworz` ekran przeszedł w poczekalnię bez żadnego `pause`, `play` ani przewinięcia utworu.
- **Muzyka bez wyciszeń:** na końcu etapu urywa się razem z dzwonkiem (było 4 s wyciszania), a nowy utwór wchodzi od razu na pełną głośność (było 1,5 s podgłaśniania; utwory mają własne wstępy). Łagodne wejście zostało tylko przy powrocie pętli od środka utworu.
- **Większe logotypy na planszach startowych ekranu lokalu:** zwykła 440/460 px (było 360/380), zapowiedź 400/420 px (było 260/280).

### Telewizor: wygaszacz, kursor, stare przeglądarki, podgląd linku (25.10) ✅

- **Badanie** (dwa przebiegi po kilku agentów, źródła: strony Samsunga, specyfikacja silnika WWW Samsunga, fora właścicieli): wygaszacz OLED Samsunga włącza się po 2 min bez pilota w każdej wbudowanej aplikacji i według Samsunga „nie da się go wyłączyć”. Strona go nie zatrzyma (Wake Lock nie istnieje w przeglądarce Tizen, wideo i muzyka nie pomagają; potwierdził test Łukasza na domowym OLED: czarny ekran z cieniami przy grającej grze). Wyłączyć go może tylko pakowana aplikacja Tizen (`webapis.appcommon.setScreenSaver`, tryb dewelopera i certyfikat; niepewne przy OLED) albo obraz z HDMI. Auto Power Off (4 h, UE) i Auto Power Saving da się wyłączyć w menu (lista w `docs/TEST.md`).
- **Silnik przeglądarki Samsunga według roku:** 2025 Tizen 9 = Chromium 120, 2024 = 108, 2023 = 94, 2022 = 85, 2021 = 76, 2020 = 69, 2019 = 63. Next 16 celuje w Chrome 111+, więc tylko modele 2025+ pokażą ekran (u mamy Łukasza czarne tło). Obsługa starszych (browserslist w dół, polyfille) jest w POMYSLY.md.
- **Kursor przeglądarki Samsunga** nie da się ukryć ze strony (`cursor: none`, pointer-events, Pointer Lock nie działają; tylko pakowane aplikacje mają przełącznik).
- **Sprzątanie:** usunięte wideo czuwania (`public/wideo/czuwanie.mp4`, `useWideoCzuwania`); zostaje Wake Lock (działa na laptopie i przystawce z Chromium).
- **Podgląd linku do ekranu** (Messenger itp.): `src/app/ekran/[adres]/opengraph-image.tsx` (1200×630: białe logo Bractwa, logo lokalu, „Quiz Bractwa Piwnego” i nazwa lokalu w Open Sans z Google Fonts) i tytuł „Ekran quizu · <lokal>” z opisem w `generateMetadata`. Messenger trzyma podgląd w pamięci, więc stary link może pokazywać stary podgląd.
- **Szacowanie na TV:** plakietka poprawnej odpowiedzi 32 px niżej, w polu osi (przy dwuwierszowym pytaniu wchodziła na linię nagłówka).
- **Szklanka wyścigu:** 48 bąbelków zamiast 26. **Nalewanie:** do 6 plików na zmianę (`nalewanie-2.mp3`…, brakujące pomijane).

### Prosty ekran TV dla starszych przeglądarek (25.10, wieczór)

- **Po co:** starsze telewizory (Samsung przed 2025 = Chromium 69–108) pokazywały na `/ekran` czarny ekran. Przyczyny: Next 16 kompilował kod pod Chrome 111+, biblioteka `motion` woła `queueMicrotask` (Chrome 71+) od razu przy wczytaniu, a CSS pełnego ekranu używa rzeczy, których stare Chrome nie zna (`translate`/`scale` jako osobne właściwości ×62, `gap` we flexie ×175, `color-mix` ×15, `:has` ×9, `aspect-ratio`).
- **Kompilacja pod Chrome 69:** `browserslist` w `package.json` (`chrome 69`, reszta jak domyślnie w Next 16). Sprawdzone narzędziem `es-check`: zbudowany kod przechodzi jako ES2019 (Chrome 69 ma wszystko z ES2019 poza funkcjami uzupełnianymi niżej).
- **Polyfille** (`src/lib/polyfille.ts`, czyste ES5, wstawione na początku `<head>` w `app/layout.tsx`): `globalThis`, `queueMicrotask`, `.at()`, `Object.hasOwn`, `Object.fromEntries`, `String.replaceAll`, `String.matchAll`, `Promise.allSettled`. Każde tylko wtedy, gdy przeglądarka danej funkcji nie ma.
- **Prosty ekran** (`src/app/ekran/_prosty/prosty.tsx` + `prosty.css`): te same dane, automat, muzyka i efekty co pełny ekran (`Tv` w `tv.tsx` tylko inaczej rysuje), każda faza jako statyczna plansza: zapowiedź i plansza lokalu, poczekalnia z QR i nickami, wstęp, etap, odliczanie, pytanie każdego rodzaju (pary w dwóch kolumnach do czasu wyniku), wynik z rozkładem głosów, ciekawostka, odpowiedzi graczy, ranking z kreską odcięcia, finał z paskami kroków, podium, tabela. CSS bez `gap` we flexie (marginesy), bez osobnych `translate`, bez `color-mix`, `:has`, `inset`, `aspect-ratio`, `min()/max()`. Pijany finał na prostym ekranie to dalej plansza finału (bez chaosu i wideo), więc na starym TV lepiej go nie włączać.
- **Kiedy się włącza** (`src/lib/gra/prosty.ts`): sam, gdy przeglądarka nie zna `color-mix()` (Chrome przed 111, czyli każdy Samsung przed 2025), albo ręcznie `?prosty` w adresie (`/ekran/<lokal>?prosty`); `?pelny` wymusza pełny. `/tv/<kod>` przekazuje parametry dalej.
- Sprawdzone w zwykłej przeglądarce z `?prosty` na grze z botami (wszystkie fazy powyżej); pełny ekran bez parametru bez zmian. **Nie sprawdzone na prawdziwym Chrome 69:** pobrany Chromium 69 jest na Intela i wymaga Rosetty (`softwareupdate --install-rosetta`), a najlepiej sprawdzić u mamy Łukasza.
- **Plansza etapu zagęszcza się też po wczytaniu obrazków:** pomiar „czy się mieści” był raz, na starcie; gdy logo lokalu i ikona etapu wczytały się później, lista finalistów wyjeżdżała pod ekran (zgłoszenie Łukasza z TV). Teraz `ResizeObserver` powtarza pomiar, gdy opis urośnie (`etap.tsx`).
- **Nalewanie:** 5 nagrań (`nalewanie.mp3`, `nalewanie-2…5.mp3`; nowe od Łukasza przycięte do 4 s z wyciszeniem, żeby nie wchodziły na odliczanie następnego pytania), grają po kolei.

- **Sprawdzone na prawdziwym Chromium 69** (25.10 wieczorem, macOS z Rosettą, bez okna, sterowany przez protokół DevTools): ekran lokalu, poczekalnia z QR i botami, wstęp, plansza etapu, pytanie (wybór, szacowanie z grafiką, pary), wynik, odpowiedzi, ranking, finał serią i podium. Bez wyjątków JS; 404 to tylko brakujące, opcjonalne pliki dźwięków. Poprawki po teście: logo Bractwa jako osobny biały plik `public/loga/bractwo-biale.svg` (minifikacja zmienia `filter: invert(1)` w `invert()`, którego Chrome 69 nie zna, i logo było czarne), zegar finału bez wielkiego „S”. Uruchomienie: `Chromium --headless --no-sandbox --remote-debugging-port=…` (bez `--no-sandbox` pada na nowym macOS, a `--screenshot` nie kończy się przez Realtime). Telewizora z Chrome 69 nadal nikt nie widział.

### Automat od godziny startu, szablony quizu (25.10, wieczór) ✅

- **Automat w kreatorze gry:** „Prowadzenie automatyczne” w panelu (Uruchom quiz → Prowadzenie), zapisuje `sesje.auto` od razu przy zakładaniu gry. Na stronie gry w panelu widać „prowadzenie automatyczne”. Pilot dalej włącza i wyłącza automat w każdej chwili.
- **Zapowiedź + automat** (od 26.10 inaczej, patrz niżej: poczekalnia 5 min przed godziną, quiz o godzinie): o godzinie startu poczekalnia otwiera się sama (QR na TV), a po `NA_ZAPISY_MIN` = 5 minutach automat startuje quiz, jeśli dołączył choć jeden gracz (bez graczy czeka). Otwiera pierwszy, kto zapyta po czasie: ekran lokalu (`otworz_zaplanowane(adres)` co 5 s po godzinie startu, sam `ekran_lokalu` tylko czyta), TV gry albo pilot (`nastepnyKrok` → `otworz`, potem `nastepne`; TV woła `/api/auto` także w poczekalni) albo telefon gracza (`dolacz` przez `wewn.otworz_o_czasie`). Bez godziny start klika prowadzący, dalej prowadzi automat. Migracja `auto_otwarcie_poczekalni`.
- **Godzina w poczekalni:** po otwarciu przez automat TV (pełny i prosty ekran) i pilot pokazują start automatu („Start o 19:05 · za 4:12”, `startPoczekalni` w `src/lib/gra/auto.ts`), zapowiedź przed otwarciem dalej godzinę z kreatora.
- **Szablony nowego quizu (rodzaj quizu, 26.10):** w kreatorze najpierw rodzaj, pod nim tytuł i opis. „Wyścig po piwo” ma stałe konkurencje jak Piwny quiz Bractwa, z ich nazwami, opisami i ikonami: Na jedno 10, Jednak więcej 8, Ile? 5, Jakoś się ułoży 6, Jeszcze zdążę (finał trójki) 14. Kreator ich nie zmienia, serwer bierze je z `SZABLONY_QUIZU` po kluczu. „Klasyczny pub quiz” nie ma etapów ani finału. Etapy wyścigu można dalej poprawiać na stronie quizu; szablony etapów w formularzu etapu to te same konkurencje plus degustacja.
- **Pijany finał tylko w wyścigu po piwo:** kreator gry pokazuje opcję tylko przy quizie z finałem serią (`QuizDoWyboru.wyscig`), serwer bez takiego finału jej nie włączy, a strona quizu bez finału nie ma sekcji „Pijany finał: wejście”.
- **Quiz bez etapów:** strona quizu nie ma „+ Dodaj etap”, a nowe pytanie dostaje rodzaj ostatniego pytania (bez ciekawostek), dopóki prowadzący go nie zmieni.
- **Wybór w panelu kolorem:** wybrany szablon quizu ma złote wypełnienie i ciemny tekst jak wybrany czas (zamiast złotej obwódki z poświatą); zasada w `docs/DESIGN-SYSTEM.md`.
- **Sprawdzone lokalnie** (build, ekran `test-naglowka`): zapowiedź sama przeszła w poczekalnię z QR, bez graczy po czasie gra czekała, po dodaniu botów ruszyła (`wstep`); `dolacz` po godzinie wpuścił gracza do zamkniętej poczekalni. Kreatory obejrzane w panelu.

### Wklejanie pytań do klasycznego quizu (26.10) ✅

- **Po co:** klasyczne quizy hurtem z AI. Na stronie quizu bez etapów sekcja „Wklej pytania”: pole na tekst, podgląd na bieżąco (rodzaj i rozwiązanie każdego pytania, błędy z numerem pytania) i „Dodaj N pytań”. Pod polem prompt do skopiowania (`PROMPT_PYTAN`): dopisuje się temat, liczbę i rodzaje pytań, wkleja do dowolnego czatu z AI, a odpowiedź z powrotem w pole.
- **Format** (`src/lib/import-pytan.ts`, opis na górze pliku): każde pytanie zaczyna się od `[jedna]`, `[kilka]`, `[prawda/fałsz]`, `[liczba]`, `[kolejność]`, `[pary]` albo `[ciekawostka]`; odpowiedzi `+`/`-`, `= prawda`, `= 1,5` z `zakres:` i `jednostka:`, elementy `>` we właściwej kolejności, pary `lewy = prawy`, do 4 linii `podpowiedź:`. Parser zdejmuje numerację, pogrubienia i blok kodu, które dokłada AI. Krok suwaka liczby wynika z miejsc po przecinku.
- **Zapis** (`wklejPytania` w `quizy/akcje.ts`): wszystko albo nic, każde pytanie przez tę samą walidację co formularz (`odczytajZadanie`, mieszanie kolejności i par), na koniec quizu, najwyżej 80 naraz, tylko w quizie bez etapów. Grafiki dodaje się potem w edycji pytania.
- **Prompt** zawiera zasady z CLAUDE.md (trudność rośnie, dobra odpowiedź na różnych miejscach, w „kilka” zmienna liczba dobrych, liczba nie na środku zakresu, ciekawostka po swoim pytaniu i nie na końcu, piwo bez koncernów, „pils”).
- **Prompt z formularza (26.10):** zamiast nawiasów do uzupełniania krok 1 „Prompt dla AI”: temat (domyślnie tytuł i tematy quizu), liczba pytań (do 80), rodzaje (pigułki, domyślnie jedna, kilka, liczba, pary), poziom (łatwy, mieszany, trudny) i „Dodatkowo”. „Kopiuj prompt” kopiuje gotowy tekst (`promptPytan` w `src/lib/import-pytan.ts`: zasady i wzory tylko wybranych rodzajów), podgląd w „Podgląd promptu”. Krok 2 to wklejenie odpowiedzi jak dotąd.
- **Sprawdzone lokalnie:** parser na wszystkich rodzajach i na przykładzie z samego promptu; w panelu nowy klasyczny quiz, wklejone 7 pytań, zapis w bazie z pomieszaną kolejnością i parami; quiz testowy usunięty. Kopiowania promptu nie dało się sprawdzić w panelu podglądu (brak schowka), funkcja ta sama co przy „Kopiuj” linków gry.

### Dwa rodzaje quizów i tematy (26.10) ✅

- **Rodzaj z etapów:** quiz z etapami to „Wyścig po piwo”, bez etapów to „Klasyczny pub quiz” (`quizKlasyczny` w `src/lib/gra/wyscig.ts`, `RodzajQuizu` w `src/lib/tagi.ts`). Bez osobnej kolumny: TV i tak rozpoznawał quiz bez etapów.
- **Tematy:** kolumna `quizy.tagi` (migracja `tagi_quizow`), wpisywane po przecinku przy tworzeniu i w edycji nagłówka quizu (`czytajTagi`: małe litery, bez powtórzeń, do 6).
- **Zakładka Quizy:** przełącznik „Wyścig po piwo / Klasyczny pub quiz” (`?rodzaj=klasyczny`), pod nim filtr tematów (`?tag=`), przycisk nowego quizu danego rodzaju. „Pijany finał: pytania” tylko w zakładce wyścigu. Zapis i usunięcie quizu wracają na zakładkę jego rodzaju.
- **Kreator gry, krok 3:** karty rodzaju z liczbą quizów, tematy jako przyciski, lista quizów już przefiltrowana. Klasyczny bez pijanego finału, kranoprzejęcia i grafiki na poczekalnię (serwer też ich nie zapisze).
- **Klasyczny w grze:** ranking to zwykła tabela, bez wyścigu i szklanki (TV i telefon, `rankingJakoWyscig(stan, n)`); bez grafiki „na pamiątkę” na telefonie; muzyka: poczekalnia jak dotąd, od pierwszego pytania do rankingów `public/muzyka/klasyczny.mp3` (spokojne tło, Łukasz wygeneruje; do tego czasu cisza), podium jak dotąd. Efekty dźwiękowe te same.
- **Klasyczny bez ciekawostek:** prompt ich nie zamawia, wklejanie odrzuca `[ciekawostka]`, edytor pytania nie pokazuje tego rodzaju (stara ciekawostka da się edytować), serwer nie doda nowej.
- **Sprawdzone lokalnie:** lista z zakładkami i filtrem tematów, nowy klasyczny quiz z tematami i wklejonymi pytaniami (ciekawostka odrzucona), kreator gry z wyborem rodzaju i tematu, gra klasyczna z botami: ranking na TV jako tabela. Gra i quiz testowe usunięte.

### Automat startuje o godzinie z kreatora, klasyczny bez nalewania (26.10) ✅

- **Godzina z kreatora to start quizu** (Łukasz, test klasycznego z botami: poczekalnia otworzyła się o godzinie, a quiz czekał jeszcze 5 minut, co wyglądało jak zawieszenie). Teraz poczekalnia z QR otwiera się `NA_ZAPISY_MIN` = 5 minut wcześniej (`otwarcieAutomatu`, w bazie `wewn.otworz_o_czasie`, migracja `poczekalnia_przed_startem`), a quiz rusza o tej godzinie, jeśli ktoś dołączył. TV, pilot i zapowiedź pokazują jedną godzinę: start quizu.
- **Kreator gry:** wybór klasycznego od razu włącza prowadzenie automatyczne (wyścig domyślnie bez); przełącznik dalej działa.
- **Klasyczny bez nalewania:** ranking w klasycznym nie gra dźwięku nalewania (nie ma szklanki). Za to tabela rankingu gra „zamianę” (`fiuu`) w chwili przetasowania, gdy ktoś zmienia miejsce (od 2. pytania, nie w finale), jak zamiana torów w wyścigu.

### Plansza startowa klasycznego pub quizu (26.10) ✅

- **Po co:** klasyczny leci z automatu, a z poczekalni od razu wpadało pierwsze pytanie. Teraz `nastepne` z poczekalni klasycznego (bez etapów) daje fazę `wstep` z `faza_do` = +10 s (migracja `start_klasycznego`, gałąź w `pilot_akcja`). Po czasie pierwsze pytanie startuje samo przez `dokoncz_pytanie` (blokada wiersza, przechodzi tylko pierwsze wołanie), z automatem i bez. `wstep` jest w `zZegarem` (zegar tyka; w wyścigu `faza_do` jest puste, więc nic się nie zmienia), zapas po końcu 0,2 s zamiast 1,1 s.
- **TV** (`ekran/_ekran/start.tsx`): okazja i tytuł quizu, wielkie „Zaczynamy!”, „Pierwsze pytanie za N s” i rząd 10 kresek gasnących po kolei, celowo inaczej niż złote koło 3-2-1 przed pytaniem; podpis z liczbą graczy. Bez plakietki „Gotowi”. Prosty ekran: napis i sekundy. Muzyka poczekalni gra dalej.
- **Telefon:** „Zaczynamy! Pierwsze pytanie za N s”, bez przycisku „Gotowy”. **Pilot:** „Pierwsze pytanie od razu” i ile sekund zostało.
- **Sprawdzone lokalnie:** gra z quizu „Dinozaury” z botami, bez automatu: plansza odliczała, po 10 s samo odliczanie 3-2-1 i pytanie 1. Wyścig dalej wchodzi we wstęp bez zegara.

### Logo lokalu w tle pub quizu, prostszy ekran lokalu, odbudowa Piwnego quizu (26.10) ✅

- **Logo Bractwa z prawego górnego rogu** zniknęło ze wszystkich ekranów gry (komponent `LogoNaglowka` usunięty, nagłówki dosuwają ostatni element do prawej).
- **Klasyczny pub quiz w trakcie gry:** tło `TloLokalu` (`ekran/_ekran/tlo.tsx`, `Scena` z `lokalTla`): przygaszone logo lokalu na cały ekran z wolnym ruchem i dwiema plamami światła; bez logo nazwa lokalu. Wyścig po piwo dalej ma bar i nastroje. Prosty ekran: `ScenaProsta` z `lokalTla` (to samo logo, jeden ruch `transform`).
- **Ekran lokalu:** bez zapowiedzi jeden ekran `EkranLogo` (`ekran-logo.tsx`): duże logo lokalu nad złotym blaskiem, w tle tylko dryfujące ciepłe plamy światła (`Scena lokalTla={null}`; przygaszone logo w tle pojawia się dopiero w trakcie quizu, także TV gry przy zamkniętej poczekalni go nie ma). Zapowiedziany klasyczny: ten sam ekran z okazją, tytułem, godziną i odliczaniem. Zapowiedziany wyścig po piwo: dotychczasowe plansze (lokal z Bractwem, browar, podium ostatniego quizu). Zapowiedź z bazy mówi, czy quiz jest klasyczny (migracja `zapowiedz_rodzaj_quizu`). Prosty ekran: `LogoProste` i `PlanszaProsta` w ten sam sposób.
- **Odbudowa Piwnego quizu Bractwa Piwnego** (Łukasz usunął go przy porządkach): migracja `przywrocenie_piwnego_quizu` z pełnego zrzutu pytań etapów 1–4 z 24.10 (zapis rozmowy), finału ze zrzutu z 24.10 i migracji, etapów w stanie z 26.10 rano, a potem wszystkich późniejszych poprawek danych z migracji. 63 pozycje, 5 etapów, 4 ciekawostki, 11 grafik, pijane wejście; pierwsze pytania każdego rodzaju na tych samych numerach co przed usunięciem. Ręcznych edycji z panelu (jeśli były) nie dało się odtworzyć.
- **Sprawdzone lokalnie i na Chromium 69:** ekran lokalu bez gry, zapowiedź klasycznego, poczekalnia, plansza startowa i pytanie z logo w tle.

### Kosz na quizy (26.10) ✅

- **Po co:** Piwny quiz przepadł po jednym kliknięciu „Usuń”. Teraz „Usuń” na liście quizów przenosi quiz do kosza (kolumna `quizy.usunieto`, migracja `kosz_quizow`), z pytaniem „Przenieść do kosza? Możesz go stamtąd przywrócić.” i komunikatem po przeniesieniu.
- **Kosz** (`/admin/quizy/kosz`, przycisk „Kosz (n)” pod listą): rodzaj, liczba pytań i od kiedy w koszu, „Przywróć” i „Usuń na dobre” (z potwierdzeniem, razem z pytaniami i grafikami z magazynu; nadal niemożliwe, gdy były na nim gry). Usunąć na dobre da się tylko quiz z kosza.
- Quiz z kosza nie pokazuje się na liście, w liczniku na stronie głównej panelu ani przy uruchamianiu gry (serwer też go nie uruchomi). Jego strona dalej się otwiera, z paskiem „Ten quiz jest w koszu” i przyciskiem „Przywróć”. Trwająca gra z takim quizem gra dalej (dane zostają).
- Kosz nie opróżnia się sam.
- **Sprawdzone lokalnie:** do kosza, przywróć, znów do kosza, usuń na dobre (wiersz zniknął z bazy).

### Pijany finał na OLED: pewny wybuch, muzyka bez przerywania (26.10) ✅

- **Szklanka nie wybuchała** na Samsungu (test Łukasza: szklanka tylko lekko urosła). Wideo (2,4 MB) wchodziło na scenę 7,5 s przed końcem i miało ruszyć 4,5 s przed końcem; przy wolniejszym Wi-Fi telewizor nie zdążał go wczytać. Teraz klip pobiera się w tle zwykłym `fetch` już od finału serią (`wideo-wybuchu.ts`, nie dotyka odtwarzaczy, więc nie ucisza muzyki) i wideo dostaje gotowy adres `blob:`. Gdy przeglądarka nie pozwoli grać z dźwiękiem, druga próba bez dźwięku. Gdy klip mimo to nie ruszy, szklanka i tak pęka 0,8 s po zaplanowanym wybuchu (interfejs się rozpada, muzyka urywa).
- **Muzyka przerywała:** tempo zmieniało się co tyknięcie zegara (4 razy na sekundę), a Samsung przy każdej zmianie `playbackRate` na chwilę gubi dźwięk. Teraz tempo zmienia się najwyżej co 4 s (`ZMIANA_TEMPA_MS`), w krokach 0,01, najwyżej ok. 8% wolniej z lekkim falowaniem w obie strony; bez falowania głośności. Jeśli na TV nadal słychać dziury, zostaje wyłączenie zmian tempa w pijanym finale.
- **Sprawdzone lokalnie:** klip pobrany w finale serią, w pijanym finale grał z pamięci z dźwiękiem, wybuch w zaplanowanej chwili. Muzyki na Samsungu nie dało się sprawdzić lokalnie.
- **OLED / wygaszacz:** bez zmian (Łukasz klika OK na pilocie TV, klik niczego nie zmienia na ekranie).

### Pilot i strony na komputerze, spokojniejsze plansze etapów, muzyka pub quizu (26.10) ✅

- **Pilot:** licznik „Odpowiedziało 4/5” u góry sterowania (`.pilot-licznik`), przy komplecie zielony z „✓ Wszyscy odpowiedzieli”; zostaje też przy wyniku, bo pytanie kończy się samo w chwili ostatniej odpowiedzi. Główny przycisk („Pokaż wynik”, „Pokaż odpowiedzi graczy”, „Pokaż podium”) świeci wtedy na zielono (`.pozytywny`), a „Pokaż wynik” bez limitu nie pyta o potwierdzenie.
- **Komputer (od 960 px):** pilot w dwóch kolumnach (`.pilot`: sterowanie 420 px przyklejone przy przewijaniu, obok podgląd pytania, etapu, serii i graczy), strona szersza (1180 px). Strony z `.kolumna` (gracz, start, logowanie, wybór ekranu) stoją na karcie (600 px) na ciepłym tle zamiast wąskiego paska na czerni. Telefon bez zmian.
- **TV w trakcie pytania:** bez stopki „Odpowiadaj na telefonie · kod gry”.
- **Plansza etapu wyścigu:** ikona (120 px) przed blokiem „Etap X z Y” + nazwa, tytuł 96 px (było 128 px z ikoną 150 px za nazwą), zasady 42 px zwykłą wagą, mniejsze plakietki („10 pytań”), spokojniejsza informacja o odpadaniu.
- **Ekran lokalu:** logo 780 px (z zapowiedzią 540 px), w tle ciepłe smugi z góry, reflektor na środku i ciemne brzegi (`TloLokalu`, także pod klasycznym quizem).
- **Muzyka pub quizu:** trzy utwory do wgrania: `public/muzyka/klasyczny-poczekalnia.mp3` (poczekalnia i plansza startowa, także zapowiedź na ekranie lokalu), `klasyczny.mp3` (pytania i rankingi) i `klasyczny-koniec.mp3` (podium i tabela, raz). Do czasu wgrania poczekalnia i koniec grają obecne utwory (`zapas` w `muzyka.tsx`), tło pytań jest ciche. Prompty do Suno niżej.
- **Prompty do Suno (instrumental):**
  - poczekalnia: „Warm laid-back lounge for a cozy pub before a quiz night, mellow electric piano, soft upright bass, light acoustic guitar, no drums, no build-ups, steady and friendly, 85 bpm, instrumental, seamless loop”
  - tło pytań: „Very subtle ambient background for concentration, soft felt piano and warm pads, slow gentle pulse without percussion, minimal melody, no tension, no risers, calm and neutral, 70 bpm, instrumental, seamless loop”
  - koniec: „Short warm closing tune for the end of a friendly pub quiz, gentle piano and acoustic guitar, soft and satisfied, no fanfare, no brass, no drums, about 40 seconds, instrumental”

### Pijany finał subtelniej, wybuch bez wideo na TV, muzyka na Web Audio (26.10) ✅

- **Przyczyna braku wybuchu na OLED:** wideo z `mix-blend-mode: screen` na Samsungu gra dźwięk, ale obrazu nie widać (sprzętowa warstwa wideo; komentarz z 25.10). Wczytywanie z wyprzedzeniem nie pomogło. Teraz na telewizorze (`czyTelewizor` w `src/lib/gra/telewizor.ts`: Tizen, webOS, VIDAA…; `?tv` wymusza na komputerze) wybuch jest bez wideo, dokładnie `WYBUCH_PRZED_S` przed końcem: błysk, 34 odłamki (szkło z obramowań, krople piwa, piana; bez clip-path), szklanka pęka, nagłówek, zawodnicy i drogi odlatują, po 1,5 s wszystko gaśnie do czerni. Huk `public/dzwieki/wybuch.mp3` wycięty z klipu (od 1,35 s, szczyt −3 dB), efekt `wybuch` (tylko z pliku). Na komputerze wideo jak dotąd; gdy nie ruszy, 0,8 s później ten sam wybuch bez wideo.
- **Subtelniej:** zamiast cofania, spadających dróg i latania awatarów: nagłówek się kołysze (jak było), plansza z drogami buja się (0,6° → 2,8°, okres 9 s), zawodnicy zjeżdżają po drogach w stronę przechyłu (do 6% drogi), awatar lekko się chwieje (bez drżenia i podwójnego widzenia).
- **Nikt nie dojeżdża:** położenia zamrożone z chwili wejścia w pijany finał (ostatni krok serii, który przychodzi razem z przejściem, nie przesuwa już lidera do szklanki).
- **Muzyka:** utwór finału na czas pijanego finału przechodzi z odtwarzacza na Web Audio (`src/lib/gra/muzyka-pijana.ts`, kontekst efektów): ten sam moment utworu, tempo kołysze się płynnie (oscylator 1/9 Hz na `playbackRate`, głębokość do 5%, średnio do 4% wolniej), bez dziur. Utwór dekoduje się już w finale serią. Gdy przejęcie się nie uda, gra zwykły odtwarzacz bez kołysania.
- **Sprawdzone lokalnie:** z `?tv` bujanie, zamrożone położenia, wybuch bez wideo w zaplanowanej chwili i do werbli; bez `?tv` wideo jak dotąd. **Na OLED Łukasza (26.10):** szklanka wybucha, tory odlatują, muzyka kołysze się bez przerw.

### Uczciwsze punkty, szybsze nalewanie, pozorowany wyścig w pijanym finale (26.10) ✅

- **Punkty w jednym miejscu:** `wewn.punkty_odpowiedzi(typ, ocena, czas_ms, limit_ms, bonus, mnoznik)` liczy punkty dla `zapisz_odpowiedz` i udawanego czasu botów (migracja `punkty_precyzja_i_szybkosc`).
- **„Ile?” (szacowanie):** precyzja przed szybkością. Trafienie w punkt 900–1000 (szybciej = więcej), każda odpowiedź obok najwyżej 850 × ocena (szybkość dokłada do 10%). Trafienie zawsze bije szybkie, ale nieprecyzyjne (np. 905 wolno w punkt wobec 831 szybko obok).
- **Szybciej uciekające punkty:** bez limitu czasu punkty spadają od 1000 do 500 w 20 s (było 30 s), a wielokrotny, kolejność i pary w 40 s (było 60 s); `wewn.okno_bez_limitu_ms`. Z limitem jak dotąd (przez cały limit). Opis w kreatorze poprawiony.
- **Nalewanie szklanki:** szklanka nalewa się pytaniami przed finałem, nie wszystkimi (z pulą finału była w połowie przed finałem). Pod koniec ostatniego etapu jest nalana w 95% (`NALANE_PRZED_FINALEM`, `nalanieSzklanki` w `src/lib/gra/wyscig.ts`), a pełna w finale. `stan_sesji` podaje `quiz.liczba_przed_finalem` (migracja `liczba_przed_finalem`).
- **Lider nie stoi przy szklance przed pijanym finałem:** gdy gra ma pijany finał, finał serią rysuje metę jako `DROGA_PRZED_META` (85% drogi) zamiast szklanki (`naDrodzeFinalu(g, bezMety)` w `src/lib/gra/final.ts`; prosty ekran: najwyżej META−1). Zwycięzca też stoi krok przed piwem.
- **Pozorowany wyścig w pijanym finale** (zmienione tego samego dnia, niżej: bez cofania na starcie): na wejściu wszyscy cofają się o 2 kroki, a potem co 3–5 s (każdy w swoim rytmie) robią krok naprzód (58%) albo w tył, płynnie, razem z bujaniem i zjeżdżaniem. Kroki są pseudolosowe z nicku (odświeżenie TV daje to samo), kończą się przy gaśnięciu telefonów, nikt nie przekracza 0,81 drogi (`polozeniePijane` w `pijany.tsx`). Sprawdzone symulacją funkcji; animacji przy schowanym panelu przeglądarki nie dało się obejrzeć, więc warto zerknąć na TV.

### Pijany finał bez cofania, tykanie przed wybuchem, test w panelu, koniec gry na zmianę, klasyczny bez muzyki, loga (26.10) ✅

- **Pijany finał:** gracze zaczynają dokładnie tam, gdzie skończyła się seria (płynne przejście), potem pseudolosowe kroki jak wyżej (najwyżej `DROGA_PRZED_META`, zjeżdżanie dokłada do 2%). Każda droga buja się dodatkowo osobno wokół swojego środka (0,3° → 1,8°, własny okres 7–11 s), a awatary jadą razem z nią (`naBujajacejDrodze`). Na komputerze drogi nie znikają już pod wideo wybuchu, tylko odlatują z wybuchem; szklanka pod klipem jest schowana (Edge: dwie szklanki przed wybuchem). Po zgaszeniu telefonów i muzyki do wybuchu tyka zegar (efekt `tik` co sekundę, `efekty.tsx`).
- **Test pijanego finału:** panel → Quizy → Pijany finał → „Test na ekranie” (tylko główny) zakłada grę bez lokalu z 5 botami, wybraną trójką, losową przewagą i automatem, z krótką serią (start za 15 s, 25 s) i przechodzi na stronę gry, skąd otwiera się ekran w dowolnej przeglądarce. `pilot_akcja` dostało `grant execute … to service_role` (migracja `pilot_akcja_dla_serwera`). Grę usuwa się po teście.
- **Koniec gry:** automat zostaje na podium; TV sam pokazuje na zmianę podium i pełną tabelę co 10 s (pierwsze podium dłużej, o wjazd), od drugiej pętli z „Dziękujemy za grę! Piwu Cześć!” (`KoniecNaZmiane` w `tv.tsx`; kolejne podium bez konfetti). W pilocie na podium tylko „Zakończ grę”: muzyka cichnie (`koniec` bez utworu), a ekran lokalu od razu wraca do logo (`ekran_lokalu` bez 10 minut po końcu, migracja `ekran_lokalu_wraca_po_koncu`). Przycisk „Pokaż plansze na ekranie lokalu” zniknął. Prosty ekran (stare TV) bez zmian.
- **Klasyczny pub quiz bez muzyki** (utwory z promptów nie pasowały, wrócimy innym razem, POMYSLY.md): `utworFazy` zwraca ciszę dla klasycznego (też zapowiedź na ekranie lokalu), w pilocie nie ma przełącznika muzyki. Efekty dźwiękowe grają.
- **Loga:** zawsze lokal z lewej (obok gościnny browar), Bractwo z prawej, wszystkie tej samej wysokości: poczekalnia TV (Bractwo w prawym rogu), nagłówek telefonu (lokal i browar z lewej, „Quiz” na środku, Bractwo z prawej), prosty ekran.
- **„Ile?” ×2:** punkty mnoży etap: Na jedno ×1, Jednak więcej ×1,5, Ile? ×2 (było ×1,5, migracja `ile_mnoznik_2`), Jakoś się ułoży ×2, w Piwnym quizie, Muzyce ponadczasowej i w szablonie etapu (`src/lib/etapy.ts`). Trafienie w „Ile?” daje do 2000.

### Scena na cały ekran, Gotowi przy logo, równoległe drogi, szklanka bez bujania (26.10) ✅

- **Scena wypełnia ekran:** zamiast stałego 1920×1080 między czarnymi pasami scena ma co najmniej 1920×1080 i dochodzi do krawędzi ekranu (`useSkala` w `tv.tsx`: wyższa albo szersza w swoich pikselach). Nagłówek stoi zawsze 64 px od góry, stopka (np. „Odpowiedziało” ze złotą kreską nad nim) 96 px od dołu, niezależnie od kształtu ekranu (sprawdzone 16:9 i 16:10). Plansza dróg ma stałe 1760×780 tuż pod nagłówkiem, w poziomie na środku.
- **Gotowi x/y** na wysokości środka logo lokalu w nagłówku planszy (było za wysoko, przy górnej krawędzi).
- **Drogi finału równoległe** (`drogi()` w `drogi.tsx`), także w rankingu po finale i w pijanym finale.
- **Pijany finał:** plansza i szklanka już się nie bujają (kołysząca się szklanka dublowała się z pierwszą klatką wideo, 26.10 na Edge), każda droga buja się osobno i nieregularnie (dwie fale o różnych okresach, do 2,8°), zawodnik zjeżdża według przechyłu swojej drogi. Klip wybuchu jest przypięty do planszy dróg z przesunięciem `WIDEO_NA_PLANSZY` (80, 199 = miejsce planszy na scenie 16:9 w pijanym finale, zmierzone z pierwszą klatką `docs/wideo/pekniecie-start.png`), więc szklanka klipu trafia w naszą na każdym kształcie ekranu.

### Wybuch z klatek na TV, drogi przy szklance, spokojne wejście, zegar w górę, nowy quiz w rodzaju zakładki (26.10) ✅

- **Wybuch na telewizorze z klatek klipu:** wybuch z CSS wyglądał jak konfetti, a wideo na komputerze wygląda bardzo dobrze. TV rysuje teraz te same klatki na `<canvas>` (Samsung nie pokazuje `<video>` nad treścią): `public/wideo/wybuch/01–58.jpg` (klip od 1,0 do 4,8 s, 15 kl./s, 960×540, razem 1,8 MB, polecenie ffmpeg w `klatki-wybuchu.ts`), wczytywane z wyprzedzeniem w finale serią, numer klatki z zegara serwera, ostatnie 0,6 s gaśnie, huk z pliku. Wybuch z CSS (odłamki) został tylko jako zapas, gdy klatki się nie wczytają. Wczytywanie przez `load`, nie `decode()` (w karcie w tle `decode()` wisiał). Sprawdzone z `?tv` (klasy i płótno), samego obrazu na OLED jeszcze nie.
- **Drogi blisko siebie:** przerwa tylko na awatar z nickiem (grubość + 54 px), trzy drogi zajmują 300 px, mniej niż wysokość szklanki, więc wszystkie prowadzą w nią (skrajne mijały ją z góry i z dołu).
- **Wejście w pijany finał bez drżenia:** bez podskoku ekranu („czkawka”), bujanie dróg, zjeżdżanie i chwianie awatarów rosną od zera.
- **Zegar:** przy pijanym finale seria staje na 0 bez „Koniec!”, a zegar pijanego finału leci w górę od tej samej liczby (`zegarPijany(…, start)`; `start` to sekundy, które zostały w serii, `zapamietajKoniecSerii` / `startZegaraPijanego` w `src/lib/pijany.ts`, po przeładowaniu od 0), potem zakręty i miganie jak dotąd. TV i telefon tak samo.
- **Nowy quiz w rodzaju zakładki:** „Nowy wyścig po piwo” / „Nowy klasyczny pub quiz” z zakładki listy quizów otwiera formularz bez wyboru rodzaju (opis rodzaju, etapy szablonu przy wyścigu), powrót do tej samej zakładki.

### Pilot: licznik w stałym miejscu (26.10) ✅

- Ramka nad przyciskami pilota stoi teraz w każdej fazie (wcześniej znikała poza pytaniem i przyciski pod nią skakały; Łukasz: w pilocie przyciski nie mogą zmieniać pozycji). Treść według fazy: poczekalnia — graczy w poczekalni; plansze przy automacie — „Gotowi do dalszej gry x/y” (zastępuje osobną linijkę); pytanie i po nim — „Odpowiedziało x/y” (komplet na zielono tylko do wyniku); seria — odpowiedzi w serii; reszta — graczy w grze. Jedna linijka, stała wysokość.
- Przełączniki muzyki i automatu mają stałe napisy („Muzyka i dźwięki na TV”, „Prowadzenie automatyczne”), stan widać po przycisku Włącz/Wyłącz i podświetleniu: zmienny tekst zmieniał wysokość i też przesuwał przyciski. Sprawdzone na telefonie 375 px: ramka i pierwszy przycisk w tym samym miejscu na planszy etapu, w pytaniu i w rankingu, z automatem i bez.

### „Ile?”: oś na dole, kreska odpadania z oddechem (26.10) ✅

- **Odpowiedzi „Ile?” na TV** (`OdpowiedziSzacowania`): oś przy dole pola, wszyscy gracze w rzędach nad nią (wcześniej nad i pod osią), plakietka z poprawną liczbą przypięta do góry pola ze złotą kreską w dół do osi. Pole wypełnia miejsce między nagłówkiem a dolną linijką, więc plakietka nigdy nie wchodzi na nagłówek. Podpisy rozdawane od najbliższych poprawnej (trafiający w punkt stoją najniżej i zawsze mają podpis), każdy w najniższym wolnym rzędzie (5 rzędów); kto się nie zmieści, ma sam awatar. Sprawdzone z 8 botami.
- **Kreska odpadania w wyścigu** (`.wyscig-strefa-finalu`): 56 px zamiast 22 (przerywana kreska 14 px pod torem, pod nią napis 24 px), tory zmniejszają się o tyle samo (`STREFA_PX`).

### Od razu pilot, menu panelu na telefonie (26.10) ✅

- **Po „Uruchom grę” od razu pilot** (`/pilot/<kod>?t=…`, `uruchomGre`), bez strony gry: Łukasz i tak zawsze klikał tam „Prowadź”. Na liście rozgrywek trwająca gra (tytuł i złoty przycisk „Prowadź”) też otwiera pilota, zakończona dalej stronę gry z wynikami.
- **Dół pilota:** rozwijane „Dołączanie, przekazanie pilota, ekran” (`udostepnij.tsx`): QR i link dla gracza (z kodem do wpisania), QR i link do przekazania pilota (z ostrzeżeniem o tajnym kluczu), adres ekranu TV i „Strona gry w panelu” (usunięcie gry, szczegóły; `/admin/gry/<kod>` przekierowuje na stronę gry). Kod gry stoi w nagłówku pilota, gracze z usuwaniem jak dotąd w „Gracze”. Style QR, linku do kopiowania i dymka przeszły z `panel.css` do `globals.css`.
- **Panel na telefonie** (do 959 px): w nagłówku samo logo i trzy kreski bez kółka (`_komponenty/menu.tsx`), które po kliknięciu zamieniają się w złoty krzyżyk, a z prawej wysuwa się panel na całą wysokość (przyciemnione tło, Escape i klik obok zamykają, strona pod spodem stoi): Gra („▶ Uruchom quiz”, Rozgrywki), Przygotowanie (Quizy, Lokale) jako karty z krótkim opisem, Wyloguj na dole. Na komputerze pasek jak dotąd.

## Ustalenia

| Temat | Decyzja |
|---|---|
| Gracze | indywidualnie (od 23.10 kreator nie ma trybu drużynowego; `tryb = 'druzyny'` zostaje w bazie dla starszych gier) |
| Punkty | za poprawność + bonus za szybkość, zawsze włączony; limit czasu tylko odlicza, po ilu sekundach nie da się odpowiedzieć |
| Etapy | quiz dzieli się na etapy z planszą, mnożnikiem i własnym czasem; ostatni to finał trójki jako seria |
| Telefon gracza | pokazuje pełną treść pytania i odpowiedzi |
| Prowadzący | pilot na telefonie, obraz na TV w przeglądarce |
| Liczba graczy | maks. 30 na sesję (ustawiane w bazie, łatwo zmienić) |
| Panel admina | dwa hasła bez kont (od 23.10): główny (`ADMIN_HASLO_GLOWNE`, widzi wszystko) i obsługa (`ADMIN_HASLO`, bez rzeczy „tylko dla mnie” i bez „Pijanego finału”); konta później |
| Szable | bez powiązania, wspólny jest tylko design i domena |
| Repo | `enowuigrek/bractwo-quiz`, publiczne (portfolio) |
| Konta | Vercel i Supabase na `l.nowak@bractwopiwne.pl`, kod na prywatnym GitHubie |
| Test | testowy quiz na spotkaniu Kręgu (śr. 28.10) |
| Domena | `quiz.bractwopiwne.pl` (rekord A `76.76.21.21` w strefie DNS hostingu Hostido, MX nietknięte) |

## Stack

- **Next.js** (App Router, TypeScript) na **Vercel**
- **Supabase**: Postgres, Realtime, Storage (logo, grafiki)
- CSS na tokenach z `tokens.css` + Open Sans przez `next/font`
- `qrcode` (generowanie QR), `motion` (animacje rankingu i podium)

## Widoki

| Adres | Kto | Co robi |
|---|---|---|
| `/admin` | główny (Łukasz) i obsługa: dwa hasła | lokale, quizy z etapami, zadania, uruchamianie gry, historia, odbiór nagród; główny dodatkowo pijany finał i rzeczy „tylko dla mnie” |
| `/ekran/[adres]` | telewizor w lokalu (zakładka na stałe) | plansze lokalu, zapowiedź, a gdy w lokalu ruszy gra, sam przechodzi na nią |
| `/tv/[kod]` | telewizor | poczekalnia z QR → plansza etapu → pytanie z odliczaniem → wynik → odpowiedzi → wyścig → … → seria finału (z okrzykami kibiców) → [pijany finał] → werble → podium |
| `/pilot/[kod]?t=…` | prowadzący | start, następne, wynik, odpowiedzi, ranking, start etapu i serii, podium, tabela, koniec; podgląd „odpowiedziało 12/18” |
| `/[kod]` | gracz | nick (+ selfie) → odpowiedzi → „dobrze / źle, +740 pkt, 4. miejsce”, szklanka wyścigu, w finale seria albo kibicowanie, medal i nagroda, udostępnienie i pobranie grafiki |

Kod sesji to krótki, czytelny ciąg (np. `PORT`), który da się też wpisać ręcznie. Link do pilota zawiera tajny token. Admin otwiera go jako QR na ekranie po uruchomieniu sesji, prowadzący go skanuje i ma pilota.

## Przebieg sesji (maszyna stanów)

```
poczekalnia → [etap] → przygotuj (3 s) → pytanie (czas albo bez limitu) → wynik → [odpowiedzi] → [ranking]
            → następne pytanie | [etap] → … → etap finału → seria (3 s odliczania, czas na całą serię)
            → [pijany (90 s, tylko z trybem „Pijany finał”)] → werble → podium ⇄ tabela → koniec
```

`etap` to plansza przed pierwszym pytaniem etapu (prowadzący startuje go z pilota). `odpowiedzi` i `ranking` prowadzący może pominąć. W fazie `seria` wszyscy finaliści odpowiadają we własnym tempie na wszystkie pytania etapu; seria kończy się, gdy ktoś dobiegnie do piwa (wszystkie dobrze), gdy wszyscy skończą albo minie czas. Po ostatniej serii są `werble` (TV i telefony gasną), a podium odsłania prowadzący. Przy włączonym trybie „Pijany finał” przed werblami jest `pijany`: 90 s dogrywki, która nic nie liczy (po czasie albo przyciskiem pilota przychodzą werble). Quiz bez etapów po ostatnim pytaniu idzie od razu do podium. Obok podium jest `tabela`: pełna lista graczy z punktami.

`pytanie → wynik` dzieje się samo: gdy odpowiedzą wszyscy (w `zapisz_odpowiedz`) albo gdy minie czas (`dokoncz_pytanie`, które wołają TV, pilot i telefony; baza sama sprawdza zegar). Ręcznie prowadzący kończy tylko pytanie bez limitu albo wcześniej.

Stan trzymamy w jednym wierszu `sesje` (`faza`, `zadanie_nr`, `faza_od`, `faza_do`). Zmieniają go tylko funkcje w bazie (akcje prowadzącego i automatyczny wynik). TV i telefony subskrybują ten wiersz przez Realtime i same rysują to, co trzeba.

## Model danych

```
lokale        id, nazwa, miasto, logo_url, adres_ekranu, instagram, utworzono
quizy         id, tytul, opis, tylko_glowny, utworzono
etapy         id, quiz_id, nr, nazwa, opis, mnoznik, czas_s, finalowy, seria, plan_pytan, typ_domyslny
zadania       id, quiz_id, etap_id, nr, typ, tresc, grafika_url, czas_s, dane jsonb
              dane dla typu 'wybor': { odpowiedzi: [..], poprawna: 2 } (pozostałe typy: src/lib/zadania.ts)
sesje         id, kod, quiz_id, lokal_id, okazja, grafika_url, tryb, bonus_czas, czas_s, max_graczy (30),
              faza, zadanie_nr, faza_od, faza_do, host_token, nagrody jsonb, browar_*,
              planowany_start, poczekalnia_otwarta, ekran_zwolniony, finalisci uuid[], seria_etap,
              pijany_final, za_barem, tylko_glowny, widok_rankingu (już nieczytane, domyślnie 'wyscig'), utworzono
gracze        id, sesja_id, nick, token, zdjecie_url, nagroda_odebrana, dolaczyl   unique(sesja_id, lower(nick))
odpowiedzi    id, gracz_id, sesja_id, zadanie_id, dane jsonb, czas_ms, poprawna, ocena (0..1), punkty, utworzono
              unique(gracz_id, zadanie_id)
przerobki_ai  id, sesja_id, rodzaj, utworzono   (licznik przeróbek selfie, funkcja wyłączona)
pijane_pytania id, nr, tresc, efekt, komentarz_prawda, komentarz_falsz, utworzono   (wspólna pula pijanego finału)
pijane_pytania_quizu id, quiz_id, nr, tresc, efekt, komentarz_prawda, komentarz_falsz   (dawne wejście pijanego finału; od 28.10 nieużywane)
okrzyki       id, sesja_id, gracz_id, finalista_id, haslo (0..7), utworzono   (okrzyki kibiców w serii finału)
```

Fazy (`sesje.faza`): poczekalnia, etap, seria, pijany, werble, pytanie, wynik, odpowiedzi, ranking, podium, tabela, koniec. Telefony i TV widzą też `przygotuj` (pytanie przed `faza_od`).

`typ` + `dane jsonb` pozwala dokładać nowe rodzaje zadań (łączenie, kolejność, liczba) bez zmian w tabelach. Każdy typ ma w kodzie swój edytor, widok TV, widok gracza i funkcję oceniającą.

Okazja („Dzień Porteru”) i grafika są przypięte do **sesji**, a nie do quizu, więc ten sam quiz może iść na różne eventy i do różnych lokali.

## Uczciwość i bezpieczeństwo

- **Nikt nie widzi poprawnej odpowiedzi przed czasem.** Tabela `zadania` jest niedostępna publicznie. Gracze i TV dostają pytanie przez funkcję, która zwraca tylko **bieżące** zadanie i **bez** pola `poprawna`, dopóki faza nie przejdzie na `wynik`.
- **Czas liczy serwer.** `zapisz_odpowiedz(token, zadanie, dane)` to funkcja w Postgresie. Bierze `now()`, odrzuca odpowiedzi po `faza_do`, sama ocenia i liczy punkty. Telefon nie ma tu nic do powiedzenia.
- **Wszyscy startują razem.** Faza `przygotuj` trwa 3 s (23.10 przez chwilę 5 s, wróciło do 3 s; tak samo odliczanie przed serią), a `faza_od` pytania jest znane z wyprzedzeniem. Telefony przy wejściu mierzą różnicę swojego zegara względem serwera i odsłaniają pytanie w tym samym momencie, niezależnie od opóźnienia sieci.
- **Punkty:** poprawna = 500 + (bonus) 500 × (1 − czas/limit), zła = 0. Bonus za szybkość jest zawsze (od 23.10 kreator nie ma przełącznika), a limit tylko odlicza czas, po którym nie da się odpowiedzieć. Bez limitu czasu bonus też maleje z czasem od startu pytania: 1000 → 500 przez 30 s (wielokrotny, pary i kolejność przez 60 s), potem 500 (migracja `20261023165116_bonus_z_czasu_bez_limitu`; wcześniejsza wersja z kolejności dawała przy jednym telefonie zawsze 1000). Starsze gry z wyłączonym bonusem: poprawna = 1000.
- **Gracz** dostaje losowy token w `localStorage`. Po odświeżeniu strony wraca do gry z tym samym nickiem.
- **Pilot:** każda akcja prowadzącego wymaga `host_token`.
- **Admin:** dwa hasła w zmiennych środowiskowych na Vercelu (`ADMIN_HASLO_GLOWNE` = główny, `ADMIN_HASLO` = obsługa; muszą być różne). Po zalogowaniu serwer ustawia podpisane ciasteczko `httpOnly` z rolą (`rola.wygasa.podpis`, 30 dni; zmiana `ADMIN_SEKRET` wylogowuje wszystkich). Obsługa nie widzi quizów i gier z `tylko_glowny` ani pijanego finału: sprawdzają to strony i akcje (`src/lib/admin-dostep.ts`), a nie tylko ukryte linki. Zapisy admina idą przez Server Actions kluczem serwisowym Supabase, który nigdy nie trafia do przeglądarki.
- **RLS** (zasady dostępu w Postgresie) włączone na wszystkich tabelach. Publicznie czytelne są tylko widoki, bez tokenów i poprawnych odpowiedzi.

## Supabase: żeby projekt nie zasypiał

Darmowy projekt usypia po 7 dniach bez ruchu. Rozwiązaniem jest **Vercel Cron** raz dziennie, który woła `/api/keepalive`, a ten robi jedno małe zapytanie do bazy. Nie wymaga to żadnej dodatkowej usługi, a na darmowym Vercelu cron raz dziennie jest dozwolony. Dodatkowo przed eventem otwieramy panel admina, żeby wszystko było rozgrzane.

Plan Pro (25 $/mies.) ma sens dopiero przy częstych eventach albo gdy będzie potrzebna kopia zapasowa z historią.

## Ekran TV

**Poczekalnia (ustalone z Łukaszem):**
- U góry logo Bractwa obok logo wybranego lokalu (`lokal.logo_url` ze `stan_sesji`).
- Niżej tytuł quizu i okazja („Dzień Porteru”), jeśli jest ustawiona.
- Grafika sesji (`sesje.grafika_url`), jeśli ją dodano.
- **Duży kod QR**, czytelny z każdego miejsca w lokalu, a obok kod gry do wpisania ręcznie i adres. Do tego lista graczy, którzy już dołączyli.

**Po pytaniu:** wynik (poprawna na zielono, słupki, najszybszy), potem **odpowiedzi graczy**. W nagłówku treść pytania. Zielona ramka „Dobrze” z graczami od najszybszego (numer, nick, odpowiedź, czas), pod nią czerwona ramka „Źle” (nick, odpowiedź, czas), a na dole szara linia „Bez odpowiedzi”. Przy wielu graczach wiersze idą w 2–3 kolumnach, od góry do dołu, a od 17 graczy w gęstszym układzie. Potem ranking całej gry.

**Ranking po pytaniu:** wyścig po piwo (tory na barowej ladzie, szklanka na mecie nalewa się z każdym pytaniem, z etapu na etap jest bliżej), przy ponad 12 graczach tabela. W finale trzy równe drogi zbiegają się pod szklanką.

**Po grze:** podium (zdjęcie i nazwa nagrody przy stopniu, tytuł quizu na dole) albo **tabela wyników** (wszyscy gracze: miejsce, nick, punkty, w 1–3 kolumnach, lider w złotej ramce). Pilot przełącza między nimi w obie strony. Logo Bractwa jest w nagłówkach ekranów po prawej, nie w rogu.

**Panel admina:** logo Bractwa w lewym górnym rogu z dopiskiem „panel”, wylogowanie po prawej, pod spodem nawigacja (gry, quizy, lokale). Strona główna dla graczy ma tylko logo i pole na kod.


- Projektujemy na scenę 1920×1080, skalowaną do ekranu, żeby wyglądało tak samo na każdym telewizorze.
- Duże fonty, wysoki kontrast, czarne tło z design systemu.
- Rejestr „kręgowy”: złoto, piana i blask. Logo lokalu i Bractwa na poczekalni.
- Bez interakcji myszką. Wszystko steruje pilot, a TV tylko słucha.

## MVP: tydzień

| Dzień | Zakres |
|---|---|
| 0 (ty) ✅ | konta Bractwa: GitHub, Vercel, Supabase; podpięcie MCP |
| 1 ✅ | repo, Next.js, tokeny, schemat bazy + RLS + funkcje, logowanie admina; migracja wdrożona i przetestowana 18.10 |
| 2 ✅ | panel: lokale z logo, quizy, edytor zadań typu „wybór” z grafiką, uruchamianie sesji (wybór miasta → lokalu → quizu) |
| 3 ✅ | sesja na żywo: dołączanie graczy, poczekalnia na TV z QR, pilot |
| 4 ✅ | pytanie → odpowiedzi → ocena → wynik; synchronizacja czasu |
| 5 ✅ | ranking z animacją przetasowań, podium, dopieszczenie ekranu TV |
| 6 ✅ | deploy ✅, keepalive ✅, checklista testu ✅ ([TEST.md](TEST.md)), domena `quiz.bractwopiwne.pl` ✅ (22.10, rekord A w Hostido), `CRON_SECRET` ✅; zostaje test z kilkoma telefonami |
| 7 ✅ | poprawki po testach (22–23.10): etapy, finał jako seria, wyścig po piwo, werble, nagrody, utrudnienia, pijany finał, kibicowanie, dwa poziomy panelu; zostaje test na żywo 28.10 |

**Poza MVP:** wszystko z [POMYSLY.md](POMYSLY.md).

## Ustalenia z realizacji


### Kreator na kafelkach, pilot uporządkowany, menu zawsze w pilocie (26.10) ✅

- **Kreator gry** (mobile i desktop): kafelki zamiast list. Miasto (pinezka, liczba lokali), lokal (logo), rodzaj („Wyścig po piwo” z kuflem, „Pub quiz” z dymkiem; `IkonaWyscig`, `IkonaPubQuiz`, `IkonaMiasto` w `ikony.tsx`), quiz (tytuł, liczba pytań, tematy). Czas: cztery równe przyciski „∞” (bez limitu), 20, 30, 45 s (10 s wypadło). Nagrody: przełącznik, a po włączeniu „1. miejsce” albo „pierwsza trójka” i pola nagród. „Wydarzenie” (tylko wyścig): przełącznik, po włączeniu browar, Instagram, logo browaru i grafika na poczekalnię. Limit graczy na całą szerokość. Bez tekstów objaśniających pod czasem, nagrodami, pijanym finałem, zapowiedzią i prowadzeniem.
- **Lokal „Test nagłówka (usuń)” usunięty** (miasto Test zniknęło z kreatora). Gry testowe zakładamy bez lokalu.
- **Pilot:** w nagłówku logo i menu (to samo co w panelu, zawsze widoczne, także na komputerze), kod gry przy tytule. W menu, gdy trwa gra, zamiast „Uruchom quiz” skrót do niej: logo lokalu, tytuł, kod, lokal i status (w panelu najnowsza trwająca gra widoczna dla roli, w pilocie ta gra). Pozycje menu to sam tekst, bez tła i ramek. Style menu w `globals.css`.
- **Kolejność w pilocie:** sterowanie, boty (bez opisu), gracze i „Dołączanie, przekazanie pilota, ekran” (rozwijane ze strzałką, która się obraca), a dopiero na samym dole „Zakończ grę”; „Panel obsługi” tylko po zakończeniu gry. Bez „Odpadania przed finałem” (progi ustalone na sztywno, `progi.tsx` usunięty, funkcja `ustaw_progi` zostaje w bazie) i bez linku „Strona gry w panelu”.
- Sprawdzone na telefonie 375 px: kreator od miasta do „Uruchom grę” (testowy lokal) przekierowuje do pilota, menu pilota ze skrótem do gry.
- **Ramka stanu w pilocie** (`pilot-licznik`): licznik i pod nim stała linijka „co dalej”: start zapowiedzi z odliczaniem, w klasycznym rodzaj następnego pytania z podpowiedzią dla graczy, start za / zostało / czas minął w pytaniu, do końca serii, werble, podium i tabela, koniec gry. Osobne ramki („Następne pytanie…”, godzina startu, plansza „Zaczynamy”, „Opowiedz graczom…”) i teksty objaśniające (wynik sam, werble, podium, opisy etapu, serii i pijanego finału) wypadły. Karta pytania z rozwiązaniem na dole jest zwinięta (rozwijana ze strzałką). Sprawdzone w klasycznym: ramka 94 px i pierwszy przycisk w tym samym miejscu w poczekalni, wyniku i na podium.
- **Karta gry w menu:** tytuł z kodem na końcu wiersza, pod nim lokal, niżej pastylka stanu w kolorze (`statusGry` w `menu.tsx`): szara zapowiedź i koniec, zielona poczekalnia, złota plansza, pytanie i wyniki pytania, czerwony finał, pijany finał i werble, niebieskie podium.
- **Poprawki po teście na telefonie (26.10):**
  - Kreator: odstęp pod filtrem tematów; lokale w kafelkach równej wysokości, z logo bez podpisu (nazwa w `title`/`alt`); nagrody jako dwa kafelki z ikonami (`IkonaPodium1`: stopień z „1”, `IkonaPodium3`: podium 2-1-3); napisy przy przełącznikach mniejsze (`--fs-small`) i 14 px od szyny (DESIGN-SYSTEM.md).
  - Skakanie ekranu na telefonie przy wyborze: kafelki, przyciski czasu i szablony mają `position: relative` (ukryte pole wyboru leżało gdzie indziej i telefon do niego przewijał), a kreator ma zapas 45vh pod spodem, żeby skracająca się treść nie podjeżdżała widoku. Sprawdzone: wybór lokalu, rodzaju i quizu po przewinięciu nie rusza ekranu.
  - Pilot: ramka stanu ma dwa wiersze: licznik, a pod nim postęp („Pytanie 4/10”, w wyścigu „Etap 2/5 · 14/59”, przed startem liczba pytań) i po prawej rodzaj następnego pytania jako kolorowa pastylka (`.rodzaj-pytania` w `globals.css`: jedna odpowiedź złota, kilka niebieska, prawda/fałsz zielona, szacowanie fioletowa, kolejność czerwona, pary turkusowa, ciekawostka szara) albo krótko czas („Zostało 12 s”, „Start za 3 s”). Gracze w poczekalni zwijani (domyślnie rozwinięci), bez tekstu o QR, ✕ i zdjęciach.
  - Plansza „Zaczynamy!”: „Gra 1 osoba”, „Grają 2–4 osoby”, „Gra 5 osób” (`grajaOsoby` w `start.tsx`).
  - Pilot: przełączniki muzyki i automatu jako okrągłe przyciski z samą ikoną (`.pilot-ikona`, złote = włączone, nazwa w `title` i `aria-label`) w jednym wierszu z lokalem i fazą; w wyścigu oba mieszczą się obok siebie.
  - Plansza wstępu wyścigu na TV: tytuł 104 px (było 128), opis 36 px (było 44), a odstęp 56 px nad drogą etapów wreszcie działa (`padding-top` był nadpisywany przez `padding: 0`), więc ikony etapów mają oddech.
### Dzień 1

- **Next.js 16.4** (Turbopack). `cacheComponents` wyłączone: panel i tak jest dynamiczny, a gra działa po stronie klienta na Realtime. Middleware nazywa się teraz `proxy` (`src/proxy.ts`).
- **Migracja:** `supabase/migrations/20261018160010_schemat.sql`. Funkcje pomocnicze siedzą w schemacie `wewn`, którego API nie wystawia. Przeglądarka ma dostęp tylko do funkcji: `stan_sesji`, `gracze_sesji`, `dolacz`, `zapisz_odpowiedz`, `moj_wynik`, `ranking`, `pilot_stan`, `pilot_akcja`.
- **Faza `przygotuj` nie jest zapisywana w bazie.** `pilot_akcja('nastepne')` ustawia fazę `pytanie` z `faza_od = teraz + 5 s` (do 23.10: 3 s), a `stan_sesji` zwraca `przygotuj`, dopóki `faza_od` nie minie. Dzięki temu baza nie potrzebuje timera.
- **Realtime przez Broadcast z bazy** (`realtime.send`, temat `sesja:<KOD>`, zdarzenia `stan`, `gracz`, `odpowiedz`) zamiast subskrypcji tabeli. W zdarzeniach nie ma nic tajnego, a klient po `stan` woła `stan_sesji`.
- **Kod gry** to 4 litery bez I i O. Jest unikalny tylko wśród gier, które się nie skończyły, więc `PORT` może wrócić na kolejny Dzień Porteru.
- **`zapisz_odpowiedz` nie mówi, czy odpowiedź jest poprawna.** Ocena i punkty wychodzą przez `moj_wynik` dopiero od fazy `wynik`. Odpowiedź przyjmujemy do 1 s po `faza_do` (opóźnienie sieci), a czas ucinamy do limitu.
- **Ranking w trakcie pytania** pokazuje stan sprzed niego, żeby nie zdradzał, kto już trafił. Zwraca też `poprzednie_miejsce` i `zdobyte` pod animację w dniu 5.
- **Konwencja typów zadań:** poprawna odpowiedź każdego typu jest w `dane.poprawna`. Ocena jest w `wewn.ocen`, a nowy typ to nowa gałąź tej funkcji.
- **Storage:** publiczny bucket `grafiki` (PNG, JPG, WebP, SVG, do 5 MB). Zapis tylko kluczem serwisowym.
- **Admin:** hasło w `ADMIN_HASLO`, ciasteczko `httpOnly` podpisane HMAC kluczem `ADMIN_SEKRET`, ważne 12 h. Każda strona i Server Action panelu woła `wymagajAdmina()`, a `proxy` tylko szybko przekierowuje. Zmienne opisuje `.env.example`.
- **Klucze Supabase:** nowe nazwy, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` i `SUPABASE_SECRET_KEY`.

### Wdrożenie migracji i testy (18.10)

- Migracja wdrożona przez MCP. Plik w repo nosi wersję nadaną przez bazę (`20261018160010`), żeby historia migracji zgadzała się z `supabase_migrations` (zasada w CLAUDE.md).
- Funkcje gry przetestowane SQL-em jako rola `anon`: dołączanie (nick zajęty bez względu na wielkość liter, powrót tokenem, limit graczy, zła gra), pełny przebieg pilota (przygotuj → pytanie → wynik → ranking → następne → podium → koniec, akcje w złej fazie odrzucane), odpowiedzi (za wcześnie, drugi raz, inne zadanie, po czasie, po wyniku, zły indeks/tekst/ułamek), punkty (217 ms → 989; bez bonusu 1000), ukrycie `poprawna` do fazy `wynik`, ranking w trakcie pytania bez bieżących punktów, dziura w numeracji zadań, ponowne użycie kodu po końcu gry.
- Przez prawdziwe API (klucz publiczny): tabela `sesje` → `permission denied`, schemat `wewn` niewystawiony, RPC działają.
- **⚠️ Realtime i partycje:** `realtime.send` zapisuje do `realtime.messages`, które jest partycjonowane po dniach. Partycje zakłada usługa Realtime dopiero, gdy ktoś się do niej podłączy (zakłada kilka dni do przodu). Bez partycji `realtime.send` **po cichu** gubi zdarzenie (tylko `WARNING`). W teście pierwsze zdarzenie przepadło, kolejne doszło. Wnioski: (1) TV i telefony muszą mieć zapasowe odpytywanie `stan_sesji` (np. co kilka sekund i po ponownym połączeniu), a nie polegać tylko na broadcaście; (2) keepalive z dnia 6 powinien też łączyć się z Realtime albo przed eventem trzeba otworzyć TV wcześniej.
- Doradca bezpieczeństwa Supabase zgłasza `SECURITY DEFINER` dostępne dla `anon`: to celowe API gry. `rls_auto_enable` to wyzwalacz zdarzeń Supabase, nie da się go wywołać przez RPC. Doradca wydajności zgłasza 3 klucze obce bez indeksu: przy tej skali bez znaczenia.

### Dzień 2: panel

- **Migracje:** `20261018161037_dane_startowe_i_kolejnosc.sql` (Piwiarnia w Alejach i PPR w Częstochowie, loga jako ścieżki `/loga/…` z `public/`; funkcja `admin_zamien_zadania` tylko dla `service_role`) oraz `20261018161703_uprawnienia_service_role.sql`. Potem `20261018162508_lokale.sql`: tabela `piwiarnie` → `lokale`, kolumna `sesje.piwiarnia_id` → `lokal_id`, a `stan_sesji` zwraca klucz `lokal` zamiast `piwiarnia`.
- **⚠️ Ten projekt Supabase nie nadaje rolom API uprawnień do nowych tabel.** Panel dostawał `permission denied` nawet z kluczem serwisowym. Każda nowa tabela potrzebuje jawnego `grant … to service_role` (a `anon`/`authenticated` dostają dostęp tylko przez funkcje).
- **Struktura panelu:** `/admin` (trwające gry + „Uruchom nową grę”), `/admin/gry`, `/admin/gry/nowa`, `/admin/gry/[id]`, `/admin/quizy`, `/admin/quizy/[id]`, `/admin/quizy/[id]/zadania/[nowe|id]`, `/admin/lokale`, `/admin/lokale/[id]`. Nawigacja Gry · Quizy · Lokale pod nagłówkiem. Wszędzie, w interfejsie, kodzie i bazie, mówimy „lokale”.
- **Server Actions** w `akcje.ts` przy każdej sekcji, każda zaczyna od `wymagajAdmina()`. Po zapisie przekierowanie albo `refresh()` z `next/cache`. Formularze mają `{...bezResetu(akcja)}`: React 19 czyści pola po akcji także przy błędzie, a tak zostają wypełnione.
- **Grafiki** (`src/lib/grafiki.ts`): bucket `grafiki`, katalogi `lokale/`, `zadania/`, `sesje/`, losowe nazwy plików. Przy podmianie albo usunięciu stary plik jest kasowany ze Storage (adresy spoza bucketu, np. `/loga/…`, zostają). Limit Server Actions podniesiony do 6 MB (`next.config.ts`).
- **Edytor pytania „wybór”:** 2–6 odpowiedzi, poprawna zaznaczana literą (zielone kółko), czas 5–300 s (domyślnie 20), grafika opcjonalna. Odpowiedzi nie mogą się powtarzać. Kolejność pytań zmieniają strzałki ↑ ↓ (zamiana numerów w jednej transakcji). Nowe pytanie idzie na koniec, a dziury w numeracji po usunięciu nie przeszkadzają.
- **Uruchamianie gry:** miasto → lokal (kafelki z logo) → quiz (quizy bez pytań są wyłączone), potem okazja, tryb, bonus za szybkość, limit graczy, grafika na poczekalnię. Gdy jest jedno miasto albo jeden lokal, wybiera się sam.
- **Ekran uruchomionej gry** (`/admin/gry/[id]`): duży kod, QR pilota (`/pilot/KOD?t=host_token`) do zeskanowania przez prowadzącego, linki do TV (`/tv/KOD`) i dla graczy (`/KOD`) z przyciskiem „Kopiuj”. Adresy składa `adresAplikacji()` (`NEXT_PUBLIC_SITE_URL` albo nagłówki żądania). Strony `/tv`, `/pilot` i `/[kod]` powstaną w dniu 3.
- **Kończenie i usuwanie:** trwającą grę można zakończyć, a zakończoną usunąć (z graczami i odpowiedziami). Quizu, na którym były gry, nie da się usunąć, dopóki tych gier nie usunie się w „Gry”. Na stronie quizu w trwającej grze jest ostrzeżenie, że zmiany w pytaniach gracze zobaczą od razu.
- Sprawdzone w przeglądarce: logowanie, dodanie i usunięcie lokalu z wysłaniem logo do Storage, edycja pytania, zmiana kolejności, kreator Częstochowa → PPR → quiz, QR pilota, zakończenie i usunięcie gry, usunięcie quizu. Dane testowe z wdrożenia zostały usunięte przez panel, baza jest czysta (tylko dwa lokale).

### Dzień 3: sesja na żywo

- **Bez migracji.** Wystarczyły funkcje z dnia 1: `dolacz`, `gracze_sesji`, `stan_sesji`, `pilot_stan`, `pilot_akcja`.
- **Nasłuch** (`src/lib/gra/nasluch.ts`, `useNasluch`): kanał Broadcast `sesja:<KOD>` plus zapasowe odpytywanie co 5 s, po (ponownym) podłączeniu do Realtime i po powrocie karty na pierwszy plan. To odpowiedź na ⚠️ z partycjami: zgubione zdarzenie najpóźniej po 5 s nadrabia odpytanie. Pobrania się nie nakładają. Na stronie jest jeden kanał, a `pobierz` ściąga wszystko, czego strona potrzebuje. Sprawdzone: nowy gracz pojawia się na TV po ~0,5 s, poza rytmem odpytywania, czyli przez Realtime.
- **Zegar:** `pobierzStan` i pilot liczą przesunięcie zegara serwera (`teraz` z odpowiedzi, połowa czasu żądania). `useCzasSerwera` daje bieżący czas serwera do odliczania. Dzień 4 użyje tego do odsłaniania pytania.
- **Strona główna:** logo i pole na kod (4 litery, same wielkie), przycisk „Dołącz” → `/KOD`.
- **Gracz `/[kod]`:** zły format kodu → 404, małe litery → przekierowanie na wielkie (jeden adres = jeden klucz w `localStorage`). Brak gry → „Nie ma takiej gry”. Formularz nicku („Nazwa drużyny” w trybie drużyn), błędy z bazy po polsku (zajęty nick, komplet). Token w `localStorage` pod `bractwo-quiz:gracz:KOD`. Po odświeżeniu `dolacz(kod, null, token)` przywraca gracza, a nieważny token jest kasowany. W poczekalni gracz widzi swój nick i listę graczy. Pozostałe fazy mają na razie tylko „Pytanie N/M · Patrz na telewizor” (dzień 4).
- **TV `/tv/[kod]`:** scena 1920×1080 skalowana do ekranu (`useSyncExternalStore` na `resize`), bez kursora. Poczekalnia według ustaleń: logo Bractwa + logo lokalu, okazja (krój zwężony, złoto), tytuł quizu, nazwa lokalu, QR 620 px na kremowym tle (generowany na serwerze z `adresAplikacji()`), adres pod QR, kod gry 170 px w złocie, grafika sesji, lista graczy z licznikiem `n/max`. Nowy nick wskakuje ze złotym blaskiem. Przy ponad 30 graczach nicki są mniejsze. Pozostałe fazy mają tymczasową planszę (dni 4–5). Przy braku sieci w rogu jest „Brak połączenia, ponawiam…”.
- **Pilot `/pilot/[kod]?t=…`:** po udanym `pilot_stan` token trafia do `localStorage` (`bractwo-quiz:pilot:KOD`) i znika z paska adresu, więc odświeżenie działa bez `?t=`. Zły link nie nadpisuje dobrego tokenu. Przyciski zależą od fazy: Start quizu (z pytaniem, gdy nikt nie dołączył; wyłączony, gdy quiz nie ma pytań) → Pokaż wynik (z pytaniem, gdy czas jeszcze leci) → Pokaż ranking / Następne pytanie albo Pokaż podium po ostatnim → Zakończ grę. „Zakończ grę” z potwierdzeniem jest zawsze na dole. W trakcie pytania pilot pokazuje treść, odpowiedzi z zaznaczoną poprawną, odliczanie i „Odpowiedziało x/y” (odświeżane zdarzeniem `odpowiedz`). `przygotuj` przechodzi w `pytanie` lokalnie, gdy minie `faza_od`.
- **Podgląd lokalny:** w `.claude/launch.json` jest też `dev-dzialajacy`, który podłącza podgląd do już działającego `next dev` na porcie 3000 (Next nie pozwala na dwa serwery w jednym katalogu).
- Sprawdzone w przeglądarce: kod na stronie głównej → nick → TV i pilot widzą gracza; drugi gracz przez `dolacz` jako `anon` → TV przez Realtime; start z pilota → TV „Przygotuj się…” → pytanie; pilot po odświeżeniu bez tokenu; zły token; nieistniejąca gra; zły format kodu; powrót gracza po odświeżeniu; widok telefonu 375 px. Gra testowa `JPLA` została w bazie (do usunięcia w panelu).

### Dzień 4: rozgrywka pytań

- **Migracja** `20261018181152_rozgrywka.sql`:
  - `stan_sesji` zwraca `liczba_odpowiedzi` (ile osób odpowiedziało na bieżące pytanie, bez tego, kto i co). Od fazy `wynik` w `zadanie` są też `rozklad` (ile osób wybrało każdą odpowiedź), `liczba_poprawnych` i `najszybszy` (nick i czas najszybszej poprawnej). Rozkład liczy `wewn.rozklad`, nowy typ zadania to nowa gałąź tej funkcji.
  - **Gdy odpowiedzą wszyscy gracze, czas pytania kończy się od razu:** `zapisz_odpowiedz` ustawia `faza_do` na teraz, a wyzwalacz rozsyła `stan`. Na wynik nadal czeka się na prowadzącego. Przy dwóch ostatnich odpowiedziach w tej samej chwili czas może się nie skrócić, wtedy prowadzący klika „Pokaż wynik”.
- **Odsłanianie:** `fazaTeraz(stan, teraz)` w `nasluch.ts` (dla gracza, TV i pilota) przełącza `przygotuj` → `pytanie`, gdy zegar serwera (`useCzasSerwera`, w odliczaniu co 100 ms) minie `faza_od`, i zgłasza `czasMinal` po `faza_do`. Treść pytania przychodzi już w `przygotuj` (bez poprawnej), ale ekrany pokazują ją dopiero od `faza_od`. Odpowiedź przed `faza_od` baza i tak odrzuca.
- **Telefon gracza** (`src/app/[kod]/rozgrywka.tsx`): odliczanie 3‑2‑1 → pytanie z paskiem czasu, grafiką i przyciskami A–F → po wyborze złota ramka, reszta przygaszona, „Odpowiedź zapisana (3,4 s)”. Odrzucenia z bazy mają polskie komunikaty („Za późno, czas minął.”). Po odświeżeniu strony wybrana odpowiedź wraca z `moj_wynik`. W `wynik`: „✓ Dobrze! +789 pkt”, „✗ Niestety źle” albo „Brak odpowiedzi”, miejsce i suma punktów, poprawna odpowiedź na zielono, moja zła przekreślona. W `ranking` i `podium` telefon pokazuje miejsce i punkty, a w `koniec` też miejsce.
- **TV:** odliczanie w złotym kole → pytanie (numer, zegar w sekundach, złoty od 5 s, pasek czasu, treść do 3 linii, odpowiedzi w dwóch kolumnach; z grafiką: grafika po lewej, odpowiedzi w kolumnie), stopka „Odpowiedziało x/y” i kod gry. Po czasie „Czas minął!” i „Za chwilę wynik…”. `wynik`: poprawna na zielono z blaskiem, reszta przygaszona, słupki rozkładu z liczbami, „Dobrze odpowiedziało x/y” i „Najszybciej: nick (1,2 s)”. TV słucha też zdarzenia `odpowiedz`, a listę nicków pobiera tylko w poczekalni. Ranking i podium na TV doszły w dniu 5.
- **Pilot:** w `wynik` liczba osób przy każdej odpowiedzi i „dobrze x”, po czasie zamiast sekund „czas minął”.
- Sprawdzone na localhost (TV, pilot i telefon 375 px, drugi gracz przez SQL jako `anon`): przygotuj → pytanie równo na TV i telefonie, odpowiedź i punkty (12,7 s z 30 s → 789), licznik na TV, powrót po odświeżeniu, koniec czasu po odpowiedzi wszystkich, „Pokaż wynik” przed końcem czasu, brak odpowiedzi, zła odpowiedź, odpowiedź po czasie odrzucona, pytanie z 6 odpowiedziami i z grafiką. Wcześniej SQL‑em: w trakcie pytania `stan_sesji` nie ma `poprawna` ani `rozklad`. Gra testowa została usunięta, `JPLA` i `NKGH` zostały bez zmian.

### Dzień 5: ranking i podium

- **Bez migracji.** Wystarczyła funkcja `ranking` z dnia 1 (`poprzednie_miejsce`, `zdobyte`). Doszła biblioteka `motion` (`motion/react`).
- **Ranking na TV** (`src/app/tv/[kod]/ranking.tsx`): przez 1,6 s stoi kolejność sprzed pytania z punktami sprzed pytania. Potem wiersze przesuwają się na nowe miejsca (`layout` z motion, sprężyna), punkty doliczają się, a przy nickach pojawiają się „+zdobyte” i strzałki ▲ (chmiel) / ▼ (szary). Lider ma złotą ramkę z blaskiem. Na ekranie mieści się 10 wierszy, a pod spodem jest „…i jeszcze N w grze. Swoje miejsce masz na telefonie.” Odświeżenie TV w trakcie rankingu odtwarza animację od początku.
- **Podium:** nagłówek z logami Bractwa i lokalu, okazją i tytułem quizu. Stopnie wjeżdżają po kolei: 3. miejsce (0,6 s), 2. (1,8 s), zwycięzca (3,4 s), ze złotym blaskiem i większym nickiem. Pod spodem miejsca 4–10. Remisy pokazują wspólny numer miejsca z bazy.
- **Koniec gry na TV:** to samo podium, ale bez odliczania, i pod spodem „Dziękujemy za grę! Piwu Cześć!”. Gdy gra skończyła się przed pierwszym pytaniem, zostaje sam napis „Koniec gry”.
- **Przejścia:** każda nowa faza na TV wjeżdża łagodnie (0,6 s). Od odliczania do wyniku pytanie to jeden ekran, więc nie miga. Animacje respektują `prefers-reduced-motion` (`MotionConfig reducedMotion="user"` i reguła z `globals.css`).
- **Telefon:** w rankingu miejsce, suma, „+740 pkt za ostatnie pytanie” i zmiana miejsca. Dane bierze z `ranking` (wiersz gracza wyszukany po nicku, który jest unikalny w grze). Na podium jest zachęta, żeby patrzeć na TV, a na końcu miejsce i „Zwycięstwo!” dla pierwszego.
- **TV pobiera** `ranking` tylko w fazach ranking, podium i koniec, a listę nicków tylko w poczekalni.
- Sprawdzone na localhost na grze z 12 graczami (odpowiedzi wpisane SQL‑em): kolejność przed i po przetasowaniu, strzałki, „+zdobyte”, „…i jeszcze 2”, wjazd podium po kolei, koniec gry, widok rankingu i końca na telefonie 375 px. Gra testowa usunięta.

### Dzień 6: keepalive, domena, test

- **Deploy** był zrobiony przed dniem 4: https://bractwo-quiz.vercel.app, push na `main` = deploy, funkcje w `fra1`.
- **Keepalive** (`src/app/api/keepalive/route.ts`) robi dwie rzeczy: małe zapytanie do bazy (klucz serwisowy) i podłączenie do Realtime kluczem publicznym na jeden kanał. To drugie jest odpowiedzią na ⚠️ z dnia 1: usługa Realtime zakłada partycje `realtime.messages` na kilka dni do przodu dopiero po podłączeniu klienta. 18.10 partycje sięgały do 21.10, a event jest 28.10. Zwraca `{"ok":true,"baza":"ok","realtime":"SUBSCRIBED"}`, przy błędzie status 500. Sprawdzone na localhost. Czy partycje przesuwają się z dnia na dzień, da się sprawdzić dopiero po kilku dniach działania crona.
- **Vercel Cron** w `vercel.json`: `0 5 * * *` (codziennie o 5:00 UTC, na planie Hobby wolno raz dziennie, a godzina może się przesunąć w obrębie tej godziny). Gdy na Vercelu jest ustawiony `CRON_SECRET`, endpoint wymaga nagłówka `Authorization: Bearer …` (Vercel dokleja go sam). Bez zmiennej endpoint jest otwarty, ale robi tylko jedno małe zapytanie.
- **`.env.example`** ma teraz `CRON_SECRET` i opcjonalny `NEXT_PUBLIC_SITE_URL`.
- **Domena:** Vercel MCP nadal dostaje 403 na zakres zespołu, a CLI `vercel` nie jest zainstalowane, więc domenę trzeba dodać w panelu (instrukcja niżej, w „Zadania dla ciebie”). W DNS na 18.10 nie ma jeszcze rekordu `quiz`, serwery nazw to Hostido, a MX to Google. W kodzie nic nie trzeba zmieniać: linki i QR biorą adres z żądania.
- **Po wdrożeniu (18.10):** domena `quiz.bractwopiwne.pl` dodana w Vercelu. Rekord CNAME w Hostido doda Zbyszko (brak dostępu do panelu). `CRON_SECRET` ustawiony. Pierwszy deploy z nim padł, bo `openssl … | pbcopy` dokleił znak nowej linii, a Vercel odrzuca sekret z białym znakiem. Pomogło `openssl rand -hex 32 | tr -d '\n' | pbcopy`. Na produkcji `/api/keepalive` bez nagłówka zwraca 401, strona działa. Vercel MCP dalej daje 403, więc logi czytamy przez CLI (patrz CLAUDE.md).
- **Do zrobienia przy okazji:** w Vercelu zmienić typ `SUPABASE_SECRET_KEY`, `ADMIN_HASLO` i `ADMIN_SEKRET` na Secret (Vercel oznacza je „Needs Attention”).
- **Test z telefonami:** scenariusz i lista przed eventem są w [TEST.md](TEST.md). Test robisz ty, a wnioski idą do dnia 7.

### Poprawki wyglądu i panelu (19.10, przed testem)

- Mniejsze zaokrąglenia okien (10/8 px), przyciski jako pigułki wypełnione kolorem według rodzaju (zwykły, złoty, pozytywny, niebezpieczny, ikona). Opis w DESIGN-SYSTEM.md („Promienie”, „Przyciski”).
- Panel admina ma układ mobilny (do 640px) i desktopowy (stałe 1120px, nawigacja w pasku, gra w dwóch kolumnach). Szerokość nie zależy od treści (`scrollbar-gutter: stable`).
- Gry można usuwać z listy (ikona kosza, z potwierdzeniem), także trwające. Na stronie gry są „Zakończ grę” i „Usuń grę”.
- Linki na stronie gry są w ramce: kliknięcie otwiera w nowej karcie, ikona kopiuje (Clipboard API z zapasowym `execCommand`), przytrzymanie palcem na telefonie też kopiuje, a dymek potwierdza.
- Do lokalnych testów panelu jest konfiguracja `start-test-hasla` w `.claude/launch.json`: `next start` na porcie 3100 z hasłem testowym nadpisującym `ADMIN_HASLO` (najpierw `npm run build`). Działa obok twojego `next dev` na 3000.
- Sprawdzone na localhost: lista gier i strona gry na 1280 px i 375 px, kopiowanie z dymkiem. Nie sprawdzone: samo usuwanie z listy (nie chciałem kasować gry NKGH) i przytrzymanie palcem na prawdziwym telefonie.

### Poprawki po pierwszych testach (22.10)

- **Mniejsze zaokrąglenia:** karty 6 px, pola i kafelki 4 px. Przyciski zostają pigułkami.
- **Panel:** nawigacja na desktopie stoi przy prawej krawędzi, obok „Wyloguj”. Sekcja pod listą (np. karta) ma odstęp od ostatniego wiersza.
- **Quizy, lista:** przy każdym quizie ikona ołówka („Edytuj”) i kosza („Usuń”), z dymkiem po najechaniu. Pod listą przycisk „Nowy quiz”, który otwiera osobny ekran `/admin/quizy/nowy`. Błędy usuwania (np. quiz z rozegranymi grami) pokazują się na liście.
- **Quizy, edycja:** tytuł i opis są w nagłówku, a ołówek otwiera ich edycję w miejscu. Na dole jest „Zapisz quiz”: zapisuje tytuł i opis (także te w trakcie edycji) i wraca do listy. Pytania zapisują się jak dotąd, każde osobno. „Dodaj pytanie” jest teraz zwykłym przyciskiem, a złoty jest tylko „Zapisz quiz”. Usuwanie quizu jest tylko na liście.
- **Pytanie, powtórzone odpowiedzi:** takie same odpowiedzi (bez względu na wielkość liter) mają czerwoną ramkę od razu przy wpisywaniu, a pod listą jest komunikat, których to dotyczy. Serwer i tak sprawdza to przy zapisie.
- **Pytanie bez limitu czasu** (pole „Bez limitu czasu” przy czasie): `zadania.czas_s = null`, a w trakcie pytania `sesje.faza_do` jest puste. Pytanie kończy się, gdy odpowiedzą wszyscy (baza ustawia wtedy `faza_do`, tak jak przy pytaniach na czas) albo gdy prowadzący kliknie „Pokaż wynik”. Pilot pyta wtedy o potwierdzenie, jeśli nie wszyscy odpowiedzieli. Bonus liczy się z kolejności dobrych odpowiedzi (od 23.10, wcześniej bez bonusu: 1000 pkt). Napisu „Bez limitu” już nigdzie nie ma (TV, telefon i pilot po prostu nie pokazują zegara), a po ostatniej odpowiedzi jest „Wszyscy odpowiedzieli”. Migracja `20261022141218_bez_limitu_czasu`, sprawdzona SQL-em w wycofanej transakcji.
- **Okno potwierdzenia zamiast `window.confirm`:** `src/components/okno.tsx`. W panelu `PrzyciskPotwierdz`, na pilocie `usePotwierdzenie()`. W aplikacji nie zostało już żadne okno przeglądarki.
- Sprawdzone na localhost (1280 px): lista quizów z dymkiem, nowy quiz, edycja nagłówka, pytanie z powtórzeniem i bez limitu, okno przy usuwaniu (Esc anuluje), „Zapisz quiz” wraca do listy, usunięcie quizu z listy. **Nie sprawdzone na żywo:** pytanie bez limitu na TV, telefonie i pilocie w prawdziwej grze (scenariusz w `docs/TEST.md`, punkt 12).

### Nowe ekrany TV: odpowiedzi graczy i tabela wyników (22.10)

- Nowe fazy `odpowiedzi` i `tabela` (migracja `20261022142232_odpowiedzi_i_tabela`). Przejścia w `pilot_akcja`: `odpowiedzi` z `wynik` albo `ranking`, `ranking` z `wynik` albo `odpowiedzi`, `podium` i `tabela` z `wynik`/`odpowiedzi`/`ranking` oraz nawzajem z siebie, `nastepne` także z `odpowiedzi`.
- `odpowiedzi_zadania(kod)`: kto i jak odpowiedział na bieżące zadanie (nick, `dane`, `poprawna`, `czas_ms`, `punkty`). Zdradza poprawną, więc do fazy `wynik` zwraca pustą listę. `wewn.odslania_poprawna` obejmuje nowe fazy.
- Pilot po wyniku: „Pokaż odpowiedzi graczy” (złoty), „Pokaż ranking”, następne pytanie / podium. Po ostatnim pytaniu dochodzi „Pokaż pełną tabelę”. Na podium: „Pokaż pełną tabelę” i „Zakończ grę”, w tabeli: „Pokaż podium” i „Zakończ grę”.
- Telefon: w `odpowiedzi` dalej pokazuje swój wynik pytania, a w `tabela` to samo co na podium.
- Sprawdzone: SQL-em w wycofanej transakcji (kolejność, pusta lista w trakcie pytania jako `anon`, niedozwolone przejście odrzucone) oraz na żywo na localhost z tymczasową grą (14 graczy): ekran odpowiedzi i tabela na TV w 1920×1080, przyciski pilota w 375 px i przejście „Pokaż odpowiedzi graczy”. Tymczasowa gra i quiz są usunięte. Nie sprawdzone: 25–30 graczy (gęsty układ) i telefon gracza w nowych fazach.

### Ustalenia z rozmowy po testach (22.10) ✅ zrobione

Cel: wieczór quizowy bez wpisywania kodów. Quiz tworzymy w domu, a w lokalu prowadzący uruchamia grę na swoim telefonie.

1. **Ekran lokalu** `/ekran/<adres-lokalu>`: lokal zapisuje go raz w zakładkach na TV. Bez gry pokazuje plansze zmieniane co ~10 s: (1) logo Bractwa i lokalu, „Quiz Bractwa Piwnego · wkrótce start”, (2) jak grać w 3 krokach, (3) logo Bractwa i „Piwu Cześć!” (bez podpisów). Gdy w lokalu ruszy gra, ekran sam przechodzi na poczekalnię z QR (gracze dołączają jeszcze przed „Start quizu”), a po grze wraca do plansz. Przy dwóch grach naraz w jednym lokalu pokazuje najnowszą. `/ekran` bez adresu ma pole na kod gry, `/ekran/KOD` działa jak dotąd, a stare `/tv/...` przekierowują.
2. **Adres ekranu lokalu** powstaje z nazwy przy dodawaniu lokalu (bez polskich znaków, przy powtórce `-2`). Nie zmienia się przy zmianie nazwy, można go poprawić ręcznie z ostrzeżeniem o zakładce. Widać go na liście i na stronie lokalu, z kopiowaniem i QR.
3. **Lokale w panelu jak quizy:** lista z „Edytuj”, bez usuwania z listy. „Dodaj lokal” pod listą, na osobnym ekranie. Usuwanie tylko na stronie lokalu.
4. **Czas i zasady przy uruchamianiu gry** (wariant A): tryb, czas na odpowiedź (10/20/30/45 s albo bez limitu, jeden dla wszystkich pytań), bonus za szybkość (przy „bez limitu” wyłączony), limit graczy. Pole czasu znika z edytora pytań. Czas wędruje z `zadania` do `sesje`.
5. **Poczekalnia:** QR duży po lewej, pod nim drobniej adres i kod. Na pierwszym planie okazja, tytuł quizu i grafika, pod nimi gracze.
6. **Prowadzący z telefonu:** na stronie gry „Prowadź z tego telefonu” (pilot w tej samej karcie) i „Przekaż prowadzącemu” (QR pilota). Logowanie do panelu ważne 30 dni.
7. **Domena** `quiz.bractwopiwne.pl`: CNAME w Hostido, MX bez zmian.

Na później (POMYSLY.md): własne plansze na ekranie lokalu dodawane w panelu; „dłuższy czas” dla wybranych pytań.

**Jak to zrobiliśmy:**
- Migracje `20261022152607_adres_ekranu_lokalu` (`lokale.adres_ekranu`, unikalny, z nazwy), `20261022152709_czas_w_grze` (`sesje.czas_s`, null = bez limitu; `stan_sesji` zwraca go jako `zadanie.czas_s`, więc klienci się nie zmienili; `zadania.czas_s` zostaje w tabeli nieużywane) i `20261022152718_ekran_lokalu` (`ekran_lokalu(adres)` zwraca lokal i kod najnowszej trwającej gry albo zakończonej w ostatnich 10 min; wyzwalacz wysyła `gra` na temat `lokal:<adres>`).
- Ekran: `src/app/ekran/` (`/ekran` z polem na kod, `/ekran/[adres]` = lokal albo kod gry). Pliki TV są w `src/app/ekran/_ekran/`. `/tv/...` przekierowuje. `useNasluchTematu` słucha dowolnego tematu Realtime, a `useNasluch(kod)` to jego wersja dla gry.
- Panel: nawigacja **Quizy · Rozgrywki · ▶ Uruchom quiz · ⚙ (lokale)**. Adresy zostały (`/admin/gry`, `/admin/lokale`), zmieniły się tylko nazwy. Kreator gry ma czas w pigułkach 10/20/30/45 s / bez limitu, a bonus przy „bez limitu” jest wyłączony. Strona gry: „Prowadź z tego telefonu” (pilot w tej samej karcie), „Przekaż prowadzącemu” (QR pod rozwijanym nagłówkiem), karta ekranu lokalu z ostrzeżeniem, gdy w lokalu trwa inna gra. Pilot ma link „← Panel obsługi”.
- Sprawdzone: SQL w wycofanej transakcji (adresy, ekran lokalu jako `anon`, czas 10 s, 747 pkt po 5 s, ekran po końcu gry) i na localhost: plansze, poczekalnia, automatyczne przełączenie ekranu Piwiarni w Alejach po uruchomieniu gry z kreatora (30 s), pilot ze startem i oknem potwierdzenia, powrót do plansz po usunięciu gry, lokale z adresem i QR, `/tv/umvw` → `/ekran/UMVW`, `/ekran`. Testowa gra GHNV jest usunięta. Nie sprawdzone: telefon gracza w nowej poczekalni i Realtime na produkcji (lokalnie mogło zadziałać odpytywanie co 5 s).

### Nagrody, selfie i nowe typy pytań (ustalone 22.10)

1. **Nagrody** (ustawienie rozgrywki w kreatorze): bez nagród / tylko 1. miejsce / pierwsza trójka. Każde nagradzane miejsce ma własną nazwę nagrody i własną, opcjonalną instrukcję odbioru (np. „Pokaż ten ekran barmanowi”). Na telefonie nagradzanego gracza pod medalem jest karta nagrody z instrukcją, nickiem, kodem gry i żywym zegarem (trudniej podrobić zrzut ekranu). Na TV nagroda jest pod nickiem na podium.
2. **Selfie przy dołączaniu** (opcjonalne): przedni aparat, telefon sam przycina i zmniejsza zdjęcie, zapis przez serwer z tokenem gracza. Zdjęcie w kółku przy nicku (poczekalnia, ranking, odpowiedzi, podium, telefon), a bez zdjęcia kółko z pierwszą literą. Prowadzący może usunąć zdjęcie z pilota. Zdjęcia znikają same po 7 dniach, a historia gry zostaje bez nich.
3. **Nowe typy pytań:** wielokrotny wybór, kolejność (stukanie po kolei z „Cofnij”), łączenie w pary (stuknij lewy, potem prawy). Punktacja częściowa: ułamek poprawności razy punkty pytania (z bonusem za szybkość). W wielokrotnym wyborze błędnie zaznaczone odejmują.

Kolejność: nagrody → selfie → typy pytań, każda rzecz osobno wypchnięta.

**Odbiór nagrody ✅ (migracja `20261022162708_odbior_nagrody`):** `gracze.nagroda_odebrana`, funkcja `odbierz_nagrode(token)`: tylko po podium i tylko dla nagradzanego miejsca, drugie kliknięcie nic nie zmienia. Na karcie nagrody jest przycisk „Potwierdź odbiór (klika barman)” z oknem potwierdzenia, a po odbiorze nagroda jest przekreślona i ma pieczątkę „ODEBRANA O 18:28” (także po odświeżeniu). Sprawdzone na localhost z tymczasową grą FHCK (usunięta): odbiór zwycięzcy i odmowa dla gracza bez nagrody.

**Nawigacja (poprawka 22.10):** kolejność Rozgrywki, Quizy. Na telefonie zakładki po lewej, „▶ Uruchom” i ⚙ po prawej. Na komputerze pasek nie przycina dymka „Ustawienia” (pokazuje się pod ikoną) ani obwódki ⚙.

**Typy pytań, baza ✅ (migracja `20261022162605_typy_pytan`):** `wewn.ocena(typ, dane, odpowiedź)` zwraca 0..1 dla `wybor`, `wielokrotny`, `kolejnosc` i `pary`, ze ścisłym sprawdzaniem odpowiedzi (`wewn.indeksy_ok`). `odpowiedzi.ocena`, punkty = punkty pytania × ocena, rozkład także dla wielokrotnego wyboru, a ekran odpowiedzi sortuje po ocenie. Sprawdzone SQL-em.

**Typy pytań, aplikacja ✅:** edytor w panelu (przełącznik rodzaju, litery z zaznaczaniem, kolejność ze strzałkami, pary lewa ↔ prawa; kolejność i pary miesza serwer przy zapisie). Telefon: kilka odpowiedzi to kafelki i „Zatwierdź”, kolejność to stukanie po kolei z numerami i „Cofnij”, pary to stuknięcie lewego i prawego (para dostaje wspólny kolor i numer, ponowne stuknięcie rozłącza). Po wyniku „Częściowo: 2/4” z punktami i rozwiązanie (przy pomyłce dopisek „Ty: …”). TV: podpowiedź pod pytaniem, w parach dwie kolumny, w wyniku właściwa kolejność i pary. Pilot pokazuje rozwiązanie każdego typu. Historia gracza w panelu opisuje odpowiedź i częściową ocenę. W testowym quizie są pytania 11–14 nowych typów.

**Kranoprzejęcie ✅ (migracja `20261022162137_browar`):** opcjonalna nazwa i logo gościnnego browaru przy grze (`sesje.browar_nazwa`, `browar_logo_url`, w `stan_sesji` jako `browar`). TV: logo po znaku „×” obok logo Bractwa i lokalu we wszystkich nagłówkach, a w poczekalni napis „Kranoprzejęcie: …”. Telefon: nazwa w formularzu dołączania. Logo znika z magazynu razem z grą. Podpis autora jest tylko na telefonie, na końcu gry (zmiana 22.10, patrz niżej). „Dzięki za grę” pod medalem jest wyśrodkowane.

**Nagrody ✅ (migracja `20261022160506_nagrody`):** `sesje.nagrody` jsonb (null albo `[{miejsce, nagroda, instrukcja}]`, 1–3 pozycje), zwracane w `stan_sesji`. W kreatorze jest wybór „bez nagród / za 1. miejsce / za pierwszą trójkę”, a przy każdym miejscu nagroda i opcjonalna instrukcja. TV pokazuje nagrodę w złotej pigułce pod punktami na podium. Telefon pokazuje kartę nagrody z mieniącą się ramką, nickiem, kodem gry i tykającym zegarem. Przy remisie obaj gracze widzą nagrodę za to miejsce, a o wydaniu decyduje obsługa. Sprawdzone na localhost z tymczasową grą KRBN (usunięta): telefon zwycięzcy, podium na TV, pola w kreatorze.

**Selfie ✅ (migracja `20261022161457_zdjecia_graczy`):** `gracze.zdjecie_url`. Nowa funkcja `lista_graczy` (nick i zdjęcie) zastępuje w aplikacji `gracze_sesji`, który zostaje dla zgodności. `ranking`, `odpowiedzi_zadania` i `moj_wynik` zwracają `zdjecie`, a zmiana zdjęcia wysyła zdarzenie `gracz`.
- Zapis i usuwanie idą przez `/api/zdjecie` (klucz serwisowy): POST z tokenem gracza (tylko JPEG albo WebP, do 400 KB, nie po końcu gry), DELETE tokenem gracza albo kodem z kluczem pilota i nickiem.
- Telefon przycina zdjęcie do 256×256 JPEG (`src/lib/zdjecie.ts`, z obrotem według EXIF). „📷 Dodaj selfie” jest w formularzu dołączania i w poczekalni (zmień albo usuń).
- `Awatar` (`src/components/awatar.tsx`): zdjęcie w kółku albo pierwsza litera na kolorze dobranym po nicku. Pokazuje się w poczekalni (TV, telefon, pilot), rankingu, tabeli, odpowiedziach, na podium (200/150 px nad stopniem) i w medalu na telefonie.
- Pilot: dotknięcie zdjęcia pyta, czy je usunąć. Zdjęcia znikają po 7 dniach (`/api/keepalive`) i razem z usuniętą grą.
- Sprawdzone na localhost z tymczasową grą XAST (usunięta razem ze zdjęciami): dołączenie z podłożonym zdjęciem, poczekalnia na telefonie i TV, usunięcie z pilota (telefon gracza odświeżył się sam), podium ze zdjęciem, odrzucenie złego tokenu, SVG i złego klucza pilota. Nie sprawdzone: prawdziwy aparat w telefonie i kasowanie po 7 dniach (zadziała przy najbliższym cronie).

### Poprawki po drugim teście (22.10)

Migracje `20261022185551_auto_wynik_i_gracze` i `20261022185614_po_usunieciu_gracza`.

- **Wynik sam:** po czasie albo gdy wszyscy odpowiedzą. Na pilocie zamiast „Pokaż wynik” jest informacja i ciche „Zakończ pytanie wcześniej”, a przy pytaniu bez limitu „Zakończ pytanie i pokaż wynik”. Odpowiedzi graczy i ranking prowadzący pokazuje ręcznie jak dotąd.
- **Gracze na pilocie:** lista (w poczekalni od razu, w grze rozwijana) z punktami i ✓ przy tych, którzy odpowiedzieli. Przycisk QR pokazuje kod powrotu `/<kod>#powrot=<token>` (fragment nie trafia na serwer, telefon zapisuje token i czyści adres), więc gracz wraca z tymi samymi punktami, także na innym telefonie. ✕ usuwa gracza przez `/api/gracz` (klucz serwisowy, sprawdza klucz pilota), potem `po_usunieciu_gracza` rozsyła zmianę i kończy pytanie, jeśli reszta już odpowiedziała. Usunięty telefon wraca do dołączania z komunikatem.
- **Ekran odpowiedzi:** brak odpowiedzi jest w czerwonej ramce na końcu z napisem „brak odpowiedzi”, częściowo dobre w żółtej ramce „Częściowo”.
- **Telefon:** czas odpowiedzi w złocie, reszta zdania szara. Odbiór nagrody: „Potwierdź odbiór” bez „klika barman”, okno „Kliknij dopiero po odebraniu nagrody” (Odebrana / Jeszcze nie). Podpis „Aplikacja · lukasznowak.dev” tylko na końcu gry, bez podkreślenia.
- **Panel gry:** sekcja „Nagrody” przy zakończonej grze: miejsce, nagroda, gracz i „odebrana 22.10, 21:09” albo „jeszcze nieodebrana”.
- **TV:** logo Bractwa stale w prawym dolnym rogu, u góry tylko lokal × browar. Bez podpisu autora. Na końcu gry mniejsze loga i stopnie, żeby zwycięzca nie wchodził na tytuł (odstęp 41 px przy 1920×1080).
- **Ekran lokalu po grze:** na pilocie po końcu „Pokaż plansze na ekranie lokalu” (`ekran_zwolniony`), bez tego plansze wracają same po 10 minutach. Przez 6 godzin po grze plansze mają dodatkową: „Zwycięzcy ostatniego quizu” z pierwszą trójką (gracze z punktami).
- W kreatorze przykład nagrody to „Lane Piwo gratis” (nigdzie „piwo z kija”).
- Sprawdzone na localhost z tymczasową grą VVPD (usunięta): QR powrotu, usunięcie gracza, wynik po czasie i po ostatniej odpowiedzi, wszystkie nowe typy na telefonie, TV i pilocie, ekran odpowiedzi, podium, odbiór nagrody, sekcja nagród i historia w panelu, plansza z podium Piwiarni (tylko podgląd). Przycisku plansz na pilocie nie klikałem na prawdziwym lokalu, akcja `plansze` sprawdzona SQL-em.

### Wyścig zamiast tabeli (23.10)

- Migracja `20261023085944_widok_rankingu`: `sesje.widok_rankingu` (`tabela` domyślnie albo `wyscig`), funkcja `pilot_widok` (odmawia wyścigu przy więcej niż 12 graczach), pole w `stan_sesji`, zmiana rozsyła `stan`.
- Pilot: „Ranking na TV: Tabela / Wyścig” przez całą grę (poza podium i końcem). Przy więcej niż 12 graczach „Wyścig” jest wyszarzony z dopiskiem, a TV wraca do tabeli, gdyby ktoś dołączył po wyborze. Tabela zostaje bez zmian.
- Zasada (`src/lib/gra/wyscig.ts`): meta to koniec quizu. Po pytaniu lp z n lider stoi na 12% + 88% · lp/n trasy (od 23.10; wcześniej 55% + 45%), więc odległość do mety pokazuje postęp quizu, a na mecie staje po ostatnim pytaniu. Reszta proporcjonalnie do swoich punktów, nikt nie przekracza mety.
- Wygląd „Wyścig po piwo” (`wyscig.tsx`, od 23.10 zamiast „Wyścigu do nalewaka”): gracze jadą po drewnianej ladzie w stronę szklanki na mecie. Szklanka jest na początku pusta (blady zarys) i z każdym pytaniem nalewa się piwem z pianą na powierzchni (pytanie lp z n to lp/n szklanki), na końcu „Nalane!”. Najpierw stan sprzed pytania, po chwili piwo dolewa się, awatary przesuwają, punkty doliczają się z „+zdobyte”. Tory w kolejności miejsc, przy 9–12 graczach ciaśniej.
- Grafiki szklanki i lady (`public/grafiki/`) wygenerowało API obrazów OpenAI (gpt-image-1) skryptem `scripts/grafiki.mjs`: `node --env-file=.env.local scripts/grafiki.mjs [nazwa]`. Skrypt przycina i zmniejsza obrazy (sharp). Klucz `OPENAI_API_KEY` jest tylko w `.env.local`, na Vercelu go nie ma, bo grafiki leżą w repo.
- Sprawdzone na localhost z grą NHXP (6, 12 i 13 graczy, usunięta). Po pierwszej wersji (lider na lp/n trasy, na początku prawie puste tory) zmienione na start lidera od 55%. Kolejne wyglądy torów do wyboru w ustawieniach rozgrywki są w POMYSLY.md.

### Telewizor OLED bez wygaszacza (23.10)

- **Ruchome tło** wszystkich ekranów `/ekran` (`tlo.tsx`): ciepłe plamy światła jak od świec, które wolno dryfują, i złote bąbelki unoszące się jak w kuflu. Słabe, żeby nie przeszkadzało w czytaniu, na samych transformacjach CSS. Ruch na całym ekranie dodatkowo pomaga OLED-om.

- Każda scena TV (`Scena` w `tv.tsx`, hooki w `src/lib/ekran-tv.ts`) prosi przeglądarkę o Screen Wake Lock (ponawia po powrocie karty z tła).
- Pierwsza wersja z niewidocznym wideo 2×2 px z płótna (`captureStream`) nie wystarczyła: telewizor i tak włączył wygaszacz. Teraz pod tłem gra na całym ekranie prawdziwy plik `public/wideo/czuwanie.mp4` (H.264, 128×72, 6 s, 3 KB, prawie czarny, nagrany w przeglądarce MediaRecorderem, bo nie ma ffmpeg), wyciszony i zapętlony, wznawiany co 20 s, gdyby stanął. Do sprawdzenia na telewizorze.
- Przeciw wypaleniu OLED cała scena przesuwa się co 2 minuty o kilka pikseli (7 położeń, do 3 px), więc logo w rogu i kropki plansz nie stoją ciągle w jednym miejscu. (Usunięte 25.10 na prośbę Łukasza: ekrany i tak ciągle się zmieniają, więc wypalenie nie grozi.)
- Sprawdzone w przeglądarce Chromium: wideo gra, Wake Lock dostępny. Na prawdziwym telewizorze LG do sprawdzenia, czy wygaszacz już się nie włącza (jeśli tak: wyłączyć go w ustawieniach TV, opis w TEST.md).

### Quiz o serialach, lokal „Dom” i porządki (23.10)

- **Quiz „Seriale · quiz testowy (Claude)”**: 15 pytań, wszystkie rodzaje na przemian (7 × jedna odpowiedź, 3 × kilka, 3 × kolejność, 2 × pary). Rozwiązania sprawdzone funkcją `wewn.ocena`.
- **Lokal „Dom”** (Częstochowa, ekran `/ekran/dom`) z logo `public/loga/dom.svg`: złoty dom w kole, do testów w domu.
- **Porządki:** `sekundy` w jednym miejscu (`src/lib/czas.ts`, wcześniej dwie kopie), pole na kod przeniesione do `/ekran` (jedyne użycie), usunięte nieużywane `IkonaNowaKarta`, reeksport `DaneWybor`, klasy `.waska` i `.plansza-haslo`, nadpisania CSS scalone z oryginalnymi regułami. Nieaktualne komentarze poprawione.
- W bazie zostaje nieużywana `public.gracze_sesji` (zastąpiona przez `lista_graczy`): MCP odrzuca `drop function`. Nic nie psuje (zwraca nicki jak `lista_graczy`), można ją usunąć ręcznie w SQL Editorze Supabase.

### Punktacja, zapowiedź quizu i udostępnianie (23.10)

**Punktacja (ustalone 23.10):**
- Kilka odpowiedzi zostaje: (trafione − błędne) / liczba poprawnych, minimum 0. Przy większej liczbie złych odpowiedzi (np. 5 odpowiedzi, 2 dobre) kara za strzelanie rośnie.
- Kolejność liczona po sąsiadach (migracja `20261023061141_kolejnosc_sasiedzi`): część dobrze ułożonych par kolejnych elementów, n − 1 par. B C D A zamiast A B C D daje 2/3 zamiast 0, odwrotnie 0. Na telefonie zielone są elementy z dobrym sąsiadem, a pod spodem jest „Twoja kolejność: …”.
- Pary bez zmian: część dobrze połączonych.

**Zapowiedź quizu** (migracja `20261023061407_zapowiedz`: `sesje.planowany_start`, `sesje.poczekalnia_otwarta`, akcja `otworz`):
- Kreator ma pole „Godzina startu” i dwa przyciski: „Uruchom grę” (QR od razu) albo „Zapowiedz na ekranie lokalu” (poczekalnia zamknięta).
- Ekran lokalu przy zapowiedzi: pierwsza plansza z logami (przy kranoprzejęciu lokal × browar, bez Bractwa, które ma swoją planszę), „Kranoprzejęcie: …”, tytułem quizu, „Start o 20:00” i odliczaniem. Pozostałe plansze mają odliczanie w pigułce w rogu.
- Pilot pokazuje „Start o … · za …” i „Otwórz poczekalnię (QR na TV)”. Po otwarciu TV przechodzi sam na poczekalnię z QR i godziną startu. Quiz startuje dalej przyciskiem, nie sam o czasie.
- Dopóki poczekalnia jest zamknięta, `dolacz` odmawia, a telefon pokazuje „Zapisy jeszcze nie ruszyły”.

**Udostępnianie w social mediach:**
- Strona nie może sama oznaczyć kont ani dodać relacji (Instagram i Facebook na to nie pozwalają), więc robimy gotową grafikę i systemowe „Udostępnij” (telefon: Instagram, Facebook, Messenger…; komputer: pobranie pliku).
- Telefon gracza po quizie (każdy, kto ma miejsce): „Udostępnij wynik”, grafika relacji 1080×1920 z logami (Bractwo, lokal, × browar), okazją, tytułem, medalem z selfie albo literą, nickiem, miejscem, punktami i kontami do oznaczenia. Pod przyciskiem konta do skopiowania („Kopiuj”).
- Panel, zakończona gra: „Grafika podium do social mediów”, post 1080×1350 z pierwszą trójką (gracze z punktami) i kontami do oznaczenia.
- Konta Instagram: lokal w ustawieniach lokalu, browar w kreatorze (`lokale.instagram`, `sesje.browar_instagram`). Konto Bractwa jest stałą w `src/lib/konta.ts` i czeka na nazwę (na stronie Bractwa jest tylko Facebook `BractwoPiwne1995`).
- Grafiki rysuje przeglądarka (`src/lib/grafika-wyniku.ts`, canvas). Logo Bractwa jest przemalowane na biało.
- Sprawdzone na localhost z tymczasowym lokalem „Test Claude” i grą MGBT (usunięte): plansze z zapowiedzią, pilot, otwarcie poczekalni, poczekalnia z odliczaniem, grafika gracza i podium. Systemowego okna „Udostępnij” na prawdziwym telefonie nie sprawdzałem.

### Poprawki 23.10: odznaczanie, kabelki, pilot, 5 s odliczania

- **Kolejność i pary:** ponowne stuknięcie zaznaczonego elementu odznacza go, tak jak w „Kilka odpowiedzi”. W kolejności dalsze numery się przesuwają, a przycisku „Cofnij” już nie ma. W parach stuknięcie połączonego lewego albo prawego rozłącza parę.
- **Pary:** zamiast prostych kresek „kabelki” jak w mapach myśli: krótko poziomo, łuk, znów poziomo (ścieżka SVG z krzywą Béziera). Kolumny są dalej od siebie (44 px).
- **Pilot:** zapowiedź rodzaju następnego pytania przy każdym pytaniu, także zwykłym. „Zakończ pytanie wcześniej” i „Zakończ grę” to zwykłe przyciski (wcześniej wyglądały jak tekst).
- **Odliczanie przed pytaniem trwa 5 s** (migracja `20261023060006_odliczanie_5_sekund`, `pilot_akcja`).
- Sprawdzone na localhost (gra XTFD, usunięta): odliczanie od 5, odznaczanie w kolejności z przesunięciem numerów, kabelki i rozłączanie pary, zapowiedź na pilocie.

### Zapowiedź rodzaju pytania i kreski w parach (22.10)

- **Pilot** (migracja `20261022200536_pilot_nastepne_pytanie`, `pilot_stan` zwraca `nastepne_typ`): przed startem pytania innego niż zwykłe A–D (albo przy powrocie do A–D) pokazuje w złotej ramce „Następne pytanie: pary. Powiedz graczom przed startem: „Połącz w pary””.
- **Odliczanie** na telefonie i TV pokazuje pod „Przygotuj się!” rodzaj pytania: „Wybierz jedną odpowiedź”, „Zaznacz wszystkie poprawne”, „Ułóż we właściwej kolejności”, „Połącz w pary” (TV w złotej pigułce).
- **Pary na telefonie:** połączone kafelki łączy kreska w kolorze pary (SVG nad siatką, pozycje liczone z DOM po każdej zmianie i przy zmianie rozmiaru). Kolumny są dalej od siebie, a kafelki niższe, więc ekran mieści się na 375×667.
- Plansza z logiem Bractwa na ekranie lokalu jest bez „Piwu Cześć!”.
- Sprawdzone na localhost (gry NXBT i TRBC, usunięte): zapowiedź na pilocie, „Połącz w pary” w odliczaniu na telefonie, kreski przy trzech parach. Odliczania na TV nie oglądałem na zrzucie.

### Domena, strona główna i „Jak to działa” (22.10)

- **Domena ✅:** `https://quiz.bractwopiwne.pl` działa. Rekord A `quiz` → `76.76.21.21` jest w strefie DNS na hostingu Hostido (konto host367070, DirectAdmin → Zarządzanie DNS). Panel domeny zostaje na „Przekierowanie na serwery DNS”, a MX Google są nietknięte. Certyfikat Let's Encrypt wystawił Vercel (`vercel certs issue`, sam się nie wystawił po dodaniu rekordu), `http://` przekierowuje na `https://`.
- **Strona główna (dla obsługi):** lista ekranów lokali z logami i linkami `/ekran/<adres>` (ISR co 5 minut), a dla prowadzących „Panel obsługi”. Bez pola na kod gry, bo gracze skanują QR. Na TV pod QR jest pełny adres gry (`quiz.bractwopiwne.pl/KOD`) dla tych, którzy nie mogą skanować.
- **`/jak-to-dziala`:** była strona z opisem całości dla prowadzących. Usunięta tego samego dnia, za dużo czytania: zasady opisze Zbyszkowi Łukasz.
- **Favicon:** logo Bractwa z bractwopiwne.pl (`src/app/favicon.ico` 32×32, `icon.png` 192×192, `apple-icon.png`) zamiast ikony Next.js. `favicon.ico` jest potrzebny osobno, bo część przeglądarek pobiera go bezpośrednio.

### Poprawki po trzecim teście (22.10)

- **Przyciski:** hover złotego, zielonego i czerwonego przycisku tylko je rozjaśnia (wcześniej reguła zwykłego przycisku dawała szare tło i tekst był prawie niewidoczny). Przejście trwa 0,35 s. Na stronie gry „Prowadź z tego urządzenia”.
- **Nicki:** baza już pilnuje unikalności w grze bez względu na wielkość liter. Telefon przy zajętym nicku pisze „Ktoś już gra jako „Piotr”. Dopisz coś od siebie, np. pierwszą literę nazwiska („Piotr K.”) albo przydomek” i niczego nie dopisuje sam. Pole to „Imię albo nick”, a w instrukcjach na TV nie ma drużyn („Wpisz swoje imię albo nick”).
- **Telefon:** „Niestety źle” w czerwonej karcie, zła odpowiedź z czerwoną ramką i czerwonym skreśleniem.
- **Bez przewijania na 375×667:** wynik pytania jest ciaśniejszy (miejsce jednym wierszem pod werdyktem, bez grafiki, niższe kafelki), medal nad kartą nagrody jest mniejszy, a poczekalnia pokazuje 8 nicków (z Twoim) i „+N”. Sprawdzone: dołączanie, poczekalnia przy 19 graczach, pytanie, wynik, koniec z nagrodą.
- **Odbiór nagrody z panelu:** przy każdej nagrodzie „Oznacz odbiór” albo „Cofnij” (akcja `ustawOdbiorNagrody`, klucz serwisowy). Telefon gracza zmienia kartę w ciągu kilku sekund w obie strony.
- **Podium 3D:** stopnie ze złota, srebra i brązu (cieniowany przód, jaśniejsza górna ścianka w perspektywie, numer wybity w metalu, cień pod spodem). Metal idzie za miejscem, więc przy remisie na 1. miejscu oba stopnie są złote. Nicki 2. i 3. miejsca w kolorze metalu.
- **Plansze lokalu:** pierwsza ma duże logo Bractwa obok dużego logo lokalu, plansza „Piwu Cześć!” ma większe logo i mniejszy napis. Na planszach z dużym logo nie ma małego w rogu.
- Sprawdzone na localhost z tymczasowymi grami XCCN i JPJQ (usunięte).

### Fanfary na podium (22.10)

- **TV:** gdy wjeżdża zwycięzca, konfetti wybucha z obu dolnych rogów i przez 6 s pada złoty deszcz (`canvas-confetti`, kolory z design systemu, wyłączone przy `prefers-reduced-motion`). Nad zwycięzcą jest napis „Zwycięzca”, a jego stopień pulsuje blaskiem. Na końcu gry jest krótszy wybuch.
- **Telefon:** podium, tabela i koniec to jeden ekran (`[kod]/fanfara.tsx`). Do chwili, gdy TV pokaże stopień gracza, telefon wyświetla „Werble… patrz na telewizor”. Potem pierwsza trójka dostaje medal (złoty, srebrny, brązowy) z wjazdem, „Zwycięstwo!” / „Srebro!” / „Brąz!” i konfetti (przy 1. miejscu z deszczem). Pozostali widzą swoje miejsce.
- **Wspólny zegar:** czasy wjazdu stopni są w `src/lib/gra/podium.ts`. TV i telefony liczą je od `faza_od` podium w bazie (z poprawką zegara), więc odsłaniają się razem, a przeładowane TV nie powtarza animacji.
- Sprawdzone na localhost z tymczasową grą HUFB (4 graczy): telefon zwycięzcy (werble, potem medal i konfetti) i TV (3. i 2. po 1,5 s, zwycięzca z konfetti po ~4 s). Gra usunięta. Dźwięków nie ma: przeglądarki blokują je bez kliknięcia na TV (pomysł zostaje w POMYSLY.md).

### Historia zakończonych gier w panelu (22.10)

- Strona zakończonej gry (`/admin/gry/[id]`) ma sekcję **Wyniki**: tabela końcowa wszystkich graczy (miejsce z remisami, nick, punkty, dobre odpowiedzi x/N, średni czas; średni czas znika poniżej 560 px). Cały wiersz prowadzi do historii gracza.
- **Historia gracza** (`/admin/gry/[id]/gracze/[gracz]`): pytanie po pytaniu jego odpowiedź (litera i treść), czas i punkty. Pasek z lewej jest zielony przy dobrej odpowiedzi, czerwony przy złej, szary przy braku odpowiedzi. Przy złej i braku pokazuje też poprawną. Na dole przejście do poprzedniego i następnego gracza w tabeli.
- Bez zmian w bazie: panel liczy wyniki z tabel kluczem serwisowym (`gry/wyniki.ts`). Pytania gry to zadania quizu do `zadanie_nr`, na którym gra stanęła. Jeśli quiz zmieniono po grze, treści pytań i odpowiedzi są w obecnej wersji, a punkty i czasy z gry.
- Sprawdzone na localhost na zakończonej grze LQRL (1280 px i 375 px), tylko podgląd, bez zmian w danych.

### Wybór miasta i lokalu (ustalone po dniu 1)

- Uruchamianie gry w panelu idzie krokami: **miasto → lokal → quiz** (+ okazja, tryb, bonus). Lista miast to unikalne wartości `lokale.miasto`, bez osobnej tabeli. Jeśli kiedyś miasta będą potrzebowały własnych danych, wydzielimy je wtedy.
- Na start są dane dla jednego miasta, Częstochowy, z lokalami **Piwiarnia w Alejach** i **PPR** (migracja z danymi startowymi z dnia 2).
- Logo wybranego lokalu pokazuje się na TV (poczekalnia, podium) obok logo Bractwa. `stan_sesji` już je zwraca (`lokal.logo_url`).
- Loga są w `public/loga/` (`piwiarnia-w-alejach.png`, `ppr.png`): kwadrat 800×800, przycięte do koła, z przezroczystością na zewnątrz. Oba są w oryginalnych kolorach (logo Piwiarni w Alejach nie odwracamy). Piwiarnia w Alejach ma dodany biały okrąg na zewnątrz, oddzielony czarną szczeliną, tak jak na ich Instagramie. Bez niego czarna obwódka ginęła na czarnym tle. Oryginały są w `docs/loga/`.
- Logo Bractwa jest w `public/loga/bractwo.svg`: czarne, z viewBox przyciętym do samego logo. Na ciemnym tle robimy je białym przez `filter: invert(1)`. Komponent `LogoQuiz` (`src/components/logo-quiz.tsx`) to logo + złoty napis „Quiz” i zastępuje tekst „Bractwo Quiz” w interfejsie. Tytuł karty przeglądarki zostaje tekstem.

### Etapy, finał trójki i nowe typy pytań (23.10) ✅

- Migracja `20261023112811_etapy`: tabela `etapy` (nazwa, zasady, mnożnik ×1–×3, własny czas albo czas gry, `finalowy`), `zadania.etap_id`, faza `etap`, `sesje.finalisci`. Funkcja `admin_uporzadkuj_quiz` numeruje pytania po kolei etapami; panel woła ją po każdej zmianie.
- Przed pierwszym pytaniem etapu TV pokazuje planszę: nazwa, zasady, mnożnik, czas, liczba pytań, droga przez etapy i telefon z animacją, na którym palec pokazuje, jak odpowiadać (`ekran/_ekran/demo.tsx`, po jednej pętli na typ). Telefon pokazuje to samo krócej. Prowadzący startuje etap z pilota („Start etapu”), wcześniej może wrócić do rankingu.
- Mnożnik etapu mnoży punkty w `zapisz_odpowiedz`. Minusów za błędy świadomie nie ma.
- Finał trójki: przy wejściu do etapu `finalowy` baza wybiera 3 najlepszych (remis: krótszy łączny czas). Pozostali widzą pytania na telefonie z dopiskiem, że kibicują, a baza odrzuca ich odpowiedzi (`kibic`). Pytanie kończy się, gdy odpowiedzą finaliści. Przy 3 graczach i mniej grają wszyscy.
- Wyścig po piwo zmienia się z etapem: szklanka rośnie i jest bliżej (krótsze tory), a w finale trzy drogi zbiegają się pod szklanką na środku (lider środkiem, drugi z lewej, trzeci z prawej).
- Nowe typy: `prawda_falsz` (dwa duże przyciski, na TV dwa kafle z rozkładem) i `szacowanie` (suwak z −/+ na telefonie, na TV oś z kropkami odpowiedzi i złotą kreską poprawnej, „najbliżej” trzy osoby). Szacowanie: trafienie co do kroku = pełne punkty, dalej liniowo do zera w odległości `tolerancja` (domyślnie ćwierć zakresu).
- Dodatki do każdego pytania: podpowiedzi (do 4, odsłaniane po kolei co czas/liczba sekund; baza wysyła tylko te, których czas minął) i odsłaniana grafika (rozmyta, wyostrza się do końca czasu).
- Panel: etapy nad pytaniami (edycja w miejscu, strzałki, usuwanie przenosi pytania do sąsiada), szablony etapów (Rozgrzewka, Błyskawica, Kilka dobrych, Strzał liczbowy, Połącz i ułóż, Degustacja na ślepo, Finał), w edytorze pytania wybór etapu, nowe typy, podpowiedzi i odsłanianie.
- Quizy Piwo, Seriale i Filmy dostały etapy i nowe pytania (4 × prawda/fałsz, 3 × szacowanie). Zostały quizami testowymi.
- Szablony quizu (migracja `20261023115224_plan_etapu`: `etapy.plan_pytan`, `etapy.typ_domyslny`): przy tworzeniu quizu wybór szablonu (Klasyczny pub quiz, Krótki, Degustacja, Bez etapów), a potem zmiana etapów i liczby pytań (−/+, kolejność, usuwanie, dodawanie). Na stronie quizu etap pokazuje „pytania 2 z 6”, −/+ zmienia plan, a brakujące pytania to linki „+ pytanie 3 z 6”. Nowe pytanie z etapu zaczyna od rodzaju z szablonu etapu, „Dodaj i następne” od razu otwiera kolejne w tym samym etapie.
- Bąbelki w szklance wyścigu: unoszą się od dna, widać je tylko w nalanym piwie (pod pianą).
- Zdjęcie nagrody z przeróbką AI: w kreatorze gry przy nagrodzie „📷 Zdjęcie nagrody”, telefon zmniejsza zdjęcie do 1024 px, `/api/nagroda` (tylko zalogowany panel, limit 40 dziennie) wysyła je do OpenAI (gpt-image-1, edycja, średnia jakość, przezroczyste tło, ok. 20 s, ok. 0,05 $) i zapisuje oryginał i przeróbkę w `grafiki/nagrody/<dzień>/`. Prowadzący wybiera przeróbkę albo oryginał. Prompt każe nie dopisywać napisów (pierwsza wersja wymyśliła etykietę) i zostawić czyste tło (poświatę dodaje CSS). Zdjęcia nagród widać na starcie (poczekalnia na TV), na planszy finału („Gracie o”), na podium i na karcie zwycięzcy w telefonie. W wyścigu zdjęcia nie ma: szklanka na mecie to główna nagroda, a pod nią jest jej nazwa („Gracie o: …”). Pilot przy quizie z etapami nie pokazuje już „Następne pytanie: …”, bo tłumaczy to plansza etapu. Klucz `OPENAI_API_KEY` jest teraz też na Vercelu.
- Wyścig równymi krokami: lider startuje z 12% trasy (nie z 55%) i co pytanie przesuwa się o tyle samo. Pusta szklanka nie ma bladej piany u góry, a piana tworzy się na powierzchni nalewanego piwa i gęstnieje z każdym pytaniem.
- Telefon w rankingu, gdy TV pokazuje wyścig: awatar obok nicku, a pod miejscem i punktami duża szklanka na środku, która dolewa się po pytaniu (bez toru, jak chciał Łukasz).
- Selfie w stylu Bractwa: w poczekalni na telefonie pod selfie „✨ Przerób w stylu Bractwa” z dopiskiem, że zdjęcie trafia do OpenAI. `/api/awatar` przerabia obecne selfie (portret w złotym świetle na tle baru, twarz rozpoznawalna, niska jakość, ok. 0,02 $), podmienia je i usuwa stare. Raz na zdjęcie (`-ai-` w nazwie pliku), najwyżej 40 w grze.
- Szklanka napełniała się za szybko (poziom szedł od dna aż do szczytu piany z grafiki, więc po ok. 70% pytań piwo było przy krawędzi). Teraz piwo rośnie od dna do krawędzi szklanki, a czapa piany pojawia się dopiero po ostatnim pytaniu (`src/lib/gra/szklanka.ts`, wspólne dla TV i telefonu).
- Tło TV: zamiast bąbelków trzy szerokie smugi światła z góry, które powoli się kołyszą (bąbelki zostały tylko w szklance, drobniejsze). Przy ograniczonym ruchu tło stoi, ale wideo czuwania gra dalej (wcześniej znikało całe tło).
- Na planszy etapu nie ma logo Bractwa w rogu (zasłaniało podpis pod telefonem z animacją).
- Finał wyścigu: drogi kończą się przed szklanką, a pod nią jest miękka poświata zamiast obręczy, żeby nic nie zasłaniało szkła.

### Finał jako seria, zapowiedź finału, pary w pionie (23.10) ✅

- Etap „seria” (migracja `20261023124502_seria`: `etapy.seria`, `sesje.seria_etap`, faza `seria`): wszystkie pytania etapu naraz, każdy odpowiada we własnym tempie, bez wyniku po pytaniu. Czas etapu to czas na całą serię (domyślnie 60 s). Punkty: 500–1000 za dobrą zależnie od czasu od startu serii, razy mnożnik. Telefon bierze pytania z `seria_pytania` (dopiero po starcie, bez rozwiązań) i zapisuje przez `zapisz_odpowiedz_serii`. Seria kończy się, gdy wszyscy grający odpowiedzą na wszystko albo minie czas (`dokoncz_pytanie` sprawdza też serię); po ostatnim etapie od razu podium, bez rankingu. (Wieczorem 23.10 zmienione: koniec, gdy ktoś dobiegnie do piwa, potem werble, sekcja niżej.) Pilot: „Start serii”, postęp graczy i „Zakończ serię wcześniej”.
- Finał w testowych quizach Piwo i Gry to seria 10 pytań prawda/fałsz (120 s, ×2). Pary i kolejność z dawnego finału przeszły do etapu „Połącz i ułóż” (w quizie Piwo nowy etap). Szablon etapu „Finał” to teraz seria prawda/fałsz.
- TV w serii: równe drewniane drogi z lewej zbiegają się pod pełną szklanką z pianą (`drogi.tsx`), każda dobra odpowiedź to krok (na żywo, po każdej odpowiedzi), u góry zegar, przed startem odliczanie. Ten sam układ dróg w rankingu po finale (zamiast dwóch skośnych i krótkiej środkowej).
- Zapowiedź finału: w etapie przed finałem plansza („Walka o finał: 3 najlepszych wchodzi do finału, N odpada”), telefon („Do 3. miejsca brakuje Ci X pkt” albo „Jesteś w finałowej trójce”) i kreska „ta trójka wchodzi do finału” pod 3. torem wyścigu. Wcześniejsze plansze mówią, że na końcu jest finał trójki (migracja `20261023123729_zapowiedz_finalu`).
- Po ostatnim pytaniu pilot ma od razu „Pokaż podium” (bez „Pokaż ranking”).
- Pary na telefonie działają w pionie, w dwóch kolumnach. Plansza etapu i demonstracja pokazują instrukcję bez obracania telefonu.
- Szacowanie: ekran odpowiedzi to oś przybliżona do strzałów, z poprawną liczbą na złotej kresce i graczami tam, gdzie strzelali (za mało z lewej, za dużo z prawej), z liczbą i punktami. Demo na planszy ma żartobliwe pytanie, żeby nie zdradzać odpowiedzi z quizów.
- Bez pytań o koncerny: pytania o Żywiec zamienione na rok pierwszego pilznera (1842) i Reinheitsgebot (1516).
- Smugi światła w tle wędrują przez cały ekran w pętli (70–110 s), oprócz kołysania.

### Po teście: wyścig zawsze, bonus z czasu, bez przeróbek AI (23.10, późny wieczór) ✅

- **Ranking zawsze jako wyścig** (do 12 graczy, przy większej liczbie tabela), także w quizie bez etapów. W teście TV pokazywał tabelę, bo ekran (Safari na Macu) był otwarty przed wdrożeniem i działał na starym kodzie, który brał domyślną „tabelę” z bazy, a nowy pilot nie miał już przełącznika. Domyślny `widok_rankingu` w bazie to teraz `wyscig` (migracja `20261023164834_wyscig_domyslnie`).
- **Ekrany TV przeładowują się same po wdrożeniu:** build wpisuje w kod strony commit (`NEXT_PUBLIC_WERSJA` w `next.config.ts`), a TV i ekran lokalu co minutę pytają `/api/wersja` i przy innej wersji robią przeładowanie, ale nie w trakcie odliczania, pytania, serii, werbli ani odsłony podium (`useNowaWersja` w `src/lib/ekran-tv.ts`). Lokalnie wersja jest pusta i nic się nie dzieje. Sprawdzone na localhost z podstawioną odpowiedzią.
- **Bonus z czasu także bez limitu:** 1000 → 500 przez 30 s (wielokrotny, pary i kolejność 60 s). Wersja z kolejności dawała przy jednym telefonie zawsze 1000.
- Odliczanie przed pytaniem i serią znowu 3 s (migracja `20261023165219_odliczanie_3_sekundy`).
- Selfie w stylu Bractwa (AI) wyłączone: na produkcji przeróbka się nie wyświetlała. Zostały zwykłe zdjęcia. Usunięte `/api/awatar` i `styl-awatara.tsx`; tabela `przerobki_ai` została w bazie (pusta, nic jej nie używa). Pomysł wraca do `docs/POMYSLY.md`.
- Przy parach nie ma już „trzymaj telefon pionowo” (zawsze jest pionowo).
- Przyciski prawda/fałsz w serii: płaskie zielone i czerwone koła z samym czarnym ✓ i ✗ (napis tylko dla czytników ekranu), lekki cień, bez ramek. Pytanie ma zawsze miejsce na trzy linie, więc przyciski stoją w tym samym miejscu przy pytaniu w jednej i w dwóch liniach (sprawdzone na localhost: góra przycisków zawsze 250 px).
- Pytanie w finale quizu o piwie: „mocniejszą wersję porteru” zamiast „portera” (migracja `20261023165833_porteru`).
- **Utrudnienia w drugiej połowie finału** (`[kod]/seria.tsx`, style `.utrudnienie-*` w `globals.css`): od połowy pytań serii (przy 14 od 8.) każde pytanie robi co innego, po kolei: drży, przyciski zamieniają się miejscami (✗ z lewej), mgła, dryf, zanikanie, przyciski uciekają, kołysanie. Efekt zależy tylko od miejsca pytania w serii, a kolejność pytań jest wszystkim wspólna, więc każdy finalista ma przy tym samym pytaniu to samo. W pasku „utrudnienie!”, na planszy finału „Od połowy pytań utrudnienia”. Przy ograniczonym ruchu zostaje lekka mgła i zamiana. Sprawdzone na localhost (klasy i animacje przy pytaniach 7–14).

### Werble po finale, mniej napisów, szklanka dla Samsunga (23.10, wieczór) ✅

- **Koniec finału jak w wyścigu** (migracje `20261023155910_werble`, `20261023161026_seria_meta_przy_piwie`): seria kończy się, gdy ktoś dobiegnie do piwa (wszystkie odpowiedzi dobre), gdy wszyscy grający odpowiedzą na wszystko albo gdy minie czas. Samo szybkie klikanie na oślep serii nie kończy. Po ostatniej serii jest nowa faza `werble`: TV gaśnie jak wyłączany telewizor (biały błysk zapada się w kreskę i punkt), telefony też robią się czarne, a po chwili wolno pojawia się „Werble…” z trzema skaczącymi kropkami (`src/components/werble.tsx`). Wynik pokazuje dopiero prowadzący przyciskiem „Pokaż podium”. Na TV w serii same nicki, bez „pytanie X/14”, żeby do końca nie było wiadomo, kto wygrywa.
- Odliczanie przed serią jest w nagłówku („Start za 3”), drogi i gracze są widoczne od razu, a zegar pojawia się po odliczaniu.
- Prawda/fałsz w serii: dwa okrągłe przyciski pod kciuki (zielony ✓, czerwony ✗). Telefon zawsze pionowo: Safari na iPhonie nie pozwala zablokować poziomu, a w poziomie paski przeglądarki zjadają ekran.
- Ranking na TV: quiz z etapami zawsze pokazuje wyścig po piwo (do 12 graczy), quiz bez etapów tabelę (później: wyścig także bez etapów). Przełącznik Tabela/Wyścig zniknął z pilota (kolumna `widok_rankingu` została w bazie).
- Kreator gry: bez drużyn (każdy gra sam), domyślnie „bez limitu”, bez przełącznika bonusu.
- Mniej napisów: w quizie z etapami bez rodzaju pytania w odliczaniu i pod pytaniem (TV i telefon), bo tłumaczy to plansza etapu. Na planszy etapu bez limitu czasu jest „Kto pierwszy, ten lepszy”. O odpadaniu mówi tylko etap tuż przed finałem (bez wcześniejszego „na końcu finał”). Z telefonów zniknęły wszystkie „patrz na telewizor”.
- Pary bez czerwonego koloru (kojarzy się z błędem): czwarta para jest turkusowa. Demo na planszy etapu nie zdradza już odpowiedzi z quizu o piwie (kolejność i pary na naczyniach zamiast etapów warzenia i stylów).
- **Szklanka bez `clip-path`** (`src/components/szklanka-piwa.tsx`, wspólna dla TV i telefonu): na telewizorze w lokalu (Samsung, Tizen 9, Samsung Internet na Chrome 120, sprawdzone w logach Supabase) szklanka była cały czas pełna, a ruszała się tylko piana. Teraz warstwy to bloki z `overflow: hidden` i grafiką przyklejoną do dołu, a ruch robią przejścia CSS. Piana leży na piwie jak elipsa od ścianki do ścianki (powierzchnia widziana lekko z góry, ścianki zmierzone na grafice w `src/lib/gra/szklanka.ts`), a brzeg pustej szklanki to jasna elipsa z mgiełką szkła. Przywrócone style bąbelków i kafli prawda/fałsz na TV, które przypadkiem zniknęły przy przebudowie finału.
- Logo Bractwa jest w nagłówkach ekranów gry po prawej (`ekran/_ekran/logo.tsx`), a nie w rogu, gdzie zasłaniało podpis pod szklanką. Na podium tytuł quizu jest na dole, nad podium zostają same loga.
- Podium: zdjęcie nagrody między punktami a jej nazwą (z odstępem). Telefony z miejsc 1–3 pokazują zdjęcie nagrody, jeśli jest (także po odbiorze), inaczej samą nazwę. Pieczątka „Odebrana” wygląda jak odbita tuszem: podwójna ramka, obrót i przetarcia z maski szumu.
- (Później tego wieczoru wyłączone, patrz sekcja wyżej.) Selfie w stylu Bractwa przed dołączeniem: po wybraniu zdjęcia gracz widzi „Zwykłe” i „✨ W stylu Bractwa” i sam wybiera, które dodać (`[kod]/styl-awatara.tsx`). `/api/awatar` dostaje kod gry i zdjęcie, a przeróbkę oddaje telefonowi bez zapisywania. Limit 40 na grę liczy tabela `przerobki_ai` (migracja `20261023155620_przerobki_ai`). „Przeróbka się nie udała” to najpewniej filtr bezpieczeństwa OpenAI na prawdziwych twarzach: teraz `moderation: low`, kod błędu w logach i osobny komunikat dla odrzuconego zdjęcia.
- Wideo czuwania od nowa: zwykłe MP4 1280×720 z cichą ścieżką AAC (8 s, 70 KB, nagrane w przeglądarce i przepakowane `avconvert`). Pierwsza wersja (128×72, bez dźwięku) nie powstrzymała wygaszania Samsunga. Do sprawdzenia na TV; ustawienia Samsunga w `docs/TEST.md`.
- Pytania: w quizach Seriale i Filmy zniknął etap „Błyskawica”, a jego pojedyncze pytania prawda/fałsz (i cztery z Rozgrzewki Piwa) przeszły do finału serią (po 14 pytań, migracje `20261023161713_prawda_falsz_do_finalu`, `20261023161721_plan_finalu_14`). Stout w parach jest z Anglią (wywodzi się z londyńskiego porteru, Irlandia go rozsławiła). Etap może mieć 120 s. Quiz „Muzyka popularna” od Codexa jest w bazie (migracja `20261023161821_quiz_muzyka_popularna`) z poprawioną kolejnością albumów Taylor Swift i latami bez jednostki „rok”; nie ma etapów.
- Sprawdzone na localhost (gra testowa, potem usunięta w panelu): kreator, wybór zdjęcia przed dołączeniem, wyścig z nową szklanką, plansza finału, odliczanie w nagłówku, okrągłe przyciski, koniec serii, gdy bot dobiegł do piwa, werble na TV, telefonie i pilocie, podium ze zdjęciem nagrody i pieczątka. **Nie sprawdzone:** przeróbka AI (płatna), wygaszanie na prawdziwym Samsungu, bonus z kolejności przy kilku telefonach naraz.

### Pijany finał (23.10, noc) ✅

Pomysł Łukasza z 23.10. Decyzje: robimy przed testem 28.10, 8 pytań do zmiany w panelu, zawsze „szklanka” (nie „kufel”), koniec sam po czasie albo przyciskiem pilota, na TV tylko chaos z awatarami (bez „wyników ankiety”), pęknięcia szybki znikają przy werblach, drżenie awatarów w finale tylko przy włączonym trybie. W trakcie pracy Łukasz dorzucił: tryb jest **ukryty przed graczami**.

- **Baza** (migracja `20261023182659_pijany_final`): `sesje.pijany_final` (domyślnie wyłączony) i `sesje.za_barem`, faza `pijany`, tabela `pijane_pytania` (nr, treść, efekt) i funkcja `pijane_pytania(kod)` z podstawionymi wstawkami. `wewn.zakoncz_serie` przy włączonym trybie przechodzi po ostatniej serii w `pijany` na 90 s, `dokoncz_pytanie` po czasie daje werble, `pilot_akcja('werble')` kończy wcześniej. `stan_sesji` zwraca `pijany_final` i `za_barem`. Wynik jest ustalony przed dogrywką: jej odpowiedzi nigdzie nie idą.
- **Ukryty tryb:** na telefonie i TV nigdzie nie ma napisu „Pijany finał”. Telefon wygląda jak dalsza seria: „Seria · pytanie 15/14”, sekundy i pasek czasu dogrywki, na końcu „Gotowe! Odpowiedzi: 22 z 14. Czekamy na resztę.” Pytania dostają wszyscy, także kibice. TV ma ten sam nagłówek co seria (`NaglowekSerii` w `ekran/_ekran/seria.tsx`), a zegar liczy 90 s dogrywki. Nazwę trybu widzą tylko panel i pilot.
- **Pytania** wspólne dla wszystkich gier, w panelu: Quizy → „Pijany finał: pytania” (treść, przeszkadzacz, kolejność, do 20 pytań). Wstawki `{za_barem}` (bez imienia z kreatora to pytanie odpada) i `{lokal}` (gra bez lokalu: „tym barze”).
- **Telefon** (`[kod]/pijany.tsx`, style `.pijany` i `.efekt-*` w `globals.css`): cały ekran faluje coraz mocniej, każde pytanie ma swój przeszkadzacz (drżenie, zamienione kolory ✓/✗, przyciski w pionie, mgła, uciekające przyciski, pytanie do góry nogami, wszystko naraz). Przy pytaniu o osobę za barem „Fałsz” maleje i znika, „Prawda” rośnie i klika się sama, a szybka pęka (SVG nad ekranem; pęka też przy „wszystko naraz”). Pęknięcia znikają przy werblach. Przy ograniczonym ruchu zostają zamiany i pęknięcia, bez falowania i latania.
- **TV** (`ekran/_ekran/pijany.tsx`): przy włączonym trybie awatary w drugiej połowie serii drżą coraz mocniej (`--drzenie`, od połowy drogi lidera albo czasu). Seria przechodzi w dogrywkę bez nowego ekranu: awatary stoją tam, gdzie TV ostatnio widział serię (bez ostatniego kroku zwycięzcy, więc nic nie zdradza), cofają się od szklanki, drogi spadają w dół (`PlanszaDrog` w `drogi.tsx`), a potem awatary latają jak wygaszacz DVD, drżą, pulsują i widzą podwójnie, coraz mocniej przez 90 s. Szklanka się kołysze. Położenia liczy pętla klatek (`requestAnimationFrame`), więc odświeżanie stanu niczego nie zrywa. Po przeładowaniu TV finaliści startują z połowy drogi.
- **Pilot:** w serii dopisek, że potem przyjdzie pijany finał; w dogrywce „Wygrywa: …”, podium z punktami (z `pilot_gracze`), odliczanie i „Zakończ i pokaż werble” z potwierdzeniem.
- Pod werblami zostało samo „Wynik za chwilę.” (bez „Kto pierwszy dopadł piwa?”).
- Szablony nowego quizu: tylko „Klasyczny pub quiz” (bez czasu w opisie) i „Bez etapów”, w ramkach z `--r-card` zamiast pigułek. Zniknęły szablony quizu „Krótki” i „Degustacja” oraz szablon etapu „Błyskawica” (prawda/fałsz jest już tylko w finale). Etap „Degustacja na ślepo” został w szablonach etapów.
- Sprawdzone na localhost (`next start`, gra JHSW bez lokalu, gracze z SQL, potem usunięta w panelu): drżenie przy liderze 11/14, przejście w dogrywkę bez zdradzenia zwycięzcy, cofanie, spadające drogi, lot awatarów, telefon kibica i finalisty przez wszystkie 8 pytań (15/14…22/14, samoklik z „Kasia”, pęknięcia, „22 z 14”), koniec po czasie i przyciskiem z pilota, werble z nowym napisem, podium zgodne z pilotem, kreator i szablony quizu. **Nie sprawdzone:** kilka prawdziwych telefonów naraz, płynność lotu na Samsungu.

### Kibicowanie w finale (23.10, noc) ✅

Pomysł Łukasza z 23.10.

**Idea:** gracze, którzy odpadli z finału, w czasie serii nie widzą pytań finalistów, tylko napis „Kibicuj”. Niech coś robią: wysyłają okrzyki, które pojawiają się na TV przy finaliście.

**Propozycja:**
- **Telefon kibica (faza `seria`):** trzy awatary finalistów (stuknięcie wybiera, komu kibicujesz) i 6–8 przycisków z hasłami. Stuknięcie hasła wysyła okrzyk. W haśle zamiast kropek stoi awatar wybranego finalisty: „Dawaj [awatar]!”, „[awatar], piwo czeka!”, „Biegnij, [awatar]!”, „Wierzę w [awatar]!”, „Jeszcze trochę, [awatar]!”, „[awatar] po złoto!”, „Nie zawiedź, [awatar]!”, „Gaz do dechy, [awatar]!”. Bez wulgarności i bez zachęcania do picia.
- **TV:** okrzyk wyskakuje jako dymek nad drogą finalisty (z nickiem kibica, np. „Ania: Dawaj [B]!”), unosi się i znika po ok. 3 s. Kilka naraz, bez zasłaniania szklanki. Przy awatarze finalisty licznik dopingu (📣 12): widać, kto ma najgłośniejszych kibiców.
- **Finalista** w trakcie serii nic z tego nie widzi na telefonie (nie przeszkadza w odpowiadaniu), najwyżej na końcu „Kibicowało Ci 7 osób”.
- **Limit:** jeden okrzyk na 3 s na kibica (pilnuje baza), żeby nikt nie zaspamował TV.
- **Technika:** tabela `okrzyki` (sesja, gracz, finalista, hasło, czas; znika razem z grą), funkcja `kibicuj(token, finalista, haslo)`: tylko w fazie `seria`, tylko gracz spoza finału, z limitem czasu; zdarzenie Broadcast `okrzyk`, a TV dociąga ostatnie okrzyki jak resztę gry (Broadcast + zapasowe odpytywanie). W pijanym finale kibice odpowiadają na pytania jak wszyscy, więc okrzyki są tylko w prawdziwej serii.
- **Szacunek:** ok. pół dnia z testem.

**Ustalone z Łukaszem (23.10):**
1. Hasła: te 8 wyżej, na stałe w kodzie (bez edycji w panelu).
2. Licznik dopingu przy awatarze na TV i „Kibicowało Ci X osób” na telefonie finalisty po serii: oba tak.
3. Robimy przed testem 28.10.

**Jak zrobione:**
- **Baza** (migracja `20261023191228_okrzyki_kibicow`): tabela `okrzyki` (sesja, kibic, finalista, numer hasła 0..7, czas; kaskada z sesją i graczami, dostęp tylko przez funkcje). `kibicuj(token, finalista_nick, haslo)`: tylko faza `seria` z finałem trójki i w jej czasie (w pijanym finale faza to `pijany`, więc okrzyki nie przechodzą), tylko gracz spoza finału, najwyżej jeden okrzyk na 3 s (blokada wiersza gracza, odpowiedź `za_szybko` z `za_ms`), zdarzenie Broadcast `okrzyk`. `stan_sesji` w serii zwraca `okrzyki` (ostatnie 8 s, do 30) i `doping` przy każdym finaliście, a w `finalisci` zawsze `kibice` (ilu różnych graczy kibicowało).
- **Hasła** na stałe w `src/lib/gra/okrzyki.ts` (tekst przed awatarem i po nim), wspólny komponent `HasloKibica` (`src/components/haslo-kibica.tsx`). Baza zna tylko numer, więc kolejności haseł nie zmieniamy.
- **Telefon kibica** (`[kod]/kibic.tsx`): przed startem serii „Zaraz możesz im kibicować”, potem „Komu kibicujesz?” z trzema awatarami i 8 hasłami z awatarem wybranego finalisty, pasek 3 s po okrzyku, licznik 📣 wysłanych w pasku. Po czasie „Koniec serii! Patrz na telewizor.”
- **TV** (`ekran/_ekran/okrzyki.tsx`, warstwa `nad` w `DrogiFinalu`): dymek „Ewa: Gaz do dechy, [awatar]!” po lewej nad awatarem finalisty (za nim pusta droga), przy samym starcie obok awatara po prawej. Unosi się i znika po 3,5 s, najwyżej 3 naraz przy finaliście, starsze wyżej. Czas liczy się od chwili, gdy TV zobaczył okrzyk (starsze niż 6 s pomija, np. po przeładowaniu). Pod nickiem licznik 📣, który podskakuje przy nowym okrzyku. TV słucha zdarzenia `okrzyk` (`useNasluch`), telefony i pilot nie.
- **Finalista** w serii nic nie widzi; na podium (i w tabeli, na końcu) „📣 Kibicowały Ci 2 osoby!” (odmiana: osoba / osoby / osób).
- Sprawdzone na localhost (`next start`, gra CKQG bez lokalu, 6 graczy z SQL, potem usunięta w panelu razem z okrzykami): telefon kibica (wybór finalisty, okrzyk, licznik), odmowy w bazie (finalista, za szybko, nieznany finalista), dymki i liczniki na TV 1920×1080 (Broadcast dochodzi w ok. 0,5 s), położenie dymków przy starcie i dalej na drodze, „Kibicowały Ci 2 osoby!” na podium finalisty. **Nie sprawdzone:** wielu kibiców z prawdziwych telefonów naraz, płynność dymków na Samsungu (animacja to tylko `transform` i `opacity`).


### Główny i obsługa, zegar pijanego finału, mniej liczb (23.10, noc) ✅

- **Dwa poziomy panelu** (prośba Łukasza: dwie osoby znają hasło, a nie mają wiedzieć o pijanym finale ani widzieć jego quizów i gier). Dotychczasowe `ADMIN_HASLO` to teraz **obsługa**, nowe `ADMIN_HASLO_GLOWNE` (Vercel, tylko Łukasz) to **główny**. Rola siedzi w podpisanym ciasteczku (`rola.wygasa.podpis`), a stare ciasteczka bez roli liczą się jako obsługa, więc nikogo nie wylogowało. Bez `ADMIN_HASLO_GLOWNE` panel działa tylko na poziomie obsługi.
- Migracja `20261023191423_tylko_glowny`: `quizy.tylko_glowny` i `sesje.tylko_glowny` (domyślnie false, więc wszystko, co było, widzą wszyscy). Obsługa nie widzi takich quizów ani gier na listach, a pod ich adresem dostaje 404 (`src/lib/admin-dostep.ts`: `wymagajQuizu`, `wymagajGry`, filtr `widoczne(rola)`; sprawdzają to też wszystkie akcje quizów i gier).
- Główny: nowy quiz domyślnie „tylko dla mnie” (pole w formularzu), na stronie quizu przełącznik „Ukryj przed obsługą / Pokaż obsłudze”, w kreatorze gry „Widoczność: tylko dla mnie” (domyślnie zaznaczone; gra z ukrytego quizu zawsze ukryta) i „Pijany finał”. Obsługa nie ma w kreatorze pijanego finału, linku do jego pytań ani strony z nimi (`wymagajGlownego`), a serwer ignoruje `pijany_final` od obsługi.
- Na przyszłe konta: uprawnienia sprawdzamy funkcjami (`widziWszystko`, `mozePijanyFinal` w `src/lib/admin.ts`), nie porównując ról w stronach. Przejście na konta to podmiana źródła roli (tabela kont zamiast haseł) i znaczników `tylko_glowny` na właściciela.
- **Zegar w pijanym finale wariuje** (`zegarPijany` w `src/lib/pijany.ts`, TV i telefon liczą to samo z czasu serwera): najpierw normalnie w dół, potem w górę, potem co chwilę zmienia kierunek, a w ostatniej ćwiartce co druga sekunda znika, a w pozostałych pokazuje przypadkowe liczby. Pasek na telefonie idzie za zegarem. Nagłówek TV dostał do tego parametr `zegar` (`NaglowekSerii`).
- Gracze nie widzą już łącznej liczby pytań: „Pytanie 8” zamiast „8/31” (telefon, TV przy pytaniu, odpowiedziach i rankingu), bez „jeszcze 23 pytania” pod szklanką (TV i telefon, zostaje „Nalane!” na koniec). Pilot dalej pokazuje „8/31”.
- Pilot: przyciski od razu pod nagłówkiem, nad kartą pytania i listą graczy, więc nie uciekają w dół. „Zakończ grę” jest osobno na samym dole.
- Utrudnienia w finale bez zapowiedzi: zniknęło „· utrudnienie!” z paska na telefonie (seria i pijany finał) i „Od połowy pytań utrudnienia” z planszy finału (TV i telefon). Demo prawda/fałsz na planszy etapu to te same okrągłe przyciski co na telefonie (zielony ✓, czerwony ✗), bez kafli z napisami.
- Lampa błyskowa przy selfie: zdjęcie robi systemowy aparat (`<input type="file" capture="user">`), a jego ustawień (także błysku) strona nie dostaje. Jedyna droga to własny podgląd z kamery (`getUserMedia`, przednia kamera nie ma błysku); zapisane w `docs/POMYSLY.md`.
- Sprawdzone na localhost (`start-test-hasla` ma oba hasła testowe): stare ciasteczko działa jako obsługa, obsługa bez pijanego finału i bez strony jego pytań, quiz testowy główny „tylko dla mnie” niewidoczny dla obsługi (lista i 404), pilot z przyciskami na górze. Quiz i gra testowa usunięte w panelu.

### Po teście pijanego finału (23.10, późna noc) ✅

Uwagi Łukasza po grze na telefonie, wszystko wdrożone:
- **Koniec pijanego finału:** bez ekranu „Gotowe! Odpowiedzi: 22 z 14”. Kto pierwszy dojdzie do końca pytań, gasi wszystkim ekrany: telefon od razu pokazuje werble i woła `zakoncz_pijany(token)` (migracja `20261023193351_pijany_koniec_gracza`), baza przechodzi w `werble`. Po czasie albo przyciskiem pilota tak jak wcześniej.
- **Koniec prawdziwej serii na telefonie:** zamiast „Gotowe!” (mignął zwycięzcy i zdradzał koniec) zwykle od razu ciemny ekran werbli, a przy pijanym finale sam pasek czasu, z którego płynnie wychodzi „pytanie 15/14”.
- **Pęknięcia szybki wyłączone** (słabo wyglądały): bez SVG i stylów, samoklik zostaje. Kod jest w historii gita (commit b9a1d4a).
- **Werble a Safari:** po białym błysku na iPhonie paski przeglądarki u góry i u dołu robiły się jasne (Safari bierze ich kolor z krawędzi strony). Na telefonie błysk nie dotyka już krawędzi (`.werble:not(.duzy) .werble-blysk`). Do sprawdzenia na iPhonie.
- **„Pobierz na pamiątkę”** obok „Udostępnij wynik” na końcu gry (24.10 Łukasz zostawił sam ten przycisk, za dużo przycisków; działa jak dawne „Udostępnij”, czyli systemowe okno udostępniania, bo tylko z niego iPhone zapisuje do Zdjęć): ta sama grafika, prosto do pobrania (`pobierz` w `src/lib/grafika-wyniku.ts`; na iPhonie trafia do Plików, do Zdjęć zapisuje się przez „Udostępnij” → „Zapisz obraz”).
- **Spokojniejszy początek chaosu na TV:** awatary zaczynają cofać się od szklanki po 6 s i robią to powoli do 24 s, drogi spadają w 18. sekundzie (każda przez 3 s, jedna po drugiej), lot od 24 s (`COFANIE_S`, `SPADANIE_S`, `LOT_S` w `ekran/_ekran/pijany.tsx`). Zamiast kiwającego się tytułu kołysze się cały nagłówek, a nagłówek, szklanka i awatary stopniowo tracą ostrość (filtr na małych elementach, nie na całej planszy, żeby Samsung dawał radę).
- **„Wszystko naraz” na telefonie:** przyciski zostają obok siebie (bez pionu) i na zmianę płynnie rosną i tracą ostrość; dalej mają zamienione kolory, a pytanie drży.
- **Hasła panelu:** `ADMIN_HASLO_GLOWNE` musi być inne niż `ADMIN_HASLO` (przy takich samych każdy z tym hasłem loguje się jako główny). Łukasz najpierw ustawił to samo; poprawione tej nocy (`vercel env rm` + `env add` z nowym hasłem, potem `vercel redeploy`, bo zmienne wchodzą dopiero z wdrożeniem). Sprawdzone przez Łukasza: wspólne hasło bez pijanego finału, jego hasło z pijanym finałem. Żeby wylogować wszystkich, zmień `ADMIN_SEKRET`.

### Porządki przed testem (24.10) ✅

- Lista faz z zegarem (`przygotuj`, `pytanie`, `seria`, `pijany`) była powtórzona w TV, pilocie, telefonie i `useKoniecPytania`; teraz jest jedna funkcja `zZegarem` w `src/lib/gra/nasluch.ts`. Nowa faza z czasem trafia tylko tam.
- Usunięte martwe style: wybór rankingu na pilocie (`.pilot-widok*`, po przełączniku Tabela/Wyścig), zapowiedź finału na planszy etapu (`.tv-etap-zapowiedz`), pusty etap w panelu (`.etap-pusty`), wcześniej pęknięta szybka i duże kafle prawda/fałsz w demo.
- Sprawdzone skryptem: każdy plik w `src` jest gdzieś importowany, eksporty bez użycia poza plikiem to tylko typy i stałe używane wewnątrz, a pozostałe „nieużyte” klasy CSS są składane w kodzie (`efekt-${…}`, `utrudnienie-${…}`, `para-${…}`, `metal-${…}` itd.).
- Zaktualizowane: `docs/DESIGN-SYSTEM.md` (pijany finał, okrzyki kibiców, utrudnienia bez zapowiedzi, liczby pytań, pilot, werble a Safari, karty wyboru z `--r-card`), ta sekcja „Stan”, `CLAUDE.md`, `docs/TEST.md`.

### Wideo pękającej szklanki (24.10) ✅ wersja testowa

Pomysł Łukasza (plan w `docs/POMYSLY.md`). Działa z pierwszym klipem; Łukasz robi kolejną próbę, w której szklanka ma naprawdę pęknąć (w pierwszej tylko się przybliża i piana spływa).
- **Szklanka w pijanym finale stoi nieruchomo i ostro:** bez kołysania i rozmycia, a cała plansza już nie faluje (falowanie przesuwało szklankę). Chaos robią nagłówek i awatary.
- **Koniec dogrywki daje 7 s na wideo** (migracja `20261024062338_pijany_koniec_z_wideo`): `zakoncz_pijany` (gracz skończył pytania) i `pilot_akcja('werble')` nie dają od razu werbli, tylko ustawiają `faza_do = teraz + 7 s`; werble przychodzą przez `dokoncz_pytanie`. Gracz, który skończył, widzi werble od razu, reszta ma jeszcze te sekundy na pytania. 7 s to najdłuższy klip (`WYLEWANIE_S` w `src/lib/pijany.ts`, musi się zgadzać z bazą).
- **TV** (`ekran/_ekran/pijany.tsx`): `<video src="/wideo/pekniecie.mp4">` portalem na całą scenę 1920×1080 (`.pijany-wideo`, `mix-blend-mode: screen`, czarne tło klipu znika), wczytane od początku dogrywki i zatrzymane na pierwszej klatce. Rusza „długość klipu − 1 s” przed `faza_do` (najwyżej 7 s), żeby skończyć się razem z werblami; szklanka znika (`.tv-pijany.wylewa`) dopiero, gdy wideo naprawdę gra, więc bez pliku nic się nie zmienia. Sprawdzone lokalnie: klip 5 s rusza 4 s przed końcem, werble sekundę po nim.
- **Kadr startowy:** `docs/wideo/pekniecie-start.png` (1920×1080, czarne tło, szklanka dokładnie w miejscu z TV: x 1515–1765, y 396–863), także pod https://raw.githubusercontent.com/enowuigrek/bractwo-quiz/main/docs/wideo/pekniecie-start.png. Zrobiony ze zrzutu TV z Chrome bez okna (`--headless=new --window-size=1920,1080 --screenshot`), wycięta szklanka z blaskiem, tło wyczyszczone do czerni (PIL).
- **Klip:** Kling AI (darmowe kredyty, ok. 50 na próbę): Video Generation → Kling 4.0 → **Keyframes**, kadr jako First frame, 720p, 5 s; prompt w odpowiedzi z 24.10 (akcja w pierwszym zdaniu, „static locked camera, no zoom”). Figma Weave odpada: modele wideo tylko w płatnym planie. Pierwsza klatka klipu zgadza się z naszą (średnia różnica 2/255).
- **Obróbka nowego klipu** (ffmpeg jest z Homebrew): usunięcie znaku wodnego Klinga z prawego dolnego rogu, bez dźwięku, dane na początku pliku:
  `ffmpeg -i klip.mp4 -vf "delogo=x=1112:y=662:w=150:h=46" -an -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart public/wideo/pekniecie.mp4` (współrzędne dla 1280×720; przy innej rozdzielczości przelicz). Klip do 8 s, bez zmian w kodzie.

### Wybuch szklanki, losowe pytania, wspólny koniec (24.10) ✅

Po kolejnym teście Łukasza:
- **Nowy klip** `public/wideo/pekniecie.mp4` (Kling 4.0, Keyframes, 5 s): szklanka pęka po ok. 1 s, wybucha po ok. 1,5 s, piwo zalewa ekran, koniec prawie czarny. Obróbka jak w sekcji wyżej (`delogo`); od 24.10 z dźwiękiem wybuchu (AAC), który gra tylko przy włączonej muzyce. Pierwszy klip (tylko zbliżenie) wypadł.
- **Rozpad interfejsu przy wybuchu** (`WYBUCH_S` = 1,5 s klipu w `src/lib/pijany.ts`, przy nowym klipie sprawdzić ten moment): nagłówek wylatuje w górę i znika, awatary odlatują od szklanki poza ekran (pętla klatek w `ekran/_ekran/pijany.tsx`, 1700 px/s, bez odbijania) i kręcą się (`.tv-pijany.wybuch`).
- **Wspólny koniec:** koniec rusza, gdy ktoś dojdzie do **przedostatniego** pytania (`zakoncz_pijany`, 7 s do werbli). Kto skończy wcześniej, nie gaśnie sam: czeka z samym paskiem, a werble przychodzą wszystkim naraz (także tym, którzy nie skończyli).
- **Losowe pytania** (migracja `20261024075052_pijane_pytania_losowo`): z puli w panelu każda gra dostaje 8 wylosowanych, w kolejności z listy (chaos dalej narasta); losowanie z id gry, więc wszyscy gracze tej gry mają te same. Pytanie z `{za_barem}` bez imienia odpada przed losowaniem.
- **Mignięcie na start:** gdy TV wchodzi w pijany finał, ekran kilka razy nierówno gaśnie (`mrugniecie-tv`, 1,8 s), jak psujący się telewizor.
- **Telefon po „Pokaż podium”:** zamiast osobnej planszy „Werble… Zaraz poznasz swoje miejsce!” te same werble co wcześniej (`<Werble dalej />`: bez błysku i bez wejścia), więc do odsłony miejsca nic się nie zmienia.
- Sprawdzone lokalnie: 8 pytań z puli 10, skrócenie czasu przy przedostatnim, sam pasek po skończeniu, werble wszystkim, podium z tymi samymi werblami, wideo z wybuchem i rozpadem (zrzuty: pęknięta szklanka z awatarami, potem tylko piwo).

### Muzyka na TV (24.10) ✅ kod, utwory od Łukasza

Pomysł Łukasza: wideo wybuchu ma dźwięk, więc przez cały quiz na TV może grać muzyka (z Suno). Decyzje: muzyka jest **opcjonalna**: od 24.10 domyślnie włączona (migracja `20261024082653_muzyka_domyslnie`; bez głośników albo bez zgody przeglądarki po prostu nie gra), a prowadzący może ją wyłączyć w pilocie. Gra bez dźwięku działa jak dotąd.
- **Baza** (migracja `20261024080014_muzyka`): kolumna `sesje.muzyka` (najpierw domyślnie `false`, potem `true`), `stan_sesji` zwraca `muzyka`, `pilot_akcja('muzyka')` przełącza.
- **Pilot:** pod nagłówkiem „🔊 Muzyka na TV gra” / „🔇 Muzyka na TV wyłączona” z przyciskiem Włącz/Wyłącz.
- **TV** (`ekran/_ekran/muzyka.tsx`, `MuzykaTv`): pięć utworów w `public/muzyka/`: `poczekalnia.mp3` (poczekalnia), `pytania.mp3` (zwykłe etapy), `przed-finalem.mp3` (etap walki o finał), `final.mp3` (finał serią i pijany finał), `podium.mp3` (podium, tabela, koniec; gra raz, reszta w pętli). Werble to cisza. Przy zmianie utworu 1,5 s przenikania. Brakujący plik po prostu nie gra, więc utwory można dodawać po kolei.
- **Pijany finał:** muzyka finału rozciąga się jak taśma (`preservesPitch = false`, tempo spada do ok. 0,7 i faluje), faluje głośnością i ma coraz częstsze krótkie dziury, a urywa się w chwili wybuchu szklanki w wideo (pierwsza wersja z cofaniem o 0,35 s i stopem taśmy przed wideo wypadła po teście na Samsungu). Wtedy wideo gra **z dźwiękiem wybuchu** (`pekniecie.mp4` ma teraz ścieżkę AAC), ale tylko gdy muzyka jest włączona i przeglądarka już pozwoliła grać (`src/lib/gra/dzwiek.ts`). Potem werble w ciszy.
- **Zgoda przeglądarki:** bez gestu przeglądarka nie zagra. Gdy odmówi, na dole TV jest złota prośba „🔊 Naciśnij OK na pilocie telewizora, żeby włączyć muzykę”; pierwsze naciśnięcie klawisza albo kliknięcie odblokowuje dźwięk do końca wizyty na stronie (po przeładowaniu TV trzeba raz jeszcze).
- **Utwory (24.10):** `poczekalnia`, `pytania` (nu-jazz/downtempo, bez instrumentów biesiadnych), `przed-finalem`, `final` (szybki i mroczny) z Suno. Obróbka ffmpeg: przycięte przed wyciszeniem na końcu (poczekalnia 211 s, pytania 185,5 s, przed finałem 73 s, finał 0,42–98,5 s), 30 ms wejścia i wyjścia bez trzasku, `loudnorm` do −16 LUFS, MP3 160 kb/s 44,1 kHz. Brakuje `podium.mp3`.
- **Poprawka po pierwszym teście (24.10):** w Safari muzyka nie ruszała, a w trakcie gry urywała się. Przyczyny: Safari uznaje za zgodę tylko kliknięcie albo klawisz (nie `pointerdown`) i pozwala grać tylko elementom, które raz zagrały w czasie gestu, a każdy utwór był nowym elementem. Do tego TV przeładowywał się po wdrożeniu i znów czekał na zgodę. Teraz są dwa stałe odtwarzacze na zmianę (oba odblokowuje jeden gest), pętla to 2,5 s przenikania na drugi odtwarzacz od `petlaOd` (za cichym wstępem), pliki są przycięte przed wyciszeniem z Suno, a przy grającej muzyce TV przeładowuje się po nowym wdrożeniu dopiero w fazie `koniec`.
- **Druga poprawka (24.10, Safari i Samsung nadal cicho, bez prośby):** prośba o OK nie czeka już na jawną odmowę z `play()` (Safari potrafi nie zagrać bez błędu), tylko pojawia się po 2 s ciszy, gdy muzyka ma grać (zdarzenie `playing` aktywnego odtwarzacza; własny minutnik, bo `teraz` poza pytaniami nie tyka). Gest wznawia aktywny odtwarzacz zawsze, gdy nie gra. Przenikanie kończy się po 1,5 s nawet wtedy, gdy przeglądarka nie zmienia głośności (iPhone: `volume` tylko do odczytu), żeby stary utwór nie grał razem z nowym. Ekranów może być kilka naraz (np. telefon z głośnikiem obok TV), każdy gra sam.
- **Po teście pijanego finału (24.10):** na Samsungu muzyka ucichła w pijanym finale (najpewniej przez zacięcia robione przewijaniem `currentTime`), a prośba o OK wyskoczyła w trakcie gry (przy podium, bo nie ma `podium.mp3`; brak pliku liczył się jak blokada). Teraz: zacięcia to krótkie dziury w głośności (bez przewijania), do tego falowanie głośności i zwalnianie tempa; muzyka **urywa się w chwili wybuchu szklanki** (`ogloszWybuch`/`naWybuch` w `src/lib/gra/dzwiek.ts`, wywoływane tam, gdzie zaczyna się rozpad interfejsu), a przy wejściu w werble staje od razu, bez przenikania. Prośba o OK tylko w poczekalni, w trakcie quizu żadnych napisów. Brak pliku to cisza bez prośby. Pasy na wybuchu: drogi finału (`drogi-finalu-pas`, na Samsungu nie spadały) prześwitywały przez czerń klipu (`mix-blend-mode: screen`); gdy wideo gra, drogi i smugi tła są schowane.
- Sprawdzone lokalnie z tonami testowymi: utwór według fazy, przenikanie, zwalnianie i zacięcia w pijanym finale, stop przed wideo, przełącznik w pilocie. Na Samsungu nie sprawdzone (czy `preservesPitch` działa i czy OK na pilocie odblokowuje dźwięk).

### Drobne po teście muzyki (24.10) ✅

- Koniec gry na telefonie: jeden przycisk „Pobierz grafikę na pamiątkę” na całą szerokość. Otwiera systemowe udostępnianie (na iPhonie tylko stamtąd „Zapisz obraz” trafia do Zdjęć), na komputerze pobiera plik. Osobne „Udostępnij wynik” zniknęło.
- Nagłówek telefonu bez kodu gry.
- Przegląd dubli (jak dawne podwójne werble): odliczanie serii na telefonie nie powtarza już zasad z planszy etapu (samo „Seria startuje!”), kibic przed startem nie wymienia znowu finalistów („Za chwilę start. Wtedy możesz kibicować!”), a na planszy finału serią kibic czyta, że będzie dopingował (wcześniej nieaktualne „Pytania i tak zobaczysz tutaj”). Zostawione świadomie: miejsce i punkty na ekranie wyniku i zaraz potem w rankingu (prowadzący może pominąć ranking).

### Dłuższy pijany finał, ocena w finale, uczciwy wyścig (24.10) ✅

Po teście Łukasza: pijany finał dało się szybko przeklikać i czekać na wybuch. Ustalenia i zmiany:
- **Wyścig w zwykłych etapach** (migracja `20261024134413_wyscig_max_punktow`): położenie tylko z własnych punktów w stałej skali (`naTrasie` w `src/lib/gra/wyscig.ts`: 75% maksimum przed finałem, które podaje `stan_sesji` jako `quiz.max_przed_finalem`). Zła odpowiedź = stoi w miejscu, szybka dobra = większy krok, nikt się nie cofa; bardzo dobry gracz staje przy szklance tuż przed finałem. Finał pytaniami (nie serią) ma swój wyścig jak dotąd (`naTrasieFinalu`).
- **Ocena w finale serią** (migracja `20261024134525_seria_zwraca_poprawna`: `zapisz_odpowiedz_serii` zwraca `poprawna`; TV i tak pokazuje to od razu krokiem na drodze): na telefonie błysk na zielono albo czerwono, przycisk pulsuje albo się trzęsie, przyciski stoją. 0,4 s, od połowy (utrudnienia) coraz dłużej, do 1 s na ostatnim (`czasOceny` w `[kod]/seria.tsx`). Każdy finalista ma przy tym samym pytaniu to samo, więc wyścig jest uczciwy. Na TV awatar podskakuje z zieloną poświatą albo trzęsie się z czerwoną (`ocena` w `drogi.tsx`, liczona w `ekran/_ekran/seria.tsx` z różnicy `odpowiedzi`/`dobre`).
- **Pijany finał od nowa** (migracja `20261024134843_pijany_staly_czas_komentarze`):
  - stały czas 60 s (było: do 90 s albo do pierwszego gracza na przedostatnim pytaniu; `zakoncz_pijany` zostaje w bazie nieużywana);
  - każda gra dostaje całą pulę pytań w kolejności z listy z losowym przesunięciem 0..4 (z id gry); gdy ktoś przejdzie wszystkie, lecą od nowa;
  - po każdej odpowiedzi reakcja coraz dłuższa (1 s → 3,5 s, `czasReakcjiPijanej`): błysk w losowym kolorze, puls albo drżenie przycisku, komentarz przelatujący przez ekran (własny z `komentarz_prawda`/`komentarz_falsz` albo czasem ogólny z `KOMENTARZE_OGOLNE`); `--poziom` liczony z czasu, nie z numeru pytania;
  - koniec według zegara, wszystkim naraz (`src/lib/pijany.ts`): 5,5 s przed końcem (`GASNIECIE_S`) telefony gasną z błyskiem bez napisu i urywa się muzyka na TV, 3 s przed końcem (`WYBUCH_PRZED_S`) szklanka wybucha w wideo (klip rusza 4,5 s przed końcem), z końcem fazy werble (na telefonie bez drugiego błysku). Pilot „Zakończ i pokaż werble” daje 7 s, więc mieści tę samą sekwencję.
  - panel: przy każdym pytaniu pola „Komentarz po ✓” i „Komentarz po ✗” (do 80 znaków, wstawki jak w treści), do 40 pytań.
- **Po pierwszym teście tej wersji:** muzyka psuje się dopiero od połowy dogrywki (wcześniej gra czysto, jak dalsza seria); drżenie przy złej odpowiedzi w finale mocniejsze (±18 px z obrotem, czerwona obwódka, wyższa szczegółowość niż utrudnienia); na TV awatary cofają się od 8 s, drogi spadają w 30. s (połowa), lot od 36. s (było 6/18/24 s, ułożone pod 90 s).
- **Do zrobienia razem z Łukaszem:** nowe pytania pijanego finału z komentarzami, kolejnością i przeszkadzaczami (pola już są, ogólna pula komentarzy w `KOMENTARZE_OGOLNE` też do ustalenia), potem efekty dźwiękowe.
- Sprawdzone lokalnie: reakcja 2,3 s w połowie dogrywki z komentarzem i zablokowanymi przyciskami, gaśnięcie telefonu bez napisu, werble bez drugiego błysku. Nie sprawdzone na żywo: ocena w finale serią (telefon i TV) i cała sekwencja końca na TV z muzyką.

### Muzyka narastająca z etapami (24.10) ✅

Łukasz: poczekalnia i pytania brzmiały jak lo-fi z windy, a przejście do „przed finałem” zgrzytało. Nowy zestaw z Suno (prompty bez perkusji w pierwszych etapach, styl noir):
- `poczekalnia.mp3` (mroczne, spokojne oczekiwanie), `etap-1.mp3` (noir lekko: wyciszona trąbka, kontrabas pizzicato), `etap-2.mp3` (noir z napięciem), `etap-3.mp3` (dawny „przed finałem”, elegancki), `final.mp3` (bez zmian), `podium.mp3` (mroczne zwycięstwo, gra raz).
- Przypisanie (`utworFazy` w `ekran/_ekran/muzyka.tsx`): etap 1 → etap-1, etap 2 → etap-2, etap 3 i dalej oraz walka o finał → etap-3 (ten sam utwór gra dalej bez przerwy), finał i pijany finał → final, quiz bez etapów → etap-1. `pytania.mp3` i `przed-finalem.mp3` wypadły.
- Obróbka jak wcześniej (przycięte przed wyciszeniem z Suno, −16 LUFS, MP3 160 kb/s); `petlaOd` za cichym wstępem: poczekalnia 2,5 s, etap-2 i etap-3 4 s.
- Sprawdzone lokalnie: poczekalnia, etap 1, 2, 3, walka o finał (etap-3 gra dalej, bez restartu), koniec (podium).

### Poprawki: muzyka 4. etapu, pary w obie strony, TV po wybuchu (24.10) ✅

- Muzyka: dawny „przed finałem” wraca do etapu walki o finał (`etap-4.mp3`, smyczki i trąbki, napięcie przed finałem). 3. etap i dalsze zwykłe dostaną nowy utwór noir z lekkim napięciem (`etap-3.mp3`); wgrany tego samego dnia. Pliki nazwane po kolei jak u Łukasza: walka o finał to `etap-4.mp3` (dawny `przed-finalem.mp3`).
- Pary: łączyć można od dowolnej kolumny (prawy, potem lewy też działa); podpowiedź pod pytaniem i na planszy etapu mówi o jednej i drugiej kolumnie.
- TV po wybuchu szklanki: werble bez błysku (ekran jest już ciemny po wideo), sam napis wchodzi na czerni. Błysk gaśnięcia zostaje tylko na telefonach.
- Komentarze pijanego finału prostsze: kremowy napis na środku, wyskakuje i znika (bez przelotu z boku i obrotów). Treści ustalimy przy układaniu pytań.
- Quiz „Piwo - quiz testowy”: etap 2 „Kilka dobrych” ma 8 pytań zamiast 2 (migracja `20261024151457_piwo_dluzszy_etap_2`, wybrane z Łukaszem: style z Belgii, kwaśne style, fermentacja spontaniczna, miasta, które dały nazwę stylowi, polskie tradycje, słowa oznaczające mocniejszą wersję). Etap 4 „Połącz i ułóż” ma 6 pytań zamiast 2 (migracja `20261024160025_piwo_dluzszy_etap_4`: wydarzenia od najstarszego, styl ↔ wyróżnik, od najjaśniejszego do najciemniejszego, chmiel ↔ kraj; powtórki z innymi etapami celowe, „umysł szuka daty”). Teraz: rozgrzewka 1–10, kilka dobrych 11–18, strzał liczbowy 19–21, połącz i ułóż 22–27, finał 28–41.
- Dalej (z Łukaszem): pytania pijanego finału z komentarzami, potem efekty dźwiękowe.

### Piwny quiz Bractwa, przełączniki, muzyka przy zapowiedzi (24.10) ✅

- **Quiz** (migracja `20261024165957_piwny_quiz_bractwa`): „Piwo - quiz testowy” to teraz „Piwny quiz Bractwa”, przejrzany jak przez eksperta. Mniej stoutu i porteru, nowe pytania o podawanie i degustację (szkło do pszenicznego, skala IBU), strzał liczbowy 5 pytań (pinta, pierwszy Oktoberfest 1810, tripel ok. 8,5%, pierwszy pilzner 1842, Weihenstephan 1040; rok prawa czystości wypadł, bo był już dwa razy), w etapach przeplatają się dziedziny (style, historia, produkcja, surowce, Polska, podawanie), trudność rośnie w etapie, najtrudniejsze pytanie kolejności tuż przed odcięciem trójki. Finał: 7 × prawda i 7 × fałsz, krótkie zdania w drugiej połowie (przeszkadzacze). Układ: rozgrzewka 1–10, kilka dobrych 11–18, strzał liczbowy 19–23, połącz i ułóż 24–29, finał 30–43.
- **Kreator:** pijany finał domyślnie włączony (widzi go tylko główny; obsługa go nie wysyła).
- **Przełączniki** zamiast checkboxów w ustawieniach tak/nie panelu (`.przelacznik`, `.pole-wyboru` w `panel.css`; opis w DESIGN-SYSTEM). Zaznaczanie poprawnych odpowiedzi w edytorze zostaje checkboxem.
- **Muzyka przy zapowiedzi** (migracja `20261024170354_zapowiedz_z_muzyka`: `ekran_lokalu` podaje `zapowiedz.muzyka`): ekran lokalu gra muzykę poczekalni już przy godzinie i odliczaniu. Odtwarzacze są wspólne dla strony (`strona()` w `muzyka.tsx`), więc po otwarciu poczekalni utwór gra dalej bez startu od nowa i bez ponownej zgody przeglądarki. Sprawdzone lokalnie na tymczasowym lokalu „Test muzyki (usuń)” (4,3 s → 12,0 s bez przerwy).

### Odpadanie w etapach przed finałem (24.10) ✅

Ustalone z Łukaszem: przy większej grupie gracze odpadają też wcześniej, progi zależą od liczby graczy, prowadzący może je zmienić w pilocie przed startem, a odpadnięci tylko patrzą i kibicują.
- **Progi domyślne** (`wewn.progi_domyslne`, z liczby graczy, tylko w quizie z finałem trójki): do 8 graczy nikt nie odpada przed walką o finał; 9–15: po etapie przed walką o finał zostaje 6; od 16: dwa etapy przed walką o finał zostaje połowa (najmniej 8), etap później 6. Rozgrzewka nigdy nie odcina, walka o finał jak dotąd daje trójkę.
- **Baza** (migracje `20261024171522`–`20261024171742`, `odpadanie_*`): `sesje.progi` ({"nr etapu": ilu przechodzi}), `gracze.odpadl_po_etapie`; start quizu zapisuje progi (`coalesce(progi, progi_domyslne)`), plansza kolejnego etapu najpierw odcina (`wewn.odetnij`: punkty, czas, kolejność dołączenia, jak przy finalistach), finaliści tylko spośród grających, odpadnięci nie odpowiadają (`powod: odpadl`), pytanie kończy się, gdy odpowiedzą wszyscy grający. `etap_json.przechodzi`, `stan_sesji.w_grze`, `ranking.odpadl`, `moj_wynik.odpadl`, w `pilot_stan` progi i etapy. `ustaw_progi(kod, host_token, progi)` tylko w poczekalni.
- **Pilot** (`pilot/[kod]/progi.tsx`): w poczekalni karta „Odpadanie przed finałem” z − / + przy etapach od 2. do tego przed walką o finał („wszyscy” albo „zostaje N”), zapis od razu. Na planszy etapu: ile gra dalej.
- **TV:** plansza etapu z progiem mówi, ilu gra dalej i ilu odpada (walka o finał liczy już tylko grających); w wyścigu i tabeli kreska pod ostatnim, kto przechodzi („▲ 6 najlepszych gra dalej ▲”); odpadnięci znikają z wyścigu (pełna tabela i podium na końcu mają wszystkich).
- **Telefon:** w rankingu etapu z progiem „Dalej gra N najlepszych. Do N. miejsca brakuje Ci X pkt”; po odcięciu „Odpadasz po N. etapie” z miejscem, do finału, a w finale kibicuje jak reszta.
- Sprawdzone lokalnie (10 graczy): domyślny próg {3: 6}, zmiana w pilocie, kreska w wyścigu, odcięcie 4 ostatnich przy planszy 4. etapu, „3 odpada” na planszy walki o finał, ekran odpadniętego.
- **Wyjaśnianie odpadania** (migracja `20261024172737_plan_etapow`: `stan_sesji.plan_etapow`): na TV pod kropkami etapów „✂ 6” / „✂ 3” przy etapach, po których się odpada, a plansza etapu bez odcięcia mówi „Po drodze odpada się: po 3. etapie zostaje 6, do finału wchodzi 3 najlepszych”; telefon na planszy etapu to samo. Liczby z `w_grze` (tylko grający).
- **Zagrożeni i przeskok przez kreskę** (`src/lib/gra/odpadanie.ts`: `odciecieEtapu`, `wzgledemKreski`, `kolejneOdciecia`): w wyścigu i tabeli gracze pod kreską przygaszeni z czerwonym miejscem; kto przeskoczył kreskę po pytaniu, dostaje plakietkę „▲ nad kreską” (zielona) albo „▼ pod kreską” (czerwona); telefon: „▲ Wskakujesz nad kreskę!” / „▼ Spadasz pod kreskę…”. Sprawdzone lokalnie na scenariuszu (Iza z 10. na 1., Ewa pod kreskę).

### Nastroje etapów i nagłówek poczekalni (24.10) ✅

- **Nastroje TV** (`src/lib/gra/nastroj.ts`, `data-nastroj` na `.tv`, warstwy w `tlo.tsx`, style w `tv.css`): obraz idzie za muzyką. Poczekalnia ciepła jak dotąd; etapy 1–3 noir: ukośne cienie żaluzji w lewym górnym rogu, chłodniejsze smugi światła, w 2. ciemniej; etap 3: czerwony neon z prawej, czasem mrugnie; walka o finał: ciemnoczerwona winieta bijąca jak serce; podium: jaśniejsze złoto. **Finał (seria, pijany finał, werble) bez dodatków**, bo wideo wybuchu w trybie `screen` przepuszcza wszystko, co jasne pod spodem. Same warstwy z przezroczystością i przesunięciem, przejście 2 s (Samsung).
- **Nagłówek poczekalni:** logo lokalu i logo Bractwa obok siebie, tej samej wysokości (130 px), rozdzielone złotą kreską; bez powtórzonej nazwy lokalu i małego logo po drugiej stronie. Lokal bez logo: jego nazwa. Kranoprzejęcie: × i logo browaru.
- „Po drodze odpada się” pokazuje tylko odcięcia, które przy obecnej liczbie grających kogoś wyrzucą.
- **Tła nastrojów z OpenAI** (`scripts/grafiki.mjs`, `public/grafiki/tlo-*.webp`, 1920×1080, 27–100 KB): poczekalnia (przytulny bar), noir1 (żaluzje, księżyc), noir2 (dym, deszcz), neon (czerwony neon za mokrą szybą), walka (ciemna scena w czerwieni), podium (złote światła, konfetti). Na TV 55% krycia, przenikanie 2,5 s; finał bez tła. Skrypt: `gpt-image-1` przestał działać (24.10: „model does not exist”), teraz `gpt-image-2` (zmienna `MODEL_OBRAZOW`), tła w średniej jakości; poprawiony zapis pliku (brakowało `await` przy `toBuffer`). **Uwaga:** `/api/nagroda` (przeróbka zdjęć nagród) dalej ma `gpt-image-1`, do sprawdzenia.
- **Pętla muzyki bez nakładania:** ostatnie 1,2 s utwór cichnie, gra do końca pliku, 0,7 s ciszy i rusza od `petlaOd` (wcześniej 2,5 s przenikania, które na TV brzmiało jak dwa utwory naraz).
- Pytanie 17 (polskie tradycje): grodziskie wróciło jako dobra odpowiedź (migracja `20261024174740_grodziskie_w_polskich_tradycjach`), zamiast koźlaka.

### Finał bez liczby pytań, dłuższa cisza przed wybuchem, zwycięzca przy szklance (24.10) ✅

- W finale nigdzie nie ma liczby pytań: plansza finału bez „Pytań: 14”, nagłówek serii na TV „Kto pierwszy do piwa”, telefon „Pytanie 8” (bez „/14”), a pijany finał liczy dalej „Pytanie 15, 16…” (zamiast 15/14). Liczba pytań zostaje na planszach zwykłych etapów.
- Pijany finał: telefony gasną i muzyka cichnie 7,5 s przed końcem (`GASNIECIE_S`), wybuch dalej 3 s przed końcem, więc 4,5 s ciszy zamiast 2,5 s; pilot daje 9 s (`WYLEWANIE_S`, migracja `20261024180529_pijany_dluzsza_cisza_i_seria_w_pijanym`).
- Zwycięzca serii widać przy szklance, zanim zacznie się chaos: `stan_sesji` wydaje stan serii także w fazie `pijany` (wcześniej TV pokazywał miejsca bez ostatniego kroku zwycięzcy).

### Grafiki w pytaniach, koniec etapu, logo lokalu na telefonie (24.10) ✅

- **Pytania z grafiką** (migracja `20261024181426_piwny_quiz_grafiki_rozgrzewki`, pliki `public/grafiki/pytania/`, generowane `scripts/grafiki.mjs`): rozgrzewka 2 „To dzięki temu piwo jest gorzkie. Co to?” (chmiel, odsłaniana grafika), 4 „Jaki to styl?” (kriek), 6 „Jak nazywa się to szkło?” (weizenglas). Grafiki do ciekawostek już są (`grodzisk.webp`, `opactwo.webp`). `grafika_url` to ścieżka w `/public`, nie bucket.
- **Koniec etapu** (migracja `20261024181531_ostatnie_w_etapie`: `stan_sesji.ostatnie_w_etapie`): na rankingu po ostatnim pytaniu etapu TV pisze „Koniec etapu 2: Kilka dobrych”, telefon „Koniec etapu 2”, a muzyka gaśnie przez 4 s, więc następny etap wchodzi ze swoją od nowa.
- **Pętla muzyki:** 2 s ciszy i 3,5 s wejścia (było 0,7 s i 1,5 s, wciąż za szybko).
- **Telefon:** nagłówek z logo Bractwa z lewej, „Quiz” na środku i logo lokalu z prawej.
- Pytanie 18: „Doppel” bez nawiasu (migracja `20261024181638_pytanie_18_doppel`).

### Ciekawostki i plansza wstępu (24.10) ✅

- **Ciekawostka** (migracja `20261024181941_ciekawostka`): nowy typ zadania `ciekawostka` (tytuł w `tresc`, tekst w `dane.tekst`, grafika jak w pytaniu). Pilot przechodzi od razu do fazy `wynik` (bez odliczania, zegara i odpowiedzi), TV pokazuje dużą grafikę z tytułem i tekstem, telefon to samo mniejsze, pilot ma jeden przycisk dalej („Pokaż ciekawostkę” przed nią). Nie liczy się do `lp`, liczby pytań quizu i etapu ani do maksimum punktów wyścigu. W edytorze rodzaj „Ciekawostka” z polem tekstu (do 400 znaków). Nie wstawiać do etapu serii (finału).
- **Ciekawostki w Piwnym quizie** (migracja `20261024182056_piwny_quiz_ciekawostki`): „Polski szampan” (grodziskie, przed pytaniem o grodziskie) i „Piwo zza klasztornych murów” (trapiści, na początku walki o finał), grafiki z OpenAI.
- **Plansza wstępu** (migracja `20261024182239_faza_wstep`, nowa faza `wstep` w `sesje_faza_check`): w quizie z etapami start z poczekalni najpierw pokazuje „Wyścig po piwo”: etapy w rzędzie do szklanki, pod etapami, po których się odpada, ilu zostaje, i zdanie o nalewanej szklance; prowadzący opowiada (podpowiedź w pilocie) i przechodzi do planszy 1. etapu. Start ustala tu progi odpadania. Muzyka i tło jak w poczekalni; telefon „Zaraz zaczynamy! Patrz na telewizor”.

### Finał jako wyścig z przewagą (24.10) ✅

Ustalone z Łukaszem: prawdziwy finał ma być dłuższy niż pijany (60 s), a wygrywa ten, kto pierwszy dobiegnie do piwa, z przewagą za punkty z etapów.
- **Zasady** (`src/lib/gra/final.ts`, baza: migracje `20261024182745`–`20261024183117`, `final_wyscig_*`, `piwny_quiz_pula_finalu`): szklanka jest 12 kroków od startu (`wewn.meta_finalu`), dobra odpowiedź to krok, zła nic. Na planszy finału `wewn.ustaw_start_finalu` daje finalistom przewagę 0–3 kroków (`gracze.start_finalu`: lider 3, ostatni z trójki 0, środkowy w proporcji punktów). Seria kończy się, gdy ktoś dojdzie do mety (`wewn.zamknij_serie_jesli_gotowe`), albo po czasie. Pytania serii w losowej kolejności, wspólnej dla gry (`seria_pytania`: md5 z id pytania i gry).
- **Podium** (`wewn.ranking`): po finale serią finaliści według wyścigu: kto dobiegł (wcześniej wyżej), potem kto bliżej, potem punkty; reszta według punktów. Punkty zostają w tabeli.
- **Piwny quiz:** pula 30 prawda/fałsz (16 nowych), 180 s; szablon „Klasyczny pub quiz” też 180 s i nowy opis finału.
- **TV:** położenie = (przewaga + dobre) / 12, więc przewagę widać od startu; drżenie pijanego finału od połowy drogi lidera. **Telefon:** utrudnienia i dłuższe oceny od połowy własnej drogi (kroki z przewagą). **Pilot:** „Zbyszko: 5/12 kroków (przewaga 3)”.
- **Wideo wybuchu:** w ostatnich 0,7 s klipu obraz zjeżdża w dół (`.pijany-wideo.splywa`), jakby piana spłynęła z ekranu.
- Sprawdzone na grze testowej (5 graczy): przewagi 3/2/0, pozycje na TV, koniec serii po 12. kroku, ranking ze zwycięzcą wyścigu na 1. miejscu (mimo przewagi innych), werble.

### Quiz „Muzyka ponadczasowa” (24.10) ✅

Na test z Basią i Łukaszem, żeby nie odpowiadali o piwie (migracja `20261024190636_quiz_muzyka_ponadczasowa`). Etapy skopiowane jeden do jednego z Piwnego quizu (nazwy, opisy, czasy, odpadanie, finał jako wyścig 180 s), treść przez historię muzyki od baroku po hip-hop, trudność rośnie w każdym etapie.
- Rozgrzewka 10 pytań i ciekawostka „Serce wróciło do Warszawy” (Chopin), trzy pytania z grafiką (saksofon, kaseta, organy z odsłanianiem). „Kilka dobrych”: 8 pytań z 1, 2, 3 albo 4 dobrymi. Strzał liczbowy: 5 pytań, poprawna nigdy w środku suwaka. Walka o finał: ciekawostka „Woodstock 1969” i 6 zadań na zmianę kolejność i pary. Finał: pula 30 prawda/fałsz (15 + 15).
- Grafiki z OpenAI (`scripts/grafiki.mjs`, `public/grafiki/pytania/{saksofon,kaseta,organy,chopin,woodstock}.webp`).
- **Więcej współczesnej muzyki** (migracja `20261024193522_muzyka_wspolczesna`): R&B, hip-hop (też polski: Taco Hemingway, Quebonafide, Kękę) i pop zamiast części pytań o Beatlesów i klasykę, 20 zmienionych zadań we wszystkich etapach. Z finału zniknęły zdania, które powtarzały pytania z etapów albo ciekawostkę (Nobel Dylana, śmierć Chopina, „Bohemian Rhapsody”, reggae, „Cztery pory roku”).
- **Własny pijany finał** (prowizorka na próbę, migracja `20261024193848_pijane_pytania_quizu`, opis w POMYSLY.md): 10 pytań bez piwa, zaczyna się zdaniami o muzyce (Freddie Mercury, refreny), potem jak zwykle coraz dziwniej. Piwny quiz bez zmian.
- Wcześniej pijany finał był wspólny dla wszystkich quizów (pytania o piwie także tu). Do ułożenia przy projektowaniu pijanego finału.

### Uwagi po teście 24.10 wieczorem ✅

- **Ciekawostki po pytaniu, którego dotyczą** (migracja `20261024191331_ciekawostki_po_pytaniach`), nigdy na końcu etapu. Piwny quiz: po porterze „Piwna powódź w Londynie” (1814, browar Meux), po trapistach „Piwo zza klasztornych murów” (przeniesiona z walki o finał), po grodziskim „Polski szampan”, po fermentacji spontanicznej „Piwo z otwartego okna” (koelschip). Muzyka ponadczasowa: Chopin i Woodstock też po swoich pytaniach.
- **Więcej pytań z grafiką:** zboże (jęczmień) zamiast skrótu IPA, kufel z Oktoberfestu (ile litrów, suwak 0,25–3 l) zamiast roku pierwszego Oktoberfestu. Grafiki `powodz`, `koelschip`, `jeczmien`, `mass` w `public/grafiki/pytania/`.
- **Koniec etapu** na rankingu i wyścigu TV: duży złoty pasek „Koniec etapu N · nazwa” pod nagłówkiem (`KoniecEtapu` w `ranking.tsx`), wyścig zmniejsza tory o jego wysokość.
- **Muzyka:** pliki `etap-2.mp3` i `etap-3.mp3` zamienione miejscami.
- **Finał na telefonie:** zła odpowiedź tylko drży, bez czerwonej obwódki (na zielonym kole „Prawda” wyglądała źle).
- **Nazwy etapów jako wieczór w barze** (migracje `20261024194544_nazwy_etapow_wieczor_w_barze`, `20261024195856_nazwa_etapu_jakos_sie_ulozy`, pomysł Łukasza; 4. etap był po drodze „Poskładaj się” i „Poskłada się jakoś”): Na jedno → Jednak więcej → Ile? → Jakoś się ułoży → Jeszcze zdążę, w obu quizach, z dopasowanymi opisami 1., 2. i 4. etapu. Na planszy wstępu każda nazwa w jednej linii.
- **Ikony etapów** (migracja `20261024195230_ikony_etapow`, kolumna `etapy.ikona`, w `plan_etapow` i `etap_json`): szklanka shaker (Na jedno), deska degustacyjna (Jednak więcej), menzurka z piwem (Ile?), podstawka pocięta na puzzle (Jakoś się ułoży), klepsydra z piwem (Jeszcze zdążę). Na planszy wstępu nad numerem etapu, na planszy etapu przed nazwą. Grafiki `public/grafiki/etapy/` ze `scripts/grafiki.mjs`: gpt-image-2 nie robi przezroczystego tła, więc przedmiot stoi na magencie, którą skrypt wycina (`bezMagenty`). Etap bez ikony wygląda jak dotąd; w panelu ikony jeszcze nie da się wybrać.
- **Drobne w treści:** pytanie o jęczmień „Co to? Warzy się z tego większość piw.”, pinta ze zdjęciem szklanki, „pils” zamiast „pilzner” w 9 zadaniach, w ciekawostce o grodziskim tradycja z ok. 1301 roku i statut z 1601 roku (burmistrz próbował każdą beczkę; rok 1301 to data z tradycji, nie z dokumentu).
- **Finał: zła odpowiedź to krok w tył** (migracja `20261024200758_final_kara_za_zla_odpowiedz`): zgadywanie w prawda/fałsz daje średnio zero. Za linię startu się nie cofa (`wewn.kroki_finalu`, odbicie od zera), przewagę z etapów można stracić. Finał kończy się też, gdy któryś finalista odpowie na całą pulę; wygrywa najbliższy piwa. Opis planszy finału mówi „zła to krok w tył”. Sprawdzone SQL-em na grze testowej (odbicie od startu, utrata przewagi, koniec po puli, ranking według kroków).
- **Grafika podium w panelu:** „Pobierz grafikę podium”; na komputerze (też Safari na Macu) zawsze pobiera plik, okno udostępniania tylko na urządzeniach dotykowych.
- **Wyścig przy dużej grupie:** ranking po pytaniu to zawsze wyścig (wcześniej od 13 graczy była lista). Do 12 graczy każdy ma tor, powyżej tor ma pierwsza dziesiątka (`NA_TORACH_W_TLOKU`), a reszta stoi w pasku małych awatarów pod torami (do 26, dalsi jako „+N”), z przerywaną kreską odpadania, gdy wypada wśród nich. Sprawdzone przy 30 graczach (tor 56 px, z paskiem „Koniec etapu” też się mieści).

## Zadania dla ciebie (dzień 0)

1. ✅ **Vercel:** zespół „Bractwo Piwne” (Hobby), połączony z prywatnym GitHubem.
2. ✅ **Supabase:** organizacja „Bractwo Piwne” (Free), projekt `bractwo-quiz`, Frankfurt, ref `yyacqskrpgnfdxtcmapw`. Ustawienia bezpieczeństwa sprawdzę przez MCP.
3. ✅ **GitHub:** repo `enowuigrek/bractwo-quiz`.
4. ⬜ Zaproszenie Zbyszka do Vercela i Supabase, po MVP.
5. **MCP:** w terminalu, w katalogu nowego repo:
   ```bash
   claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=yyacqskrpgnfdxtcmapw"
   ```
   ```bash
   claude mcp add --transport http vercel https://mcp.vercel.com
   ```
   Przy pierwszym użyciu każdy poprosi o zalogowanie w przeglądarce. Logujesz się na konta Bractwa.
6. **Hostido:** sprawdź, czy masz dostęp do panelu. Jeśli nie, poproś Zbyszka o dodanie rekordu CNAME w dniu 6 (podam dokładną wartość).

## Zadania dla ciebie (dzień 6)

1. ✅ **Vercel → projekt `bractwo-quiz` → Settings → Domains → Add:** wpisz `quiz.bractwopiwne.pl` (bez przekierowania, środowisko Production). Vercel pokaże wymagany rekord. Zwykle jest to CNAME na `cname.vercel-dns.com`, a nowsze projekty dostają własną wartość w rodzaju `….vercel-dns-0xx.com`. **Wpisz dokładnie to, co pokaże Vercel.**
2. **Hostido (robi Zbyszko) → DNS dla `bractwopiwne.pl`:** dodaj rekord `CNAME`, nazwa `quiz`, wartość z punktu 1, TTL domyślny. Nie ruszaj MX ani innych rekordów. Po kilku minutach do godziny Vercel pokaże „Valid Configuration” i sam wystawi certyfikat HTTPS.
3. ✅ **Vercel → Settings → Environment Variables:** dodaj `CRON_SECRET` (losowy ciąg, np. z `openssl rand -hex 32`) dla Production, potem zrób Redeploy. Bez tego keepalive działa, ale jest otwarty.
4. **Vercel → Settings → Cron Jobs:** po deployu powinien być widoczny `/api/keepalive`. Kliknij „Run” i sprawdź w logach odpowiedź `"ok": true`.
5. **Test z telefonami** według [TEST.md](TEST.md), najlepiej już na `quiz.bractwopiwne.pl`.
6. Opcjonalnie: odśwież logowanie Vercel MCP na zespół „Bractwo Piwne” (dalej jest 403), żebym mógł sam sprawdzać domenę i logi.
