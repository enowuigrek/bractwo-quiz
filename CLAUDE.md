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
