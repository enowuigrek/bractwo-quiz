# Bractwo Quiz: plan techniczny MVP

Pomysły na później są w [POMYSLY.md](POMYSLY.md), a design system w [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

## Ustalenia

| Temat | Decyzja |
|---|---|
| Gracze | indywidualnie; opcjonalny **tryb drużynowy**, w którym drużyna = jeden telefon, a nick = nazwa drużyny |
| Punkty | za poprawność + bonus za szybkość; jeśli w testach wyjdzie niesprawiedliwie, wyłączamy bonus przełącznikiem |
| Telefon gracza | pokazuje pełną treść pytania i odpowiedzi |
| Prowadzący | pilot na telefonie, obraz na TV w przeglądarce |
| Liczba graczy | maks. 30 na sesję (ustawiane w bazie, łatwo zmienić) |
| Panel admina | jedno wspólne hasło, bez kont |
| Szable | bez powiązania, wspólny jest tylko design i domena |
| Repo | `enowuigrek/bractwo-quiz`, publiczne (portfolio) |
| Konta | Vercel i Supabase na `l.nowak@bractwopiwne.pl`, kod na prywatnym GitHubie |
| Test | testowy quiz na spotkaniu Kręgu (śr. 28.10) |
| Domena | `quiz.bractwopiwne.pl` (CNAME w Hostido, MX nietknięte) |

## Stack

- **Next.js** (App Router, TypeScript) na **Vercel**
- **Supabase**: Postgres, Realtime, Storage (logo, grafiki)
- CSS na tokenach z `tokens.css` + Open Sans przez `next/font`
- `qrcode` (generowanie QR), `motion` (animacje rankingu i podium)

## Widoki

| Adres | Kto | Co robi |
|---|---|---|
| `/admin` | obsługa (hasło) | lokale, quizy, zadania, uruchamianie sesji |
| `/tv/[kod]` | telewizor | poczekalnia z QR → pytanie z odliczaniem → wynik → ranking → podium |
| `/pilot/[kod]?t=…` | prowadzący | start, następne, pokaż wynik, pokaż ranking, zakończ; podgląd „odpowiedziało 12/18” |
| `/[kod]` | gracz | nick → odpowiedź → „poprawnie / źle, +740 pkt, 4. miejsce” |

Kod sesji to krótki, czytelny ciąg (np. `PORT`), który da się też wpisać ręcznie. Link do pilota zawiera tajny token. Admin otwiera go jako QR na ekranie po uruchomieniu sesji, prowadzący go skanuje i ma pilota.

## Przebieg sesji (maszyna stanów)

```
poczekalnia → przygotuj (3 s) → pytanie (czas) → wynik → ranking → [następne zadanie | podium] → koniec
```

Stan trzymamy w jednym wierszu `sesje` (`faza`, `zadanie_nr`, `faza_od`, `faza_do`). Zmienia go wyłącznie prowadzący przez funkcję w bazie. TV i telefony subskrybują ten wiersz przez Realtime i same rysują to, co trzeba.

## Model danych

```
lokale      id, nazwa, miasto, logo_url
quizy       id, tytul, opis, utworzono
zadania     id, quiz_id, nr, typ, tresc, grafika_url, czas_s, dane jsonb
            dane dla typu 'wybor': { odpowiedzi: [..], poprawna: 2 }
sesje       id, kod, quiz_id, lokal_id, okazja, grafika_url,
            tryb ('solo'|'druzyny'), bonus_czas bool, max_graczy (30),
            faza, zadanie_nr, faza_od, faza_do, host_token, utworzono
gracze      id, sesja_id, nick, token, dolaczyl     unique(sesja_id, lower(nick))
odpowiedzi  id, gracz_id, sesja_id, zadanie_id, dane jsonb,
            czas_ms, poprawna bool, punkty, utworzono   unique(gracz_id, zadanie_id)
```

`typ` + `dane jsonb` pozwala dokładać nowe rodzaje zadań (łączenie, kolejność, liczba) bez zmian w tabelach. Każdy typ ma w kodzie swój edytor, widok TV, widok gracza i funkcję oceniającą.

Okazja („Dzień Porteru”) i grafika są przypięte do **sesji**, a nie do quizu, więc ten sam quiz może iść na różne eventy i do różnych lokali.

## Uczciwość i bezpieczeństwo

- **Nikt nie widzi poprawnej odpowiedzi przed czasem.** Tabela `zadania` jest niedostępna publicznie. Gracze i TV dostają pytanie przez funkcję, która zwraca tylko **bieżące** zadanie i **bez** pola `poprawna`, dopóki faza nie przejdzie na `wynik`.
- **Czas liczy serwer.** `zapisz_odpowiedz(token, zadanie, dane)` to funkcja w Postgresie. Bierze `now()`, odrzuca odpowiedzi po `faza_do`, sama ocenia i liczy punkty. Telefon nie ma tu nic do powiedzenia.
- **Wszyscy startują razem.** Faza `przygotuj` trwa 3 s, a `faza_od` pytania jest znane z wyprzedzeniem. Telefony przy wejściu mierzą różnicę swojego zegara względem serwera i odsłaniają pytanie w tym samym momencie, niezależnie od opóźnienia sieci.
- **Punkty:** poprawna = 500 + (bonus) 500 × (1 − czas/limit), zła = 0. Przy wyłączonym bonusie poprawna = 1000. Pytanie bez limitu czasu nie ma bonusu: poprawna = 1000.
- **Gracz** dostaje losowy token w `localStorage`. Po odświeżeniu strony wraca do gry z tym samym nickiem.
- **Pilot:** każda akcja prowadzącego wymaga `host_token`.
- **Admin:** hasło jest w zmiennej środowiskowej na Vercelu. Po zalogowaniu serwer ustawia podpisane ciasteczko `httpOnly`. Zapisy admina idą przez Server Actions kluczem serwisowym Supabase, który nigdy nie trafia do przeglądarki.
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
| 6 ✅ (część po twojej stronie) | deploy ✅, keepalive ✅, checklista testu ✅ ([TEST.md](TEST.md)); do zrobienia przez ciebie: domena `quiz.bractwopiwne.pl` w Vercelu + CNAME w Hostido, `CRON_SECRET`, test z kilkoma telefonami |
| 7 | poprawki po teście, bufor |

**Poza MVP:** wszystko z [POMYSLY.md](POMYSLY.md).

## Ustalenia z realizacji

### Dzień 1

- **Next.js 16.4** (Turbopack). `cacheComponents` wyłączone: panel i tak jest dynamiczny, a gra działa po stronie klienta na Realtime. Middleware nazywa się teraz `proxy` (`src/proxy.ts`).
- **Migracja:** `supabase/migrations/20261018160010_schemat.sql`. Funkcje pomocnicze siedzą w schemacie `wewn`, którego API nie wystawia. Przeglądarka ma dostęp tylko do funkcji: `stan_sesji`, `gracze_sesji`, `dolacz`, `zapisz_odpowiedz`, `moj_wynik`, `ranking`, `pilot_stan`, `pilot_akcja`.
- **Faza `przygotuj` nie jest zapisywana w bazie.** `pilot_akcja('nastepne')` ustawia fazę `pytanie` z `faza_od = teraz + 3 s`, a `stan_sesji` zwraca `przygotuj`, dopóki `faza_od` nie minie. Dzięki temu baza nie potrzebuje timera.
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
- **Po wdrożeniu (18.10):** domena `quiz.bractwopiwne.pl` dodana w Vercelu. Rekord CNAME w Hostido doda Zbyszek (brak dostępu do panelu). `CRON_SECRET` ustawiony. Pierwszy deploy z nim padł, bo `openssl … | pbcopy` dokleił znak nowej linii, a Vercel odrzuca sekret z białym znakiem. Pomogło `openssl rand -hex 32 | tr -d '\n' | pbcopy`. Na produkcji `/api/keepalive` bez nagłówka zwraca 401, strona działa. Vercel MCP dalej daje 403, więc logi czytamy przez CLI (patrz CLAUDE.md).
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
- **Pytanie bez limitu czasu** (pole „Bez limitu czasu” przy czasie): `zadania.czas_s = null`, a w trakcie pytania `sesje.faza_do` jest puste. Pytanie kończy się, gdy odpowiedzą wszyscy (baza ustawia wtedy `faza_do`, tak jak przy pytaniach na czas) albo gdy prowadzący kliknie „Pokaż wynik”. Pilot pyta wtedy o potwierdzenie, jeśli nie wszyscy odpowiedzieli. Bez bonusu za szybkość: poprawna odpowiedź = 1000 pkt. TV i telefon zamiast zegara i paska czasu pokazują „Bez limitu”, a po ostatniej odpowiedzi „Wszyscy odpowiedzieli”. Migracja `20261022141218_bez_limitu_czasu`, sprawdzona SQL-em w wycofanej transakcji.
- **Okno potwierdzenia zamiast `window.confirm`:** `src/components/okno.tsx`. W panelu `PrzyciskPotwierdz`, na pilocie `usePotwierdzenie()`. W aplikacji nie zostało już żadne okno przeglądarki.
- Sprawdzone na localhost (1280 px): lista quizów z dymkiem, nowy quiz, edycja nagłówka, pytanie z powtórzeniem i bez limitu, okno przy usuwaniu (Esc anuluje), „Zapisz quiz” wraca do listy, usunięcie quizu z listy. **Nie sprawdzone na żywo:** pytanie bez limitu na TV, telefonie i pilocie w prawdziwej grze (scenariusz w `docs/TEST.md`, punkt 12).

### Wybór miasta i lokalu (ustalone po dniu 1)

- Uruchamianie gry w panelu idzie krokami: **miasto → lokal → quiz** (+ okazja, tryb, bonus). Lista miast to unikalne wartości `lokale.miasto`, bez osobnej tabeli. Jeśli kiedyś miasta będą potrzebowały własnych danych, wydzielimy je wtedy.
- Na start są dane dla jednego miasta, Częstochowy, z lokalami **Piwiarnia w Alejach** i **PPR** (migracja z danymi startowymi z dnia 2).
- Logo wybranego lokalu pokazuje się na TV (poczekalnia, podium) obok logo Bractwa. `stan_sesji` już je zwraca (`lokal.logo_url`).
- Loga są w `public/loga/` (`piwiarnia-w-alejach.png`, `ppr.png`): kwadrat 800×800, przycięte do koła, z przezroczystością na zewnątrz. Oba są w oryginalnych kolorach (logo Piwiarni w Alejach nie odwracamy). Piwiarnia w Alejach ma dodany biały okrąg na zewnątrz, oddzielony czarną szczeliną, tak jak na ich Instagramie. Bez niego czarna obwódka ginęła na czarnym tle. Oryginały są w `docs/loga/`.
- Logo Bractwa jest w `public/loga/bractwo.svg`: czarne, z viewBox przyciętym do samego logo. Na ciemnym tle robimy je białym przez `filter: invert(1)`. Komponent `LogoQuiz` (`src/components/logo-quiz.tsx`) to logo + złoty napis „Quiz” i zastępuje tekst „Bractwo Quiz” w interfejsie. Tytuł karty przeglądarki zostaje tekstem.

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
2. **Hostido (robi Zbyszek) → DNS dla `bractwopiwne.pl`:** dodaj rekord `CNAME`, nazwa `quiz`, wartość z punktu 1, TTL domyślny. Nie ruszaj MX ani innych rekordów. Po kilku minutach do godziny Vercel pokaże „Valid Configuration” i sam wystawi certyfikat HTTPS.
3. ✅ **Vercel → Settings → Environment Variables:** dodaj `CRON_SECRET` (losowy ciąg, np. z `openssl rand -hex 32`) dla Production, potem zrób Redeploy. Bez tego keepalive działa, ale jest otwarty.
4. **Vercel → Settings → Cron Jobs:** po deployu powinien być widoczny `/api/keepalive`. Kliknij „Run” i sprawdź w logach odpowiedź `"ok": true`.
5. **Test z telefonami** według [TEST.md](TEST.md), najlepiej już na `quiz.bractwopiwne.pl`.
6. Opcjonalnie: odśwież logowanie Vercel MCP na zespół „Bractwo Piwne” (dalej jest 403), żebym mógł sam sprawdzać domenę i logi.
