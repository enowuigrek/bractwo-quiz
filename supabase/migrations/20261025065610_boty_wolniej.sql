-- Boty odpowiadały po 1–3 s, ludzie po 5–15 s: rzadziej na wywołanie pilota (co 1,5 s), czyli średnio po ok. 10 s
-- w pytaniu i ok. 4 s na pytanie serii.
do $$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.boty_odpowiadaj(text, text)'::regprocedure);
  if position('continue when random() > 0.35' in v_def) = 0 or position('continue when random() > 0.45;' in v_def) = 0 then
    raise exception 'boty_odpowiadaj: nie znaleziono losowania';
  end if;
  v_def := replace(v_def, 'continue when random() > 0.35', 'continue when random() > 0.15');
  v_def := replace(v_def, 'continue when random() > 0.45;', 'continue when random() > 0.35;');
  v_def := replace(v_def, '-- co wywołanie ok. co trzeci bot bez odpowiedzi odpowiada', '-- co wywołanie ok. co siódmy bot bez odpowiedzi odpowiada');
  v_def := replace(v_def, 'mniej więcej co 3 s', 'mniej więcej co 4 s');
  execute v_def;
end $$;
