-- Seria: po przyjętej odpowiedzi telefon dostaje, czy była dobra (animacja po odpowiedzi w finale).
-- TV i tak pokazuje to od razu krokiem na drodze, więc nic nie zdradza przed wynikiem.
do $$
declare
  v_def text := pg_get_functiondef('public.zapisz_odpowiedz_serii'::regproc);
  v_stare text := $s$return jsonb_build_object('przyjeta', true, 'czas_ms', v_czas_ms);$s$;
  v_nowe text := $s$return jsonb_build_object('przyjeta', true, 'czas_ms', v_czas_ms, 'poprawna', v_ocena = 1);$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'zapisz_odpowiedz_serii: nie znaleziono fragmentu';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;
