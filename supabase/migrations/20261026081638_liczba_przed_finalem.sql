-- Szklanka w wyścigu nalewa się według pytań przed finałem, nie wszystkich (z pulą finału była w połowie przed
-- finałem, 26.10): stan gry podaje ich liczbę (`quiz.liczba_przed_finalem`).
do $$
declare
  v_def text := pg_get_functiondef('public.stan_sesji(text)'::regprocedure);
  v_szukane text := $s$        'liczba_etapow', (select count(*) from public.etapy where quiz_id = q.id),$s$;
begin
  if position(v_szukane in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono liczby etapów';
  end if;
  execute replace(v_def, v_szukane, v_szukane || $n$
        'liczba_przed_finalem', (
          select count(*)
            from public.zadania z left join public.etapy e on e.id = z.etap_id
           where z.quiz_id = q.id and not coalesce(e.finalowy, false) and z.typ <> 'ciekawostka'
        ),$n$);
end $$;
