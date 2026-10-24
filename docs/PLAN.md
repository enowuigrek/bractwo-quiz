# Bractwo Quiz: plan techniczny MVP

Pomysły na później są w [POMYSLY.md](POMYSLY.md), a design system w [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

## Stan na 24.10 (po nocy z 23.10): od czego zacząć

Ta sekcja to skrót dla następnej sesji: co jest, gdzie leży i co jest otwarte. Historia decyzji jest niżej w „Ustaleniach z realizacji” (najnowsze na końcu: „Pijany finał”, „Kibicowanie w finale”, „Główny i obsługa…”, „Po teście pijanego finału”). Zasady pracy są w `CLAUDE.md`, wygląd w `docs/DESIGN-SYSTEM.md`, test w `docs/TEST.md`, pomysły w `docs/POMYSLY.md`.

> **Uwaga dla wcześniejszych sesji:** etapy „Pijany finał” i „Kibicowanie w finale” są skończone i wdrożone, razem ze wszystkim, co Łukasz dorzucał w trakcie (ukryty tryb, numeracja 15/14, wariujący zegar, koniec po ostatnim pytaniu, dwa poziomy panelu, pobieranie grafiki). Niczego z nich nie trzeba dokańczać.

**Produkcja:** `https://quiz.bractwopiwne.pl` (Vercel, region `fra1`, wdrożenie z `main`), baza Supabase `bractwo-quiz` (Frankfurt). Commit, który działa, pokazuje `/api/wersja`.

**Co jest:**
- **Panel** (`/admin`): dwa hasła. Główne (`ADMIN_HASLO_GLOWNE`, tylko Łukasz) widzi wszystko, wspólne (`ADMIN_HASLO`, obsługa) nie widzi quizów i gier „tylko dla mnie” ani pijanego finału. Lokale z logo i adresem ekranu, quizy z etapami (szablony quizu „Klasyczny pub quiz” i „Bez etapów”), edytor pytań sześciu typów (wybór, prawda/fałsz, wielokrotny, kolejność, pary, szacowanie) z grafiką, podpowiedziami i odsłanianą grafiką, kreator gry (miasto → lokal → quiz, okazja, czas, nagrody ze zdjęciem, widoczność, pijany finał z polem „Kto dziś stoi za barem”, kranoprzejęcie, zapowiedź), pytania pijanego finału, historia gier, odbiór nagród, grafika podium.
- **TV** (`/ekran/<adres-lokalu>` na stałe w lokalu albo `/tv/<kod>`, scena 1920×1080): plansze lokalu, zapowiedź, poczekalnia z QR, plansza etapu z demo telefonu, pytanie z odliczaniem 3 s, wynik, odpowiedzi graczy, **wyścig po piwo**, finał trójki jako **seria** (drogi do szklanki, dymki okrzyków kibiców, licznik 📣), ukryty **pijany finał** (chaos pod nagłówkiem finału), **werble**, podium, tabela, koniec. Sam się przeładowuje po wdrożeniu (poza pytaniem, serią i pijanym finałem).
- **Telefon** (`/<kod>`): nick i selfie, wszystkie typy odpowiedzi, „Pytanie 8” bez sumy, ranking ze szklanką, w finale koła ✓/✗ i utrudnienia bez zapowiedzi, kibic stuka hasła z awatarem finalisty, pijany finał udający dalszą serię (15/14…), medal, karta nagrody z pieczątką „Odebrana”, „Pobierz na pamiątkę” (od 24.10 bez „Udostępnij wynik”).
- **Pilot** (`/pilot/<kod>?t=…`): włącznik muzyki na TV pod nagłówkiem, przyciski zawsze na górze, „Zakończ grę” na dole; w pijanym finale zwycięzca, podium, odliczanie i „Zakończ i pokaż werble”.

**Przebieg gry z etapami (quiz testowy „Piwo”):** Rozgrzewka → Kilka dobrych → Strzał liczbowy → Połącz i ułóż (walka o finał: 3 najlepszych) → Finał (seria 14 pytań prawda/fałsz, 120 s, ×2, kończy się, gdy ktoś dobiegnie do piwa) → przy włączonym trybie pijany finał (stałe 60 s, nic nie liczy; na koniec telefony gasną, cisza i wybuch szklanki na TV) → werble → podium (odsłania prowadzący).

**Najważniejsze pliki:**
- Baza: `supabase/migrations/`. Funkcje gry: `pilot_akcja`, `zapisz_odpowiedz`, `zapisz_odpowiedz_serii`, `stan_sesji`, `ranking`, `dokoncz_pytanie`, `pijane_pytania`, `zakoncz_pijany`, `kibicuj`, `wewn.zakoncz_serie`, `wewn.zamknij_serie_jesli_gotowe`. `stan_sesji` i `pilot_akcja` były ostatnio zmieniane podmianą fragmentów (`20261023182659_pijany_final.sql`, `20261023191228_okrzyki_kibicow.sql`), więc całą treść bierz z bazy (`select pg_get_functiondef(…)`).
- TV: `src/app/ekran/_ekran/` (`tv.tsx` rozdziela fazy; `seria.tsx` z `NaglowekSerii`, `drogi.tsx` z `PlanszaDrog`, `pijany.tsx`, `okrzyki.tsx`, `wyscig.tsx`, `etap.tsx`, `demo.tsx`, `ranking.tsx`, `odpowiedzi.tsx`, `szacowanie.tsx`, `plansze.tsx`, `logo.tsx`, `tv.css`).
- Telefon: `src/app/[kod]/` (`gracz.tsx` rozdziela fazy; `rozgrywka.tsx`, `odpowiadanie.tsx`, `seria.tsx` z utrudnieniami, `kibic.tsx`, `pijany.tsx`, `etap.tsx`, `fanfara.tsx`, `moj-wyscig.tsx`, `udostepnij.tsx`).
- Pilot: `src/app/pilot/[kod]/pilot.tsx`. Panel: `src/app/admin/(panel)/` (pytania pijanego finału w `quizy/pijany-final/`).
- Wspólne: `src/lib/admin.ts` (hasła, role, `widziWszystko`, `mozePijanyFinal`), `src/lib/admin-dostep.ts` (`wymagajQuizu`, `wymagajGry`, `widoczne`), `src/lib/gra/` (typy, `nasluch.ts` z `useNasluch`, `zZegarem`, `useKoniecPytania`; szklanka, wyścig, hasła kibiców), `src/lib/pijany.ts` (przeszkadzacze, `zegarPijany`), `src/lib/etapy.ts` (szablony), `src/lib/grafika-wyniku.ts` (grafiki do udostępniania), `src/lib/ekran-tv.ts` (wygaszacz, OLED, przeładowanie), `src/components/` (szklanka bez clip-path, werble, hasło kibica, awatar).

**Jak testować lokalnie:** szczegóły w `CLAUDE.md` („Testy lokalne”). W skrócie: `npm run build`, podgląd `start-test-hasla` (port 3100, hasła testowe obsługi i głównego w konfiguracji), gra testowa bez lokalu założona SQL-em, gracze i akcje pilota przez funkcje w SQL, na końcu usunięcie gry w panelu.

**Otwarte i niepewne:**
- Test na żywo: spotkanie Kręgu w środę 28.10 (lista w `docs/TEST.md`).
- Nie grane na kilku prawdziwych telefonach naraz: bonus z czasu bez limitu, kibicowanie przy wielu kibicach (TV pobiera stan po każdym okrzyku), pijany finał.
- Samsung w lokalu: czy nie gaśnie (wideo czuwania 720p) i czy latające awatary pijanego finału idą płynnie.
- Białe paski Safari przy werblach: poprawione na ślepo (błysk nie dotyka krawędzi), do sprawdzenia na iPhonie.
- Muzyka na TV: są cztery utwory z Suno, brakuje `podium.mp3` (podium na razie gra w ciszy). Na Samsungu nie sprawdzona.
- Lampy błyskowej przy selfie nie da się wyłączyć ze strony (systemowy aparat); pomysł na własny podgląd z kamery jest w `docs/POMYSLY.md`.
- W bazie zostały nieużywane rzeczy dla zgodności: tabela `przerobki_ai`, kolumna `sesje.widok_rankingu`, funkcja `gracze_sesji`. Nie przeszkadzają.

**Następny krok:** test na żywo 28.10, potem poprawki po teście. Pomysły na dalej w `docs/POMYSLY.md` (np. konta zamiast dwóch haseł).

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
pijane_pytania id, nr, tresc, efekt, utworzono   (pytania pijanego finału, wspólne dla wszystkich gier)
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
- Przeciw wypaleniu OLED cała scena przesuwa się co 2 minuty o kilka pikseli (7 położeń, do 3 px), więc logo w rogu i kropki plansz nie stoją ciągle w jednym miejscu.
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
- **Do zrobienia razem z Łukaszem:** nowe pytania pijanego finału z komentarzami, kolejnością i przeszkadzaczami (pola już są, ogólna pula komentarzy w `KOMENTARZE_OGOLNE` też do ustalenia), potem efekty dźwiękowe.
- Sprawdzone lokalnie: reakcja 2,3 s w połowie dogrywki z komentarzem i zablokowanymi przyciskami, gaśnięcie telefonu bez napisu, werble bez drugiego błysku. Nie sprawdzone na żywo: ocena w finale serią (telefon i TV) i cała sekwencja końca na TV z muzyką.

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
