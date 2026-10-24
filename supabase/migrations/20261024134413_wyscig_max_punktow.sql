-- Wyścig: położenie tylko z własnych punktów w stałej skali (zła odpowiedź = stoi w miejscu).
-- stan_sesji podaje maksimum punktów do zdobycia przed finałem: 1000 × mnożnik etapu za każde pytanie.
do $$
declare
  v_def text := pg_get_functiondef('public.stan_sesji'::regproc);
  v_stare text := $s$        'liczba_etapow', (select count(*) from public.etapy where quiz_id = q.id)
      )$s$;
  v_nowe text := $s$        'liczba_etapow', (select count(*) from public.etapy where quiz_id = q.id),
        'max_przed_finalem', (
          select coalesce(sum(1000 * coalesce(e.mnoznik, 1)), 0)
            from public.zadania z left join public.etapy e on e.id = z.etap_id
           where z.quiz_id = q.id and not coalesce(e.finalowy, false)
        )
      )$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono fragmentu quiz';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;
