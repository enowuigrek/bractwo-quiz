-- Panel liczy miejsca zakończonej gry z `ranking` kluczem serwisowym (gry/wyniki.ts), a service_role nie miał prawa
-- jej wołać: błąd uprawnień i ciche sortowanie po punktach, więc tabela i grafika podium miały kolejność sprzed
-- finału zamiast wyniku wyścigu (18.11, Łukasz zauważył na grafice podium Bractwa i JOWES).
grant execute on function public.ranking(text) to service_role;
