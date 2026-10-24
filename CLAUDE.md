# Bractwo Quiz

Aplikacja quizowa Bractwa Piwnego. Zanim zaczniesz pracę, przeczytaj:
- `docs/PLAN.md`: najpierw sekcję „Stan na …: od czego zacząć” (co działa, mapa plików, co otwarte), potem ustalenia, model danych, zasady bezpieczeństwa i historię zmian
- `docs/DESIGN-SYSTEM.md` + `docs/tokens.css`: wygląd (rejestr „kręgowy” na TV i telefonach)
- `docs/POMYSLY.md`: rzeczy na później, poza MVP
- `docs/TEST.md`: lista przed eventem i scenariusz testu z telefonami

Zasady:
- Rozmawiamy, piszemy UI i commity po polsku.
- Punkty i czas liczy serwer (funkcje w Postgresie), nigdy klient. Poprawna odpowiedź nie trafia do przeglądarki przed fazą `wynik`.
- Supabase: projekt `bractwo-quiz` (ref `yyacqskrpgnfdxtcmapw`, Frankfurt). Migracje trzymamy w repo w `supabase/migrations/`.
- Migracje wdrażamy przez MCP (`apply_migration`), a potem zapisujemy plik w repo pod wersją z `list_migrations`, żeby historia w bazie i w repo się zgadzała.
- Zmieniając funkcję w bazie, zacznij od jej obecnej wersji (`select prosrc from pg_proc where proname = …` albo najnowszy plik migracji, w którym występuje) i zmień tylko to, co trzeba. `create or replace` nadpisuje całą funkcję.
- MCP Supabase po cichu odrzuca (`"status":"declined"`) polecenia, które uznaje za niszczące: `UPDATE`/`DELETE` bez `WHERE` w migracji i usuwanie danych przez `execute_sql`. Aplikacja nie pokazuje wtedy żadnego okna. W migracjach zawsze dawaj `WHERE` (np. `where kolumna is null`), a dane testowe usuwaj przez panel. Liczy się też tekst w napisach: przy podmianie fragmentu funkcji (`replace(pg_get_functiondef(…), stare, nowe)`) dopasowanie z `update … set` bez `WHERE` w tym samym kawałku też jest odrzucane, więc dopasowuj do linii bez `update`. Odrzuca też migrację z funkcją, która ma w środku `delete`: usuwanie rób w trasie serwera Next kluczem serwisowym (jak `/api/gracz`), a w bazie zostaw resztę logiki.
- Ten projekt Supabase nie nadaje rolom API uprawnień do nowych tabel. Nowa tabela = jawny `grant select, insert, update, delete … to service_role`; `anon` dostaje dostęp tylko przez funkcje.
- Vercel: funkcje w regionie `fra1`, obok bazy.
- Vercel MCP dostaje 403 na zespół. Zamiast niego używamy CLI: `npx vercel@54.20.1 …` (nowsze 64.x na Node 25 kończy się po cichu). Katalog jest podlinkowany (`.vercel/`, poza repo), więc działa bez flag: `list`, `logs --since 1h`, `crons ls`, `inspect <url> --logs` (logi buildu). `vercel link` dopisuje `VERCEL_OIDC_TOKEN` do `.env.local` i próbuje zmienić `.gitignore`. Zmian w `.gitignore` nie commitujemy.
- Next.js 16 różni się od starszych wersji (np. `proxy` zamiast `middleware`). Przed pisaniem kodu sprawdzaj dokumentację w `node_modules/next/dist/docs/` (patrz `AGENTS.md`).
- Zapytanie `supabase().rpc(…)` rusza dopiero po `await` albo `.then()`. Samo `void supabase().rpc(…)` nic nie wysyła.
- Projekt nie ma konfiguracji Prettiera. Jeśli formatujesz, to `npx prettier --print-width 120`, bo domyślne 80 kolumn przestawia cały plik. Część plików i tak nie jest sformatowana: formatuj tylko pliki, których wersja z HEAD przechodzi `--check`, bo inaczej Prettier przestawi niezwiązane linie.
- Nie pytamy o piwa i browary koncernów (Żywiec, Tyskie, Lech itd.), tylko o style, historię i browary rzemieślnicze.
- Panel ma dwa poziomy (od 23.10): `ADMIN_HASLO_GLOWNE` = główny (Łukasz, widzi wszystko), `ADMIN_HASLO` = obsługa (nie widzi quizów i gier `tylko_glowny` ani „Pijanego finału”). Każda nowa strona albo akcja panelu z quizem lub grą sprawdza dostęp (`wymagajQuizu`, `wymagajGry`, `widoczne(rola)` z `src/lib/admin-dostep.ts`), a uprawnienia pytamy funkcjami z `src/lib/admin.ts`, nie porównaniem ról. Lokalnie `start-test-hasla` ma oba hasła testowe. Oba hasła muszą być różne: przy takich samych każdy loguje się jako główny.
- Tryb „Pijany finał” jest ukryty przed graczami: na telefonie i TV nigdy nie piszemy „pijany finał” (telefon udaje dalszą serię z numeracją 15, 16… bez liczby wszystkich pytań, TV trzyma nagłówek finału). Nazwę trybu widzą tylko panel i pilot. Koniec pijanego finału idzie według zegara serwera (stałe 60 s, stałe w `src/lib/pijany.ts`: gaśnięcie telefonów, wybuch, werble), nie od graczy.
- Strony gry (`/[kod]`, `/tv`, `/pilot`) nasłuchują przez `useNasluch` z `src/lib/gra/nasluch.ts`: Broadcast + zapasowe odpytywanie. Nie polegaj na samym Realtime. Nowa faza z zegarem (`faza_do`) trafia do `zZegarem` w tym samym pliku, a nowa faza w ogóle także do typów (`FazaWidoczna`), `sesje_faza_check` w bazie i rozdzielaczy faz w `tv.tsx`, `gracz.tsx` i `pilot.tsx`.
- Next nie uruchomi drugiego `next dev` w tym samym katalogu. Gdy jakiś już działa, podgląd otwieraj konfiguracją `dev-dzialajacy` z `.claude/launch.json`.
- Sekrety tylko w `.env.local` (poza repo) i na Vercelu. Lista zmiennych jest w `.env.example`.
- OpenAI (`OPENAI_API_KEY`) przerabia tylko zdjęcia nagród (`/api/nagroda`: tylko zalogowany panel, limit 40 dziennie). Przeróbka selfie graczy jest wyłączona (23.10, nie działała na produkcji). Każde wywołanie kosztuje, więc nowe użycia API OpenAI zawsze z limitem i nigdy bez wyraźnej prośby użytkownika w aplikacji.
- Muzyka na TV (`ekran/_ekran/muzyka.tsx`) to pliki `public/muzyka/{poczekalnia,etap-1,etap-2,etap-3,etap-4,final,podium}.mp3` (przypisanie do etapów w `utworFazy`), domyślnie włączona (pilot ją wyłącza). Brakujący plik nie gra. Przeglądarka TV potrzebuje jednego naciśnięcia OK na pilocie TV (albo kliknięcia), zanim zagra dźwięk; Safari odblokowuje każdy element `<audio>` osobno, dlatego są dwa stałe odtwarzacze na zmianę, a nie nowy element na utwór. Pliki do testu (np. tony z ffmpeg) nie trafiają do repo. Odtwarzacze są wspólne dla całej strony (`strona()`), bo ekran lokalu wymienia komponent przy przejściu z zapowiedzi do gry; nie twórz nowych `Audio` w komponencie.
- Ekrany TV po wdrożeniu przeładowują się same (`useNowaWersja`, `/api/wersja`), ale dopiero poza pytaniem, serią i pijanym finałem. Przy teście zaraz po wdrożeniu odśwież TV ręcznie albo poczekaj minutę.
- Telewizor w lokalu to Samsung (Tizen, Samsung Internet na Chrome 120). Nie przycinaj niczego na TV przez `clip-path` (Samsung go nie stosował i szklanka była pełna), tylko blokami z `overflow: hidden`. Ruch rób przejściami CSS albo `motion`, ale bez animowania `clip-path`.
- `/api/keepalive` (Vercel Cron raz dziennie) trzyma bazę obudzoną i łączy się z Realtime, żeby istniały partycje `realtime.messages`. Nie usuwaj części z Realtime. Lista przed eventem i scenariusz testu są w `docs/TEST.md`.
- Domena `bractwopiwne.pl` jest w Hostido, a poczta w Google Workspace. Rekordów MX nie ruszamy.
- Aplikacja działa pod `https://quiz.bractwopiwne.pl`: rekord A `quiz` → `76.76.21.21` w strefie DNS na hostingu Hostido (DirectAdmin konta host367070 → Zarządzanie DNS, nie w panelu domeny), certyfikat wystawia i odnawia Vercel. Nigdzie nie wpisuj domeny na sztywno: linki i kody QR buduj z adresu bieżącego żądania (albo `NEXT_PUBLIC_SITE_URL`), żeby zmiana domeny nie wymagała zmian w kodzie.

## Testy lokalne

- Podgląd z prawdziwym buildem: `npm run build`, potem konfiguracja `start-test-hasla` z `.claude/launch.json` (`next start`, port 3100, hasło panelu w tej konfiguracji). `next start` nie widzi zmian: po każdym buildzie zatrzymaj i uruchom podgląd jeszcze raz.
- iCloud tworzy w `.next` kopie w rodzaju `routes.d 2.ts`, przez które `tsc` zgłasza zdublowane typy. Przed sprawdzaniem typów: `find .next -maxdepth 4 -name "* [0-9]*" -print0 | xargs -0 rm -rf`.
- Grę testową zakładaj bez lokalu, żeby nie przełączyć ekranu lokalu, który Łukasz może mieć otwarty: `insert into sesje (quiz_id, okazja) select id, 'Test' from quizy where tytul = '…' returning kod, host_token;`. Graczy dodawaj przez `public.dolacz(kod, nick, null)`, akcje pilota przez `public.pilot_akcja(kod, host_token, 'nastepne' | 'wynik' | 'podium' | 'koniec' …)`, odpowiedzi przez `zapisz_odpowiedz` / `zapisz_odpowiedz_serii`. Do dowolnej fazy można przeskoczyć `update sesje set faza = …, zadanie_nr = … where kod = …`.
- Telefon testowy wraca do gracza linkiem `/<kod>#powrot=<token>` (po zmianie samego hasha przeładuj stronę). Na koniec zakończ grę i usuń ją w panelu (Gry → gra → Usuń grę), bo MCP nie usuwa danych.
- Nie ruszaj gier, które Łukasz akurat prowadzi: przed testem sprawdź `select kod, faza, lokal_id from sesje where faza <> 'koniec'`.
- Zrzut TV w panelu przeglądarki: widok 1920×1080, a obraz bierz `zoom`-em (pierwszy zwykły zrzut bywa czarny albo pomniejszony).
- Gdy panel przeglądarki jest ukryty, strona działa jak karta w tle: minutniki i klatki animacji mocno zwalniają. Ruch i czasy (np. samoklik, lot awatarów) mierz przy widocznym panelu albo sprawdzaj stanem w bazie, a nie czekaniem w skrypcie.
- Jakie urządzenie ma użytkownik (np. przeglądarka TV), widać w logach Supabase: `query_logs` na `edge_logs` z `log_attributes['request.headers.user_agent']`.

## Koniec etapu

Pracujemy etapami według harmonogramu w `docs/PLAN.md` (dzień 1, dzień 2…). Gdy kończysz etap, zanim napiszesz podsumowanie:
1. Zaktualizuj `docs/PLAN.md`: odhacz zrobione rzeczy w harmonogramie (✅), dopisz nowe ustalenia i zmiany planu, a to, co przechodzi na później, przenieś do `docs/POMYSLY.md`.
2. Jeśli zmieniły się zasady pracy, uzupełnij ten plik.
3. Sprawdź, że projekt się buduje (`npm run build`) i nie ma błędów lintera.
4. Zrób commit (po polsku) i `git push`.
5. Napisz mi krótko:
   - **Etap X zakończony**
   - co działa i jak to sprawdzić
   - co zostało niezrobione albo niepewne
   - **Następny etap:** co dokładnie, w 1–2 zdaniach
   - **Gotowe zdanie startowe**, które wkleję do nowej sesji

Nie zaczynaj kolejnego etapu sam. Po podsumowaniu czekasz, a ja otwieram nową sesję.
