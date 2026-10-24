-- Muzyka na TV domyślnie włączona: bez głośników albo bez zgody przeglądarki po prostu nie gra.
-- Pilot nadal może ją wyłączyć.
alter table public.sesje alter column muzyka set default true;
update public.sesje set muzyka = true where faza <> 'koniec' and muzyka = false;
