-- Pijany finał: z grupy piwnych tylko 5 losowych na grę (w każdej grze inne), potem reszta. Przy 11 piwnych i
-- wejściu quizu szybki gracz (15–20 pytań w 60 s) prawie nie doszedłby do reszty.
create or replace function public.pijane_pytania(p_kod text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare
  v_s public.sesje;
  v_lokal text;
  c_piwnych constant int := 5;
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
             'komentarz_prawda', wewn.pijane_wstawki(w.komentarz_prawda, v_s.za_barem, v_lokal),
             'komentarz_falsz', wewn.pijane_wstawki(w.komentarz_falsz, v_s.za_barem, v_lokal)
           ) order by w.grupa, w.klucz)
      from (
        select p.*, row_number() over (partition by p.grupa order by p.klucz) as lp
          from (
            -- wejście quizu: po kolei, przed całą resztą
            select x.nr, x.tresc, x.komentarz_prawda, x.komentarz_falsz, 0 as grupa, lpad(x.nr::text, 4, '0') as klucz
              from public.pijane_pytania_quizu x
             where x.quiz_id = v_s.quiz_id
            union all
            -- wspólna pula: najpierw piwne, potem reszta, w każdej grupie losowo (z id gry: wszyscy mają to samo)
            select g.nr, g.tresc, g.komentarz_prawda, g.komentarz_falsz, case when g.piwne then 1 else 2 end,
                   md5(g.id::text || v_s.id::text)
              from public.pijane_pytania g
          ) p
         where (p.tresc not like '%{za_barem}%'
                and coalesce(p.komentarz_prawda, '') not like '%{za_barem}%'
                and coalesce(p.komentarz_falsz, '') not like '%{za_barem}%')
            or nullif(trim(v_s.za_barem), '') is not null
      ) w
     where w.grupa <> 1 or w.lp <= c_piwnych
  ), '[]'::jsonb);
end;
$function$;
