-- stan_sesji: plan etapów z odpadaniem (nazwa, finał, ilu przechodzi po etapie), do planszy etapu na TV
-- i telefonie: gracze od początku wiedzą, kiedy się odpada.
do $$
declare
  v_def text := pg_get_functiondef('public.stan_sesji'::regproc);
  v_stare text := $s$'w_grze', (select count(*) from public.gracze where sesja_id = v_s.id and odpadl_po_etapie is null),$s$;
  v_nowe text := $s$'w_grze', (select count(*) from public.gracze where sesja_id = v_s.id and odpadl_po_etapie is null),
    'plan_etapow', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'nr', e.nr, 'nazwa', e.nazwa, 'finalowy', e.finalowy,
               'przechodzi', (v_s.progi ->> e.nr::text)::int
             ) order by e.nr), '[]'::jsonb)
        from public.etapy e where e.quiz_id = v_s.quiz_id
    ),$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono w_grze';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;
