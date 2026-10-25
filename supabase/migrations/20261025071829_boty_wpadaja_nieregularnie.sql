-- Licznik „Odpowiedziało” ma rosnąć na oczach (25.10, Łukasz): przy każdym wywołaniu pilota (co 0,7 s) odpowiada
-- ok. 40% botów bez odpowiedzi, więc wpadają nieregularnie w pierwszych 2–4 s; zapisany czas dalej udawany (2–12 s).
do $$
declare
  v_def text;
  v_stare text := $s$        continue when exists (select 1 from public.odpowiedzi o where o.gracz_id = v_b.id and o.zadanie_id = v_z.id);$s$;
begin
  v_def := pg_get_functiondef('public.boty_odpowiadaj(text, text)'::regprocedure);
  if position(v_stare in v_def) = 0 then
    raise exception 'boty_odpowiadaj: nie znaleziono odpowiadania w pytaniu';
  end if;
  v_def := replace(v_def, v_stare, $s$        continue when random() > 0.4
          or exists (select 1 from public.odpowiedzi o where o.gracz_id = v_b.id and o.zadanie_id = v_z.id);$s$);
  v_def := replace(v_def, '-- wszystkie boty od razu, a czas odpowiedzi udawany (niżej), żeby nie czekać na nie przy testach',
                   '-- boty wpadają w pierwszych sekundach, a czas odpowiedzi udawany (niżej), żeby nie czekać na nie przy testach');
  execute v_def;
end $$;
