-- Ciekawostka: zadanie typu `ciekawostka` (tytuł w `tresc`, tekst w `dane.tekst`, grafika jak w pytaniu).
-- Bez odpowiedzi, punktów i zegara: pilot od razu przechodzi w fazę `wynik`, a TV i telefony pokazują planszę.
-- Nie liczy się do numeracji pytań (`lp`), liczby pytań quizu i etapu ani do maksimum punktów wyścigu.
do $$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.pilot_akcja'::regproc);
  if position($s$    else
      v_czas := wewn.czas_pytania(v_s, v_nast.etap_id);$s$ in v_def) = 0 then
    raise exception 'pilot_akcja: nie znaleziono startu pytania';
  end if;
  execute replace(v_def, $s$    else
      v_czas := wewn.czas_pytania(v_s, v_nast.etap_id);$s$,
    $s$    elsif v_nast.typ = 'ciekawostka' then
      -- ciekawostka: od razu plansza (faza `wynik`), bez odliczania i zegara; dalej znów „następne”
      update public.sesje
         set faza = 'wynik',
             poczekalnia_otwarta = true,
             zadanie_nr = v_nast.nr,
             faza_od = v_teraz,
             faza_do = null
       where id = v_s.id;
    else
      v_czas := wewn.czas_pytania(v_s, v_nast.etap_id);$s$);

  v_def := pg_get_functiondef('public.stan_sesji'::regproc);
  if position($s$'lp', (select count(*) from public.zadania where quiz_id = v_s.quiz_id and nr <= v_z.nr),$s$ in v_def) = 0
     or position($s$'liczba_zadan', (select count(*) from public.zadania where quiz_id = q.id),$s$ in v_def) = 0
     or position($s$where z.quiz_id = q.id and not coalesce(e.finalowy, false)$s$ in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono liczenia pytań';
  end if;
  v_def := replace(v_def,
    $s$'lp', (select count(*) from public.zadania where quiz_id = v_s.quiz_id and nr <= v_z.nr),$s$,
    $s$'lp', (select count(*) from public.zadania where quiz_id = v_s.quiz_id and nr <= v_z.nr and typ <> 'ciekawostka'),$s$);
  v_def := replace(v_def,
    $s$'liczba_zadan', (select count(*) from public.zadania where quiz_id = q.id),$s$,
    $s$'liczba_zadan', (select count(*) from public.zadania where quiz_id = q.id and typ <> 'ciekawostka'),$s$);
  v_def := replace(v_def,
    $s$where z.quiz_id = q.id and not coalesce(e.finalowy, false)$s$,
    $s$where z.quiz_id = q.id and not coalesce(e.finalowy, false) and z.typ <> 'ciekawostka'$s$);
  execute v_def;

  v_def := pg_get_functiondef('wewn.etap_json'::regproc);
  if position($s$'liczba_pytan', (select count(*) from public.zadania where etap_id = e.id),$s$ in v_def) = 0
     or position($s$from public.zadania where etap_id = e.id group by typ$s$ in v_def) = 0 then
    raise exception 'etap_json: nie znaleziono liczby pytań';
  end if;
  v_def := replace(v_def,
    $s$'liczba_pytan', (select count(*) from public.zadania where etap_id = e.id),$s$,
    $s$'liczba_pytan', (select count(*) from public.zadania where etap_id = e.id and typ <> 'ciekawostka'),$s$);
  v_def := replace(v_def,
    $s$from public.zadania where etap_id = e.id group by typ$s$,
    $s$from public.zadania where etap_id = e.id and typ <> 'ciekawostka' group by typ$s$);
  execute v_def;
end $$;
