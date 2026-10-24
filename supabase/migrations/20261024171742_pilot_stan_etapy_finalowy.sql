-- pilot_stan: przy etapach także, który jest finałem trójki (pilot pokazuje progi tylko przed walką o finał).
do $$
declare
  v_def text := pg_get_functiondef('public.pilot_stan'::regproc);
  v_stare text := $s$jsonb_build_object('nr', e.nr, 'nazwa', e.nazwa)$s$;
  v_nowe text := $s$jsonb_build_object('nr', e.nr, 'nazwa', e.nazwa, 'finalowy', e.finalowy)$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'pilot_stan: nie znaleziono listy etapów';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;
