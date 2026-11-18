-- Domyślny limit graczy jak MAX_GRACZY w aplikacji (70, 18.11); kreator i tak podaje go jawnie, a to łapie gry
-- zakładane zapytaniem albo „Testem na ekranie”.
alter table public.sesje alter column max_graczy set default 70;
