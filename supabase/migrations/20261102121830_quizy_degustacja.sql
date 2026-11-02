-- rodzaj „Degustacja” w panelu (02.11): pusta degustacja nie ma jeszcze piw, więc rodzaju nie da się poznać z zadań
-- jak pub quizu z braku etapów; zakładka listy i kreator gry biorą go z tej kolumny
alter table public.quizy add column if not exists degustacja boolean not null default false;
