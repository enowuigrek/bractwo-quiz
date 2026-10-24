-- Finał: zła odpowiedź to krok w tył (24.10, Łukasz po teście: żeby nie opłacało się klikać na oślep).
-- W prawda/fałsz zgadywanie daje teraz średnio zero kroków. Za start cofnąć się nie da (krok w tył na linii startu
-- nic nie zabiera, ale przewagę z etapów można stracić): kroki = suma ±1 od przewagi, odbita od zera
-- (`wewn.kroki_finalu`). Finał kończy się też, gdy któryś finalista odpowie na całą pulę, żeby nie zabrakło pytań;
-- wtedy wygrywa ten, kto jest najbliżej piwa (`wewn.ranking`: kroki malejąco).

-- Kroki finalisty w serii: przewaga + (+1 za dobrą, −1 za złą) w kolejności odpowiedzi, nigdy poniżej zera
create or replace function wewn.kroki_finalu(p_gracz_id uuid, p_etap_id uuid)
 returns numeric
 language sql
 stable
 set search_path to ''
as $function$
  select coalesce((
    select t.narast - least(0, min(t.narast) over (order by t.czas_ms, t.id))
      from (
        select o.czas_ms, o.id,
               coalesce(g.start_finalu, 0) + sum(2 * o.ocena - 1) over (order by o.czas_ms, o.id) as narast
          from public.odpowiedzi o
          join public.zadania z on z.id = o.zadanie_id
          join public.gracze g on g.id = o.gracz_id
         where o.gracz_id = p_gracz_id and z.etap_id = p_etap_id
      ) t
     order by t.czas_ms desc, t.id desc
     limit 1
  ), (select coalesce(start_finalu, 0) from public.gracze where id = p_gracz_id))
$function$;

do $$
declare
  v_def text;
begin
  -- stan_sesji: kroki w stanie serii (TV, telefon i pilot biorą je stąd)
  v_def := pg_get_functiondef('public.stan_sesji'::regproc);
  if position($s$'nick', g.nick, 'zdjecie', g.zdjecie_url, 'start', g.start_finalu,$s$ in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono serii';
  end if;
  execute replace(v_def, $s$'nick', g.nick, 'zdjecie', g.zdjecie_url, 'start', g.start_finalu,$s$,
    $s$'nick', g.nick, 'zdjecie', g.zdjecie_url, 'start', g.start_finalu,
               'kroki', wewn.kroki_finalu(g.id, v_s.seria_etap),$s$);

  -- koniec serii: meta liczona z karą, a w finale także po wyczerpaniu puli przez któregoś finalistę
  v_def := pg_get_functiondef('wewn.zamknij_serie_jesli_gotowe'::regproc);
  if position($s$           coalesce(sum(o.ocena), 0) as dobre
      from public.gracze g$s$ in v_def) = 0
     or position($s$or (v_meta is not null and start + dobre >= v_meta - 0.001)),
         count(*) filter (where odpowiedzi < v_pytan)
    into v_przy_piwie, v_w_trakcie$s$ in v_def) = 0 then
    raise exception 'zamknij_serie_jesli_gotowe: nie znaleziono liczenia postępu';
  end if;
  v_def := replace(v_def, $s$           coalesce(sum(o.ocena), 0) as dobre
      from public.gracze g$s$, $s$           coalesce(sum(o.ocena), 0) as dobre,
           wewn.kroki_finalu(g.id, v_s.seria_etap) as kroki
      from public.gracze g$s$);
  v_def := replace(v_def, $s$or (v_meta is not null and start + dobre >= v_meta - 0.001)),
         count(*) filter (where odpowiedzi < v_pytan)
    into v_przy_piwie, v_w_trakcie$s$, $s$or (v_meta is not null and kroki >= v_meta - 0.001)),
         -- finał: gdy ktoś odpowiedział na całą pulę, koniec (inaczej przy złych odpowiedziach zabrakłoby pytań)
         case when v_meta is not null and count(*) filter (where odpowiedzi >= v_pytan) > 0 then 0
              else count(*) filter (where odpowiedzi < v_pytan) end
    into v_przy_piwie, v_w_trakcie$s$);
  execute v_def;

  -- ranking: kroki i czas dobiegnięcia z karą
  v_def := pg_get_functiondef('wewn.ranking(uuid, integer)'::regprocedure);
  if position($s$    select o.gracz_id, o.czas_ms,
           sum(o.ocena) over (partition by o.gracz_id order by o.czas_ms, o.id) as narast
      from public.odpowiedzi o
      join public.zadania z on z.id = o.zadanie_id
     where z.etap_id = (select etap_id from fin)
  ),$s$ in v_def) = 0
     or position($s$           p.start_finalu + coalesce((select max(odp.narast) from odp where odp.gracz_id = p.id), 0) as kroki,
           (select min(odp.czas_ms) from odp
             where odp.gracz_id = p.id and p.start_finalu + odp.narast >= wewn.meta_finalu() - 0.001) as czas_mety$s$ in v_def) = 0 then
    raise exception 'ranking: nie znaleziono liczenia kroków';
  end if;
  v_def := replace(v_def, $s$    select o.gracz_id, o.czas_ms,
           sum(o.ocena) over (partition by o.gracz_id order by o.czas_ms, o.id) as narast
      from public.odpowiedzi o
      join public.zadania z on z.id = o.zadanie_id
     where z.etap_id = (select etap_id from fin)
  ),$s$, $s$    -- kroki po każdej odpowiedzi: przewaga + (±1), odbite od zera (jak wewn.kroki_finalu)
    select t.gracz_id, t.czas_ms, t.id,
           t.narast - least(0, min(t.narast) over (partition by t.gracz_id order by t.czas_ms, t.id)) as kroki
      from (
        select o.gracz_id, o.czas_ms, o.id,
               coalesce(g.start_finalu, 0)
                 + sum(2 * o.ocena - 1) over (partition by o.gracz_id order by o.czas_ms, o.id) as narast
          from public.odpowiedzi o
          join public.zadania z on z.id = o.zadanie_id
          join public.gracze g on g.id = o.gracz_id
         where z.etap_id = (select etap_id from fin)
      ) t
  ),$s$);
  v_def := replace(v_def, $s$           p.start_finalu + coalesce((select max(odp.narast) from odp where odp.gracz_id = p.id), 0) as kroki,
           (select min(odp.czas_ms) from odp
             where odp.gracz_id = p.id and p.start_finalu + odp.narast >= wewn.meta_finalu() - 0.001) as czas_mety$s$,
    $s$           coalesce((select odp.kroki from odp where odp.gracz_id = p.id order by odp.czas_ms desc, odp.id desc limit 1),
                    p.start_finalu) as kroki,
           (select min(odp.czas_ms) from odp
             where odp.gracz_id = p.id and odp.kroki >= wewn.meta_finalu() - 0.001) as czas_mety$s$);
  execute v_def;
end $$;

-- opis planszy finału: zła odpowiedź cofa
update public.etapy
   set opis = 'Trzej najlepsi ścigają się do piwa: dobra odpowiedź to krok naprzód, zła to krok w tył, więc nie klikaj na oślep. '
              || 'Lider ma kilka kroków przewagi. Kto pierwszy dobiegnie, wygrywa.'
 where finalowy and seria and opis like 'Trzej najlepsi ścigają się do piwa%';
