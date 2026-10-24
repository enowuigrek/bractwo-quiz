-- Ikony etapów (24.10, pomysł Łukasza): grafika przedmiotu z wieczoru w barze przy nazwie etapu na planszy wstępu
-- i planszy etapu. `etapy.ikona` to ścieżka do pliku w /public (scripts/grafiki.mjs, katalog grafiki/etapy).
-- Bez ikony plansze wyglądają jak dotąd. Trafia do `stan_sesji.plan_etapow` i `wewn.etap_json`.
alter table public.etapy
  add column ikona text check (ikona is null or ikona ~ '^/grafiki/[a-z0-9/_-]+\.(webp|png)$');

update public.etapy e
   set ikona = '/grafiki/etapy/' || m.plik
  from public.quizy q,
       (values (1, 'na-jedno.webp'), (2, 'jednak-wiecej.webp'), (3, 'ile.webp'), (4, 'poskladaj-sie.webp'),
               (5, 'jeszcze-zdaze.webp')) as m(nr, plik)
 where q.id = e.quiz_id
   and q.tytul in ('Piwny quiz Bractwa Piwnego', 'Muzyka ponadczasowa')
   and e.nr = m.nr;

do $$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.stan_sesji'::regproc);
  if position($s$'nr', e.nr, 'nazwa', e.nazwa, 'finalowy', e.finalowy,$s$ in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono planu etapów';
  end if;
  execute replace(v_def, $s$'nr', e.nr, 'nazwa', e.nazwa, 'finalowy', e.finalowy,$s$,
    $s$'nr', e.nr, 'nazwa', e.nazwa, 'finalowy', e.finalowy, 'ikona', e.ikona,$s$);

  v_def := pg_get_functiondef('wewn.etap_json'::regproc);
  if position($s$    'nazwa', e.nazwa,$s$ in v_def) = 0 then
    raise exception 'etap_json: nie znaleziono nazwy';
  end if;
  execute replace(v_def, $s$    'nazwa', e.nazwa,$s$, $s$    'nazwa', e.nazwa,
    'ikona', e.ikona,$s$);
end $$;
