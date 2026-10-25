-- Pijany finał: najpierw pytania „wejścia” quizu (pijane_pytania_quizu, po kolei, brzmią jak dalszy ciąg finału),
-- potem wspólna pula (pijane_pytania, kolejność z listy z losowym przesunięciem do 4 miejsc na grę).
-- Wcześniej własne pytania quizu zastępowały wspólną pulę (prowizorka 24.10).
create or replace function public.pijane_pytania(p_kod text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare
  v_s public.sesje;
  v_lokal text;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null or v_s.faza <> 'pijany' then
    return '[]'::jsonb;
  end if;
  select nazwa into v_lokal from public.lokale where id = v_s.lokal_id;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'nr', w.nr,
             'tresc', wewn.pijane_wstawki(w.tresc, v_s.za_barem, v_lokal),
             'efekt', w.efekt,
             'komentarz_prawda', wewn.pijane_wstawki(w.komentarz_prawda, v_s.za_barem, v_lokal),
             'komentarz_falsz', wewn.pijane_wstawki(w.komentarz_falsz, v_s.za_barem, v_lokal)
           ) order by w.klucz)
      from (
        select p.nr, p.tresc, p.efekt, p.komentarz_prawda, p.komentarz_falsz, p.klucz
          from (
            -- wejście quizu: po kolei, przed całą resztą
            select x.nr, x.tresc, x.efekt, x.komentarz_prawda, x.komentarz_falsz, x.nr::numeric as klucz
              from public.pijane_pytania_quizu x
             where x.quiz_id = v_s.quiz_id
            union all
            -- wspólna pula: kolejność z listy, przesunięta losowo (z id gry) o 0..4 miejsca
            select g.nr, g.tresc, g.efekt, g.komentarz_prawda, g.komentarz_falsz,
                   1000 + g.nr + (('x' || substr(md5(g.id::text || v_s.id::text), 1, 6))::bit(24)::int % 400) / 100.0
              from public.pijane_pytania g
          ) p
         where (p.tresc not like '%{za_barem}%'
                and coalesce(p.komentarz_prawda, '') not like '%{za_barem}%'
                and coalesce(p.komentarz_falsz, '') not like '%{za_barem}%')
            or nullif(trim(v_s.za_barem), '') is not null
      ) w
  ), '[]'::jsonb);
end;
$function$;
