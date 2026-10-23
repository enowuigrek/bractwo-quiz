-- Seria kończy się, gdy ktoś dobiegnie do piwa (wszystkie odpowiedzi dobre), gdy wszyscy grający odpowiedzieli
-- na wszystkie pytania albo gdy minie czas. Wcześniej kończyło ją samo odpowiedzenie na wszystko, więc szybkie
-- losowe klikanie ucinało serię pozostałym.
create or replace function wewn.zamknij_serie_jesli_gotowe(p_sesja_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_teraz timestamptz := clock_timestamp();
  v_pytan int;
  v_przy_piwie int;
  v_w_trakcie int;
begin
  select * into v_s from public.sesje where id = p_sesja_id for update;
  if v_s.faza is distinct from 'seria' or v_teraz < v_s.faza_od then
    return;
  end if;
  select count(*) into v_pytan from public.zadania where etap_id = v_s.seria_etap;
  with postep as (
    select g.id,
           count(o.id) as odpowiedzi,
           coalesce(sum(o.ocena), 0) as dobre
      from public.gracze g
      left join public.odpowiedzi o
        on o.gracz_id = g.id
       and o.zadanie_id in (select z.id from public.zadania z where z.etap_id = v_s.seria_etap)
     where g.sesja_id = v_s.id
       and (v_s.finalisci is null or g.id = any (v_s.finalisci))
     group by g.id
  )
  select count(*) filter (where dobre >= v_pytan - 0.001),
         count(*) filter (where odpowiedzi < v_pytan)
    into v_przy_piwie, v_w_trakcie
    from postep;
  if v_przy_piwie > 0
     or v_w_trakcie = 0
     or (v_s.faza_do is not null and v_teraz >= v_s.faza_do + interval '1 second') then
    perform wewn.zakoncz_serie(v_s.id);
  end if;
end;
$$;
