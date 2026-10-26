-- Po „Zakończ grę” ekran lokalu od razu wraca do logo lokalu (26.10, Łukasz), a nie po 10 minutach podium:
-- podium i tabelę TV pokazuje na zmianę już w fazie `podium`, aż prowadzący zakończy grę.
do $$
declare
  v_def text := pg_get_functiondef('public.ekran_lokalu(text)'::regprocedure);
  v_stare text := $s$         and (s.faza <> 'koniec' or s.faza_od > now() - interval '10 minutes')$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'ekran_lokalu: nie znaleziono warunku końca gry';
  end if;
  execute replace(v_def, v_stare, $n$         and s.faza <> 'koniec'$n$);
end $$;
