-- Dwa poziomy dostępu do panelu: „główny” (Łukasz, osobne hasło) i „obsługa” (wspólne hasło).
-- Quiz albo gra z `tylko_glowny` są niewidoczne dla obsługi. Domyślnie false, więc istniejące rzeczy widzą wszyscy.
alter table public.quizy add column tylko_glowny boolean not null default false;
alter table public.sesje add column tylko_glowny boolean not null default false;
