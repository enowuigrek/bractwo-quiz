-- Pijany finał: z puli pytań każda gra dostaje 8 wylosowanych (w każdej grze inne, ale dla wszystkich graczy
-- tej gry te same: losowanie z id gry), w kolejności z listy w panelu, żeby chaos dalej narastał.
create or replace function public.pijane_pytania(p_kod text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
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
             'tresc', replace(replace(w.tresc, '{za_barem}', coalesce(v_s.za_barem, '')),
                              '{lokal}', coalesce(v_lokal, 'tym barze')),
             'efekt', w.efekt
           ) order by w.nr)
      from (
        select p.nr, p.tresc, p.efekt
          from public.pijane_pytania p
         where p.tresc not like '%{za_barem}%' or nullif(trim(v_s.za_barem), '') is not null
         order by md5(p.id::text || v_s.id::text)
         limit 8
      ) w
  ), '[]'::jsonb);
end;
$$;
