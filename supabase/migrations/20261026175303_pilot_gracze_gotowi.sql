-- Pilot (26.10): przy każdym graczu, czy kliknął „Gotowy” na bieżącej planszy i czy w ogóle musi (kibice spoza
-- finałowej trójki i odpadli nie muszą), żeby prowadzący widział kolorami, na kogo czeka.
do $$
declare
  v_def text;
  v_nowa text;
begin
  v_def := pg_get_functiondef('public.pilot_gracze(text, text)'::regprocedure);
  v_nowa := replace(v_def,
    '''odpowiedzial'', exists (',
    '''gotowy'', g.bot or g.gotowy_od = v_s.faza_od,
               ''musi_gotowy'', g.odpadl_po_etapie is null and (v_s.finalisci is null or g.id = any (v_s.finalisci)),
               ''odpowiedzial'', exists (');
  if v_nowa = v_def then
    raise exception 'pilot_gracze: nie znaleziono fragmentu do podmiany';
  end if;
  execute v_nowa;
end $$;
