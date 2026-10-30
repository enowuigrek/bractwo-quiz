-- Zdjęcie konta (30.10): pokazuje się w znaczku osoby na listach i w przycisku konta; bez zdjęcia inicjały.
alter table public.konta add column zdjecie_url text;

-- Quizy sprzed kont osobowych bez autora zrobił Łukasz (30.10, wszystkie quizy Bractwa).
update public.quizy set autor_konto_id = k.id
from public.konta k
where k.email = 'l.nowak@bractwopiwne.pl' and quizy.autor_konto_id is null and quizy.lokal_id is null;
