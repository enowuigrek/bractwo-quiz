-- Pijany finał: pilot daje 9 s na koniec (gaśnięcie telefonów 7,5 s przed końcem, dłuższa cisza przed
-- wybuchem), a stan_sesji wydaje stan serii także w fazie `pijany`, żeby TV pokazał zwycięzcę przy szklance.
do $$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.pilot_akcja'::regproc);
  if position($s$v_teraz + interval '7 seconds'$s$ in v_def) = 0 then
    raise exception 'pilot_akcja: nie znaleziono 7 s na koniec pijanego finału';
  end if;
  execute replace(replace(v_def, $s$v_teraz + interval '7 seconds'$s$, $s$v_teraz + interval '9 seconds'$s$),
                  $s$-- 7 s na wideo pękającej szklanki$s$, $s$-- 9 s: gaśnięcie telefonów, cisza i wideo pękającej szklanki$s$);

  v_def := pg_get_functiondef('public.stan_sesji'::regproc);
  if position($s$'seria', case when v_faza = 'seria' then ($s$ in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono serii';
  end if;
  execute replace(v_def, $s$'seria', case when v_faza = 'seria' then ($s$,
                  $s$'seria', case when v_faza in ('seria', 'pijany') then ($s$);
end $$;
