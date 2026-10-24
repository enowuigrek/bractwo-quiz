-- stan_sesji: bieżące pytanie jest ostatnie w swoim etapie (ranking po nim to koniec etapu: na TV napis
-- „Koniec etapu”, muzyka wycisza się przed planszą następnego etapu).
do $$
declare
  v_def text := pg_get_functiondef('public.stan_sesji'::regproc);
  v_stare text := $s$'w_grze', (select count(*) from public.gracze where sesja_id = v_s.id and odpadl_po_etapie is null),$s$;
  v_nowe text := $s$'w_grze', (select count(*) from public.gracze where sesja_id = v_s.id and odpadl_po_etapie is null),
    'ostatnie_w_etapie', v_z.etap_id is not null and not exists (
      select 1 from public.zadania n where n.quiz_id = v_s.quiz_id and n.nr > v_s.zadanie_nr and n.etap_id = v_z.etap_id
    ),$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono w_grze';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;
