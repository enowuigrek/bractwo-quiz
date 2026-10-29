-- 29.10: przy 3 lub mniej grających funkcja zwracała null („wszyscy grają”), a wyścig finałowy (bez punktów, kroki,
-- przewaga, podium według wyścigu) działa tylko z listą finalistów. W teście „Muzyki ponadczasowej” z 3 graczami
-- finał poszedł jak zwykła seria z punktami. Teraz finalistami są najlepsi grający, najwyżej trzech (przy małej grze
-- wszyscy, którzy jeszcze grają); bez grających dalej null.
create or replace function wewn.wybierz_finalistow(p_sesja_id uuid)
 returns uuid[]
 language sql
 stable
 set search_path to ''
as $function$
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
$function$;
