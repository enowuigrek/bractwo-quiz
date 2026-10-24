-- Odpadanie, część 2: odcięcie po etapie i finaliści tylko spośród tych, którzy nie odpadli.
-- Koniec etapu z progiem: kto jest poza czołówką (punkty, potem czas, potem kolejność dołączenia), odpada.
create or replace function wewn.odetnij(p_sesja_id uuid, p_etap_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_nr int;
  v_prog int;
begin
  select nr into v_nr from public.etapy where id = p_etap_id;
  select (progi ->> v_nr::text)::int into v_prog from public.sesje where id = p_sesja_id;
  if v_prog is null then
    return;
  end if;
  update public.gracze g
     set odpadl_po_etapie = v_nr
    from (
      select g2.id,
             row_number() over (
               order by coalesce(sum(o.punkty), 0) desc, coalesce(sum(o.czas_ms), 0), g2.dolaczyl
             ) as r
        from public.gracze g2
        left join public.odpowiedzi o on o.gracz_id = g2.id
       where g2.sesja_id = p_sesja_id and g2.odpadl_po_etapie is null
       group by g2.id
    ) t
   where g.id = t.id and t.r > v_prog;
end;
$function$;

-- Finaliści tylko spośród tych, którzy nie odpadli
create or replace function wewn.wybierz_finalistow(p_sesja_id uuid)
 returns uuid[]
 language sql
 stable
 set search_path to ''
as $function$
  select case
    when (select count(*) from public.gracze where sesja_id = p_sesja_id and odpadl_po_etapie is null) <= 3 then null
    else (
      select array_agg(t.id order by t.r)
        from (
          select g.id,
                 row_number() over (
                   order by coalesce(sum(o.punkty), 0) desc, coalesce(sum(o.czas_ms), 0), g.dolaczyl
                 ) as r
            from public.gracze g
            left join public.odpowiedzi o on o.gracz_id = g.id
           where g.sesja_id = p_sesja_id and g.odpadl_po_etapie is null
           group by g.id
        ) t
       where t.r <= 3
    )
  end
$function$;
