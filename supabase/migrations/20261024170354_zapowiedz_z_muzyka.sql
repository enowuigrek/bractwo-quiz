-- Ekran lokalu przy zapowiedzi gry gra już muzykę poczekalni, jeśli gra ma włączoną muzykę.
do $$
declare
  v_def text := pg_get_functiondef('public.ekran_lokalu'::regproc);
  v_stare text := $s$      'okazja', v_zap.okazja,
      'browar',$s$;
  v_nowe text := $s$      'okazja', v_zap.okazja,
      'muzyka', v_zap.muzyka,
      'browar',$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'ekran_lokalu: nie znaleziono fragmentu zapowiedzi';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;
