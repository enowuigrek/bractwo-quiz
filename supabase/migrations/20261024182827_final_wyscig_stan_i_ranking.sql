-- Finał jako wyścig, część 3: stan serii podaje przewagę finalisty (`start`), a ranking po finale ustawia
-- finalistów według wyścigu: kto dobiegł do szklanki (wcześniej wyżej), potem kto bliżej, potem punkty.
do $$
declare
  v_def text := pg_get_functiondef('public.stan_sesji'::regproc);
  v_stare text := $s$'nick', g.nick, 'zdjecie', g.zdjecie_url,
               'doping'$s$;
  v_nowe text := $s$'nick', g.nick, 'zdjecie', g.zdjecie_url, 'start', g.start_finalu,
               'doping'$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono postępu serii';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;

create or replace function wewn.ranking(p_sesja_id uuid, p_do_nr integer)
 returns table(gracz_id uuid, nick text, punkty bigint, miejsce bigint)
 language sql
 stable
 set search_path to ''
as $function$
  with s as (
    select * from public.sesje where id = p_sesja_id
  ),
  -- finał serią, jeśli ranking obejmuje już jego pytania
  fin as (
    select e.id as etap_id
      from public.etapy e join s on s.quiz_id = e.quiz_id
     where e.finalowy and e.seria
       and p_do_nr >= (select min(z.nr) from public.zadania z where z.etap_id = e.id)
     limit 1
  ),
  pkt as (
    select g.id, g.nick, g.start_finalu,
           coalesce(sum(o.punkty) filter (where z.nr <= p_do_nr), 0) as punkty
      from public.gracze g
      left join public.odpowiedzi o on o.gracz_id = g.id
      left join public.zadania z on z.id = o.zadanie_id
     where g.sesja_id = p_sesja_id
     group by g.id, g.nick, g.start_finalu
  ),
  odp as (
    select o.gracz_id, o.czas_ms,
           sum(o.ocena) over (partition by o.gracz_id order by o.czas_ms, o.id) as narast
      from public.odpowiedzi o
      join public.zadania z on z.id = o.zadanie_id
     where z.etap_id = (select etap_id from fin)
  ),
  bieg as (
    select p.id, p.nick, p.punkty,
           (select etap_id from fin) is not null and (s.finalisci is null or p.id = any (s.finalisci)) as w_finale,
           p.start_finalu + coalesce((select max(odp.narast) from odp where odp.gracz_id = p.id), 0) as kroki,
           (select min(odp.czas_ms) from odp
             where odp.gracz_id = p.id and p.start_finalu + odp.narast >= wewn.meta_finalu() - 0.001) as czas_mety
      from pkt p cross join s
  )
  select b.id, b.nick, b.punkty::bigint,
         rank() over (order by
           case when b.w_finale then 0 else 1 end,
           case when b.w_finale then b.czas_mety end asc nulls last,
           case when b.w_finale then b.kroki end desc nulls last,
           b.punkty desc
         ) as miejsce
    from bieg b
$function$;
