-- 28.10: gracz usunięty przez prowadzącego znikał bez śladu (on delete cascade), więc po grze nie było wiadomo, że grał.
-- Trasa /api/gracz zapisuje go teraz przed usunięciem w gracze_usunieci (wynik, miejsce, przy którym pytaniu).
-- Do tego miejsca, na których gracze odpadli po etapach, do strony wyników gry.
create table public.gracze_usunieci (
  id uuid primary key default gen_random_uuid(),
  sesja_id uuid not null references public.sesje (id) on delete cascade,
  nick text not null,
  zdjecie_url text,
  punkty integer not null default 0,
  dobre integer not null default 0,
  odpowiedzi integer not null default 0,
  miejsce integer,
  zadanie_nr integer,
  usunieto timestamptz not null default now()
);
alter table public.gracze_usunieci enable row level security;
grant select, insert, update, delete on public.gracze_usunieci to service_role;

create or replace function public.odpadniecia(p_sesja_id uuid)
returns table (gracz_id uuid, etap_nr integer, etap_nazwa text, miejsce bigint)
language sql stable security definer set search_path to '' as $function$
  select g.id, e.nr, e.nazwa, r.miejsce
  from public.gracze g
  join public.sesje s on s.id = g.sesja_id
  join public.etapy e on e.quiz_id = s.quiz_id and e.nr = g.odpadl_po_etapie
  cross join lateral (
    select r.miejsce from wewn.ranking(s.id, (select max(z.nr) from public.zadania z where z.etap_id = e.id)) r
    where r.gracz_id = g.id
  ) r
  where g.sesja_id = p_sesja_id and g.odpadl_po_etapie is not null
$function$;
revoke all on function public.odpadniecia(uuid) from public, anon, authenticated;
grant execute on function public.odpadniecia(uuid) to service_role;
