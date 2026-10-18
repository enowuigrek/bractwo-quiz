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
- `qrcode` (generowanie QR), `motion` (animacje rankingu)

## Widoki

| Adres | Kto | Co robi |
|---|---|---|
| `/admin` | obsługa (hasło) | piwiarnie, quizy, zadania, uruchamianie sesji |
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
piwiarnie   id, nazwa, miasto, logo_url
quizy       id, tytul, opis, utworzono
zadania     id, quiz_id, nr, typ, tresc, grafika_url, czas_s, dane jsonb
            dane dla typu 'wybor': { odpowiedzi: [..], poprawna: 2 }
sesje       id, kod, quiz_id, piwiarnia_id, okazja, grafika_url,
            tryb ('solo'|'druzyny'), bonus_czas bool, max_graczy (30),
            faza, zadanie_nr, faza_od, faza_do, host_token, utworzono
gracze      id, sesja_id, nick, token, dolaczyl     unique(sesja_id, lower(nick))
odpowiedzi  id, gracz_id, sesja_id, zadanie_id, dane jsonb,
            czas_ms, poprawna bool, punkty, utworzono   unique(gracz_id, zadanie_id)
```

`typ` + `dane jsonb` pozwala dokładać nowe rodzaje zadań (łączenie, kolejność, liczba) bez zmian w tabelach. Każdy typ ma w kodzie swój edytor, widok TV, widok gracza i funkcję oceniającą.

Okazja („Dzień Porteru”) i grafika są przypięte do **sesji**, a nie do quizu, więc ten sam quiz może iść na różne eventy i do różnych piwiarni.

## Uczciwość i bezpieczeństwo

- **Nikt nie widzi poprawnej odpowiedzi przed czasem.** Tabela `zadania` jest niedostępna publicznie. Gracze i TV dostają pytanie przez funkcję, która zwraca tylko **bieżące** zadanie i **bez** pola `poprawna`, dopóki faza nie przejdzie na `wynik`.
- **Czas liczy serwer.** `zapisz_odpowiedz(token, zadanie, dane)` to funkcja w Postgresie. Bierze `now()`, odrzuca odpowiedzi po `faza_do`, sama ocenia i liczy punkty. Telefon nie ma tu nic do powiedzenia.
- **Wszyscy startują razem.** Faza `przygotuj` trwa 3 s, a `faza_od` pytania jest znane z wyprzedzeniem. Telefony przy wejściu mierzą różnicę swojego zegara względem serwera i odsłaniają pytanie w tym samym momencie, niezależnie od opóźnienia sieci.
- **Punkty:** poprawna = 500 + (bonus) 500 × (1 − czas/limit), zła = 0. Przy wyłączonym bonusie poprawna = 1000.
- **Gracz** dostaje losowy token w `localStorage`. Po odświeżeniu strony wraca do gry z tym samym nickiem.
- **Pilot:** każda akcja prowadzącego wymaga `host_token`.
- **Admin:** hasło jest w zmiennej środowiskowej na Vercelu. Po zalogowaniu serwer ustawia podpisane ciasteczko `httpOnly`. Zapisy admina idą przez Server Actions kluczem serwisowym Supabase, który nigdy nie trafia do przeglądarki.
- **RLS** (zasady dostępu w Postgresie) włączone na wszystkich tabelach. Publicznie czytelne są tylko widoki, bez tokenów i poprawnych odpowiedzi.

## Supabase: żeby projekt nie zasypiał

Darmowy projekt usypia po 7 dniach bez ruchu. Rozwiązaniem jest **Vercel Cron** raz dziennie, który woła `/api/keepalive`, a ten robi jedno małe zapytanie do bazy. Nie wymaga to żadnej dodatkowej usługi, a na darmowym Vercelu cron raz dziennie jest dozwolony. Dodatkowo przed eventem otwieramy panel admina, żeby wszystko było rozgrzane.

Plan Pro (25 $/mies.) ma sens dopiero przy częstych eventach albo gdy będzie potrzebna kopia zapasowa z historią.

## Ekran TV

- Projektujemy na scenę 1920×1080, skalowaną do ekranu, żeby wyglądało tak samo na każdym telewizorze.
- Duże fonty, wysoki kontrast, czarne tło z design systemu.
- Rejestr „kręgowy”: złoto, piana i blask. Logo piwiarni i Bractwa na poczekalni.
- Bez interakcji myszką. Wszystko steruje pilot, a TV tylko słucha.

## MVP: tydzień

| Dzień | Zakres |
|---|---|
| 0 (ty) | konta Bractwa: GitHub, Vercel, Supabase; podpięcie MCP |
| 1 | repo, Next.js, tokeny, schemat bazy + RLS + funkcje, logowanie admina |
| 2 | panel: piwiarnie z logo, quizy, edytor zadań typu „wybór” z grafiką, uruchamianie sesji |
| 3 | sesja na żywo: dołączanie graczy, poczekalnia na TV z QR, pilot |
| 4 | pytanie → odpowiedzi → ocena → wynik; synchronizacja czasu |
| 5 | ranking z animacją przetasowań, podium, dopieszczenie ekranu TV |
| 6 | deploy, `quiz.bractwopiwne.pl`, keepalive, test z kilkoma telefonami |
| 7 | poprawki po teście, bufor |

**Poza MVP:** wszystko z [POMYSLY.md](POMYSLY.md).

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
