-- Finał jako wyścig (24.10): szklanka jest 12 kroków od startu (dobra odpowiedź = krok), a finaliści startują
-- z przewagą 0–3 kroków według punktów sprzed finału (lider 3, ostatni z trójki 0, środkowy w proporcji).
alter table public.gracze add column start_finalu int not null default 0;

create or replace function wewn.meta_finalu()
 returns int
 language sql
 immutable
 set search_path to ''
as $function$
  select 12
$function$;

create or replace function wewn.ustaw_start_finalu(p_sesja_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_finalisci uuid[];
begin
  select finalisci into v_finalisci from public.sesje where id = p_sesja_id;
  with grajacy as (
    select g.id, coalesce(sum(o.punkty), 0) as punkty
      from public.gracze g
      left join public.odpowiedzi o on o.gracz_id = g.id
     where g.sesja_id = p_sesja_id
       and g.odpadl_po_etapie is null
       and (v_finalisci is null or g.id = any (v_finalisci))
     group by g.id
  ), zakres as (
    select max(punkty) as najw, min(punkty) as najm from grajacy
  )
  update public.gracze g
     set start_finalu = case when z.najw = z.najm then 0
                             else round(3.0 * (gr.punkty - z.najm) / (z.najw - z.najm))::int end
    from grajacy gr, zakres z
   where g.id = gr.id;
end;
$function$;
