-- Test pijanego finału z panelu (serwer Next, klucz serwisowy) otwiera planszę finału przez pilot_akcja.
grant execute on function public.pilot_akcja(text, text, text) to service_role;
