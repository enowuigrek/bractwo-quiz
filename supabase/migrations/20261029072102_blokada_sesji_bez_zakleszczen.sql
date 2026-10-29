-- 29.10: w grze AZKJ (28.10) pierwsza fala odpowiedzi na 1. pytanie skończyła się błędem 500 (deadlock + statement
-- timeout), a telefony czyściły wybór. Insert odpowiedzi bierze na wierszu sesji FOR KEY SHARE (klucz obcy), a potem
-- zamknij_pytanie_jesli_gotowe chciał FOR UPDATE na tym samym wierszu: dwie równoczesne odpowiedzi czekały na siebie.
-- FOR NO KEY UPDATE nie koliduje z FOR KEY SHARE, a zmiany sesji dalej idą po kolei (ten tryb koliduje sam ze sobą).
do $$
declare
  r record;
  d text;
  nowa text;
begin
  for r in
    select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where (n.nspname, p.proname) in (('wewn','zamknij_pytanie_jesli_gotowe'), ('wewn','zamknij_serie_jesli_gotowe'),
      ('public','pilot_akcja'), ('public','dolacz'), ('public','auto_krok'), ('public','dokoncz_pytanie'))
  loop
    d := pg_get_functiondef(r.oid);
    nowa := replace(replace(d,
      'public.sesje where id = p_sesja_id for update;', 'public.sesje where id = p_sesja_id for no key update;'),
      'public.sesje where id = v_s.id for update;', 'public.sesje where id = v_s.id for no key update;');
    if nowa = d then
      raise exception 'Nie znaleziono blokady w %', r.proname;
    end if;
    execute nowa;
  end loop;
end $$;
