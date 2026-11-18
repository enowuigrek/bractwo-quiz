-- Seria (finał): przy każdym graczu treść pytania, nad którym teraz siedzi (18.11, prośba Zbyszka: pytania finału
-- widać na TV). Telefon bierze pierwsze pytanie bez odpowiedzi w kolejności `md5(z.id || sesja)` (`seria_pytania`),
-- więc tu ta sama kolejność. Sama treść, bez rozwiązania; przed startem serii (`faza_od`) pusto, jak w `seria_pytania`.
do $$
declare
  v_def text := pg_get_functiondef('public.stan_sesji'::regproc);
  v_stare text := '''kroki'', wewn.kroki_finalu(g.id, v_s.seria_etap),';
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono kroków serii';
  end if;
  execute replace(v_def, v_stare, v_stare || '
               ''pytanie'', case when v_faza = ''seria'' and clock_timestamp() >= v_s.faza_od then (
                 select z.tresc from public.zadania z
                  where z.etap_id = v_s.seria_etap
                    and not exists (select 1 from public.odpowiedzi o where o.gracz_id = g.id and o.zadanie_id = z.id)
                  order by md5(z.id::text || v_s.id::text) limit 1) end,');
end;
$$;
