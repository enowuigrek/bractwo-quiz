# Bractwo Quiz

Aplikacja quizowa Bractwa Piwnego. Zanim zaczniesz pracę, przeczytaj:
- `docs/PLAN.md`: ustalenia, model danych, zasady bezpieczeństwa, harmonogram MVP
- `docs/DESIGN-SYSTEM.md` + `docs/tokens.css`: wygląd (rejestr „kręgowy” na TV i telefonach)
- `docs/POMYSLY.md`: rzeczy na później, poza MVP

Zasady:
- Rozmawiamy, piszemy UI i commity po polsku.
- Punkty i czas liczy serwer (funkcje w Postgresie), nigdy klient. Poprawna odpowiedź nie trafia do przeglądarki przed fazą `wynik`.
- Supabase: projekt `bractwo-quiz` (ref `yyacqskrpgnfdxtcmapw`, Frankfurt). Migracje trzymamy w repo w `supabase/migrations/`.
- Migracje wdrażamy przez MCP (`apply_migration`), a potem zapisujemy plik w repo pod wersją z `list_migrations`, żeby historia w bazie i w repo się zgadzała.
- MCP Supabase po cichu odrzuca (`"status":"declined"`) polecenia, które uznaje za niszczące: `UPDATE`/`DELETE` bez `WHERE` w migracji i usuwanie danych przez `execute_sql`. Aplikacja nie pokazuje wtedy żadnego okna. W migracjach zawsze dawaj `WHERE` (np. `where kolumna is null`), a dane testowe usuwaj przez panel.
- Ten projekt Supabase nie nadaje rolom API uprawnień do nowych tabel. Nowa tabela = jawny `grant select, insert, update, delete … to service_role`; `anon` dostaje dostęp tylko przez funkcje.
- Vercel: funkcje w regionie `fra1`, obok bazy.
- Vercel MCP dostaje 403 na zespół. Zamiast niego używamy CLI: `npx vercel@54.20.1 …` (nowsze 64.x na Node 25 kończy się po cichu). Katalog jest podlinkowany (`.vercel/`, poza repo), więc działa bez flag: `list`, `logs --since 1h`, `crons ls`, `inspect <url> --logs` (logi buildu). `vercel link` dopisuje `VERCEL_OIDC_TOKEN` do `.env.local` i próbuje zmienić `.gitignore`. Zmian w `.gitignore` nie commitujemy.
- Next.js 16 różni się od starszych wersji (np. `proxy` zamiast `middleware`). Przed pisaniem kodu sprawdzaj dokumentację w `node_modules/next/dist/docs/` (patrz `AGENTS.md`).
- Strony gry (`/[kod]`, `/tv`, `/pilot`) nasłuchują przez `useNasluch` z `src/lib/gra/nasluch.ts`: Broadcast + zapasowe odpytywanie. Nie polegaj na samym Realtime.
- Next nie uruchomi drugiego `next dev` w tym samym katalogu. Gdy jakiś już działa, podgląd otwieraj konfiguracją `dev-dzialajacy` z `.claude/launch.json`.
- Sekrety tylko w `.env.local` (poza repo) i na Vercelu. Lista zmiennych jest w `.env.example`.
- `/api/keepalive` (Vercel Cron raz dziennie) trzyma bazę obudzoną i łączy się z Realtime, żeby istniały partycje `realtime.messages`. Nie usuwaj części z Realtime. Lista przed eventem i scenariusz testu są w `docs/TEST.md`.
- Domena `bractwopiwne.pl` jest w Hostido, a poczta w Google Workspace. Rekordów MX nie ruszamy.
- Na razie działamy pod adresem `*.vercel.app`, a `quiz.bractwopiwne.pl` podepniemy na końcu. Nigdzie nie wpisuj domeny na sztywno: linki i kody QR buduj z adresu bieżącego żądania (albo `NEXT_PUBLIC_SITE_URL`), żeby zmiana domeny nie wymagała zmian w kodzie.

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
