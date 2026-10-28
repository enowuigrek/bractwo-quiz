-- Pijany finał (28.10, Łukasz): na początek 3 losowe pytania „O piwie”, czwarte to pytanie z imieniem z kreatora
-- ({za_barem}), gdy imię wpisano, a bez imienia czwarte też losowe „O piwie”; potem „Odklejone” losowo, aż do końca
-- czasu. Pytanie z {za_barem} nie leci nigdzie indziej (jedno na grę). Ciekawostka w aplikacji stoi po 3. pytaniu.
create or replace function public.pijane_pytania(p_kod text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare
  v_s public.sesje;
  v_lokal text;
  v_barman boolean;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null or v_s.faza <> 'pijany' then
    return '[]'::jsonb;
  end if;
  select nazwa into v_lokal from public.lokale where id = v_s.lokal_id;
  v_barman := nullif(trim(v_s.za_barem), '') is not null;
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
            -- 1: „O piwie”, 2: pytanie z imieniem zza baru, 3: „Odklejone”; w każdej losowo (z id gry: wszyscy to samo)
            select g.nr, g.tresc, g.komentarz_prawda, g.komentarz_falsz,
                   case when g.tresc like '%{za_barem}%'
                          or coalesce(g.komentarz_prawda, '') like '%{za_barem}%'
                          or coalesce(g.komentarz_falsz, '') like '%{za_barem}%' then 2
                        when g.piwne then 1
                        else 3 end as grupa,
                   md5(g.id::text || v_s.id::text) as klucz
              from public.pijane_pytania g
          ) p
         where p.grupa <> 2 or v_barman
      ) w
     where (w.grupa = 1 and w.lp <= case when v_barman then 3 else 4 end)
        or (w.grupa = 2 and w.lp = 1)
        or w.grupa = 3
  ), '[]'::jsonb);
end;
$function$;

update public.pijane_pytania set tresc = 'Podoba ci się {za_barem} za barem?'
 where tresc = 'Podoba ci się {za_barem} na barem?';
