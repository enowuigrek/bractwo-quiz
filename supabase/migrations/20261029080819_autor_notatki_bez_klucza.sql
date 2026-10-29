-- drugi klucz obcy sesje → lokale robił złączenia `lokale(...)` w PostgREST niejednoznacznymi; autor notatki zostaje
-- zwykłą kolumną (lokal szukamy osobnym zapytaniem)
alter table public.sesje drop constraint sesje_notatka_lokal_id_fkey;
