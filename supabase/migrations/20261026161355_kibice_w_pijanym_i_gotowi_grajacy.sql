-- Kibice (26.10): poza finałową trójką nie muszą klikać „Gotowy” (licznik liczy tylko grających, `gotowi_z`),
-- a w pijanym finale dalej kibicują (okrzyki przyjmowane i wydawane TV także w fazie `pijany`).
do $$
declare
  v_def text;
  v_nowa text;
begin
  v_def := pg_get_functiondef('public.stan_sesji(text)'::regprocedure);
  v_nowa := replace(v_def,
    'and (g.bot or g.gotowy_od = v_s.faza_od)),',
    'and (v_s.finalisci is null or g.id = any (v_s.finalisci))
                  and (g.bot or g.gotowy_od = v_s.faza_od)),
    ''gotowi_z'', (select count(*) from public.gracze g
                where g.sesja_id = v_s.id and g.odpadl_po_etapie is null
                  and (v_s.finalisci is null or g.id = any (v_s.finalisci))),');
  v_nowa := replace(v_nowa, '''okrzyki'', case when v_faza = ''seria'' then (',
                            '''okrzyki'', case when v_faza in (''seria'', ''pijany'') then (');
  if v_nowa = v_def or position('gotowi_z' in v_nowa) = 0 or position('v_faza in (''seria'', ''pijany'') then (
      select coalesce(jsonb_agg(jsonb_build_object(''id''' in v_nowa) = 0 then
    raise exception 'stan_sesji: nie znaleziono fragmentów do podmiany';
  end if;
  execute v_nowa;

  v_def := pg_get_functiondef('public.kibicuj(text, text, integer)'::regprocedure);
  v_nowa := replace(v_def, 'if v_s.faza <> ''seria'' or v_s.finalisci is null',
                           'if v_s.faza not in (''seria'', ''pijany'') or v_s.finalisci is null');
  if v_nowa = v_def then
    raise exception 'kibicuj: nie znaleziono fragmentu do podmiany';
  end if;
  execute v_nowa;
end $$;
