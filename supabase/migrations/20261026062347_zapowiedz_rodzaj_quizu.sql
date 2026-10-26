-- Ekran lokalu (26.10): zapowiedziany klasyczny pub quiz pokazuje ekran z logo lokalu i odliczaniem, wyścig po piwo
-- dotychczasowe plansze. Zapowiedź mówi więc, czy quiz jest klasyczny (bez etapów).
do $$
declare
  v_def text := pg_get_functiondef('public.ekran_lokalu(text)'::regprocedure);
begin
  if position('''auto'', v_zap.auto,' in v_def) = 0 then
    raise exception 'ekran_lokalu: nie znaleziono automatu w zapowiedzi';
  end if;
  execute replace(v_def, '''auto'', v_zap.auto,',
    '''auto'', v_zap.auto, ''klasyczny'', not exists (select 1 from public.etapy e where e.quiz_id = v_zap.quiz_id),');
end $$;
