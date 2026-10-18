# Bractwo Quiz

Aplikacja quizowa Bractwa Piwnego. Zanim zaczniesz pracę, przeczytaj:
- `docs/PLAN.md`: ustalenia, model danych, zasady bezpieczeństwa, harmonogram MVP
- `docs/DESIGN-SYSTEM.md` + `docs/tokens.css`: wygląd (rejestr „kręgowy” na TV i telefonach)
- `docs/POMYSLY.md`: rzeczy na później, poza MVP

Zasady:
- Rozmawiamy, piszemy UI i commity po polsku.
- Punkty i czas liczy serwer (funkcje w Postgresie), nigdy klient. Poprawna odpowiedź nie trafia do przeglądarki przed fazą `wynik`.
- Supabase: projekt `bractwo-quiz` (ref `yyacqskrpgnfdxtcmapw`, Frankfurt). Migracje trzymamy w repo w `supabase/migrations/`.
- Vercel: funkcje w regionie `fra1`, obok bazy.
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
