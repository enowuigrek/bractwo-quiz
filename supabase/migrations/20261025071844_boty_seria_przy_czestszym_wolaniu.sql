-- Pilot woła boty co 0,7 s zamiast 1,5 s, więc w serii finału mniejsza szansa na wywołanie (20%), żeby bot nadal
-- odpowiadał co ok. 3,5 s.
do $$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.boty_odpowiadaj(text, text)'::regprocedure);
  if position('continue when random() > 0.45;' in v_def) = 0 then
    raise exception 'boty_odpowiadaj: nie znaleziono losowania serii';
  end if;
  v_def := replace(v_def, 'continue when random() > 0.45;', 'continue when random() > 0.2;');
  v_def := replace(v_def, 'mniej więcej co 3 s', 'mniej więcej co 3,5 s');
  execute v_def;
end $$;
