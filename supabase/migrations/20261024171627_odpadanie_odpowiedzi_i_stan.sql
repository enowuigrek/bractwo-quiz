-- Odpadanie, część 5: odpadnięci nie odpowiadają, pytanie kończy się, gdy odpowiedzieli wszyscy, którzy
-- jeszcze grają; stan_sesji podaje, ilu gra, ranking i moj_wynik: kto odpadł; pilot_stan: progi i etapy.
do $$
declare
  v_def text;
begin
  -- zapisz_odpowiedz: odpadnięci nie odpowiadają
  v_def := pg_get_functiondef('public.zapisz_odpowiedz'::regproc);
  if position($s$    return jsonb_build_object('przyjeta', false, 'powod', 'kibic');
  end if;$s$ in v_def) = 0 then
    raise exception 'zapisz_odpowiedz: nie znaleziono sprawdzenia kibica';
  end if;
  execute replace(v_def,
    $s$    return jsonb_build_object('przyjeta', false, 'powod', 'kibic');
  end if;$s$,
    $s$    return jsonb_build_object('przyjeta', false, 'powod', 'kibic');
  end if;
  -- odpadnięci tylko patrzą i kibicują
  if v_g.odpadl_po_etapie is not null then
    return jsonb_build_object('przyjeta', false, 'powod', 'odpadl');
  end if;$s$);

  -- koniec pytania, gdy odpowiedzieli wszyscy, którzy jeszcze grają
  v_def := pg_get_functiondef('wewn.zamknij_pytanie_jesli_gotowe'::regproc);
  if position($s$   where sesja_id = v_s.id and (v_s.finalisci is null$s$ in v_def) = 0 then
    raise exception 'zamknij_pytanie_jesli_gotowe: nie znaleziono liczenia graczy';
  end if;
  execute replace(v_def,
    $s$   where sesja_id = v_s.id and (v_s.finalisci is null$s$,
    $s$   where sesja_id = v_s.id and odpadl_po_etapie is null and (v_s.finalisci is null$s$);

  -- stan_sesji: ilu jeszcze gra
  v_def := pg_get_functiondef('public.stan_sesji'::regproc);
  if position($s$'muzyka', v_s.muzyka,$s$ in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono muzyki';
  end if;
  execute replace(v_def, $s$'muzyka', v_s.muzyka,$s$,
    $s$'muzyka', v_s.muzyka,
    'w_grze', (select count(*) from public.gracze where sesja_id = v_s.id and odpadl_po_etapie is null),$s$);

  -- ranking i moj_wynik: kto odpadł
  v_def := pg_get_functiondef('public.ranking'::regproc);
  if position($s$'zdobyte', t.punkty - p.punkty$s$ in v_def) = 0 then
    raise exception 'ranking: nie znaleziono pola zdobyte';
  end if;
  execute replace(v_def, $s$'zdobyte', t.punkty - p.punkty$s$,
    $s$'zdobyte', t.punkty - p.punkty,
               'odpadl', g.odpadl_po_etapie$s$);

  v_def := pg_get_functiondef('public.moj_wynik'::regproc);
  if position($s$'nagroda_odebrana', v_g.nagroda_odebrana,$s$ in v_def) = 0 then
    raise exception 'moj_wynik: nie znaleziono nagrody';
  end if;
  execute replace(v_def, $s$'nagroda_odebrana', v_g.nagroda_odebrana,$s$,
    $s$'nagroda_odebrana', v_g.nagroda_odebrana,
    'odpadl', v_g.odpadl_po_etapie,$s$);

  -- pilot_stan: progi (zapisane albo domyślne) i etapy quizu do ich edycji
  v_def := pg_get_functiondef('public.pilot_stan'::regproc);
  if position($s$    'ostatnie_zadanie', v_nast.id is null,$s$ in v_def) = 0 then
    raise exception 'pilot_stan: nie znaleziono ostatniego zadania';
  end if;
  execute replace(v_def, $s$    'ostatnie_zadanie', v_nast.id is null,$s$,
    $s$    'ostatnie_zadanie', v_nast.id is null,
    'progi', coalesce(v_s.progi, wewn.progi_domyslne(v_s.id)),
    'progi_wlasne', v_s.progi is not null,
    'etapy', (
      select coalesce(jsonb_agg(jsonb_build_object('nr', e.nr, 'nazwa', e.nazwa) order by e.nr), '[]'::jsonb)
        from public.etapy e where e.quiz_id = v_s.quiz_id
    ),$s$);
end $$;
