-- Projekt nie nadaje rolom API uprawnień do nowych tabel automatycznie.
-- Panel admina (klucz serwisowy, service_role) potrzebuje pełnego CRUD na tabelach gry.
-- anon i authenticated nadal nie mają dostępu do tabel, tylko do funkcji gry.
grant select, insert, update, delete
  on public.piwiarnie, public.quizy, public.zadania, public.sesje, public.gracze, public.odpowiedzi
  to service_role;
