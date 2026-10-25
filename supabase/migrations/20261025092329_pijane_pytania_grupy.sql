-- Pijany finał: wspólna pula w dwóch grupach. „Piwne” (jeszcze o piwie, płynne wejście) lecą najpierw, w losowej
-- kolejności na grę, potem reszta, też losowo. Przed nimi, jak dotąd, wejście quizu po kolei. Przeszkadzacze nie
-- zależą już od pytania (kolumna `efekt` zostaje nieużywana): telefon bierze je według pozycji w dogrywce.
alter table public.pijane_pytania add column if not exists piwne boolean not null default false;

update public.pijane_pytania set piwne = true
 where tresc in (
   'Szklanka piwa jest zawsze do połowy pełna.',
   'Piwo smakuje lepiej, gdy płaci ktoś inny.',
   'Ostatnie piwo jest zawsze przedostatnie.',
   'Pamiętasz, ile dziś było piw?',
   'Twoje piwo patrzy na ciebie z wyrzutem.',
   'Piana to piwo, które się wstydzi.',
   'Gdyby piwo mogło mówić, prosiłoby o litość.',
   'Lewa ręka trzyma piwo pewniej niż prawa.',
   'Kufel to szklanka po siłowni.',
   'Ziemia kręci się szybciej po trzecim piwie.'
 );

insert into public.pijane_pytania (nr, tresc, piwne, komentarz_prawda, komentarz_falsz)
select coalesce(max(nr), 0) + 1, 'Wszyscy lubią się napić Żubra, tylko tak gadają.', true, 'No wiadomo.', 'Kogo chcesz oszukać?'
  from public.pijane_pytania
having not exists (select 1 from public.pijane_pytania where tresc = 'Wszyscy lubią się napić Żubra, tylko tak gadają.');

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
             'komentarz_prawda', wewn.pijane_wstawki(w.komentarz_prawda, v_s.za_barem, v_lokal),
             'komentarz_falsz', wewn.pijane_wstawki(w.komentarz_falsz, v_s.za_barem, v_lokal)
           ) order by w.grupa, w.klucz)
      from (
        select p.nr, p.tresc, p.komentarz_prawda, p.komentarz_falsz, p.grupa, p.klucz
          from (
            -- wejście quizu: po kolei, przed całą resztą
            select x.nr, x.tresc, x.komentarz_prawda, x.komentarz_falsz, 0 as grupa, x.nr::text as klucz
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
  ), '[]'::jsonb);
end;
$function$;
