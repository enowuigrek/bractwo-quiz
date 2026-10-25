-- Trasa /api/auto (klucz serwisowy) czyta stan gry jak pilot.
grant execute on function public.pilot_stan(text, text) to service_role;
