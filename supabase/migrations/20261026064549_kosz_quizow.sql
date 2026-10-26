-- Kosz na quizy (26.10, po przypadkowym usunięciu Piwnego quizu): „Usuń” w panelu tylko odkłada quiz do kosza
-- (`usunieto`), skąd da się go przywrócić; na dobre kasuje się dopiero z kosza. Quiz w koszu nie pokazuje się na
-- liście ani przy uruchamianiu gry.
alter table public.quizy add column if not exists usunieto timestamptz;
