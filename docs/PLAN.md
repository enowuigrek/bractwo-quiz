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
poczekalnia → przygotuj (3 s) → pytanie (czas) → wynik → [odpowiedzi] → [ranking] → [następne zadanie | podium ⇄ tabela] → koniec
```

`odpowiedzi` i `ranking` prowadzący może pominąć. Po ostatnim pytaniu obok podium jest `tabela`: pełna lista graczy z punktami.

`pytanie → wynik` dzieje się samo: gdy odpowiedzą wszyscy (w `zapisz_odpowiedz`) albo gdy minie czas (`dokoncz_pytanie`, które wołają TV, pilot i telefony; baza sama sprawdza zegar). Ręcznie prowadzący kończy tylko pytanie bez limitu albo wcześniej.

Stan trzymamy w jednym wierszu `sesje` (`faza`, `zadanie_nr`, `faza_od`, `faza_do`). Zmieniają go tylko funkcje w bazie (akcje prowadzącego i automatyczny wynik). TV i telefony subskrybują ten wiersz przez Realtime i same rysują to, co trzeba.

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

**Po pytaniu:** wynik (poprawna na zielono, słupki, najszybszy), potem **odpowiedzi graczy**. W nagłówku treść pytania. Zielona ramka „Dobrze” z graczami od najszybszego (numer, nick, odpowiedź, czas), pod nią czerwona ramka „Źle” (nick, odpowiedź, czas), a na dole szara linia „Bez odpowiedzi”. Przy wielu graczach wiersze idą w 2–3 kolumnach, od góry do dołu, a od 17 graczy w gęstszym układzie. Potem ranking całej gry.

**Po grze:** podium albo **tabela wyników** (wszyscy gracze: miejsce, nick, punkty, w 1–3 kolumnach, lider w złotej ramce). Pilot przełącza między nimi w obie strony.

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
- **Favicon:** logo Bractwa z bractwopiwne.pl (`src/app/icon.png`, `apple-icon.png`) zamiast ikony Next.js.

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
