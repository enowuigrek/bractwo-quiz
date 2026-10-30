-- Autor-osoba dla rzeczy sprzed kont osobowych (30.10, Łukasz): Piwny quiz Bractwa Piwnego i gra AZKJ w Piwiarni
-- założył i prowadził Łukasz.
update public.quizy set autor_konto_id = k.id
from public.konta k
where k.email = 'l.nowak@bractwopiwne.pl' and quizy.tytul = 'Piwny quiz Bractwa Piwnego' and quizy.autor_konto_id is null;

update public.sesje set autor_konto_id = k.id
from public.konta k
where k.email = 'l.nowak@bractwopiwne.pl' and sesje.kod = 'AZKJ' and sesje.autor_konto_id is null;
