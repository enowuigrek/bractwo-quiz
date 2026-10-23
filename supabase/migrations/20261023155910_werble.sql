-- Koniec finału jak w wyścigu: seria kończy się, gdy pierwszy grający dojdzie do mety (odpowie na wszystkie
-- pytania) albo minie czas. Po ostatniej serii nie ma od razu podium, tylko faza `werble`: TV i telefony
-- gasną, potem wolno pojawia się oczekiwanie, a wynik (podium) pokazuje dopiero prowadzący.

alter table public.sesje drop constraint sesje_faza_check;
alter table public.sesje add constraint sesje_faza_check check (
  faza in ('poczekalnia', 'etap', 'seria', 'werble', 'pytanie', 'wynik', 'odpowiedzi', 'ranking', 'podium', 'tabela', 'koniec')
);

create or replace function wewn.zakoncz_serie(p_sesja_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_ostatnie int;
begin
  select * into v_s from public.sesje where id = p_sesja_id;
  if v_s.faza is distinct from 'seria' then
    return;
  end if;
  select max(nr) into v_ostatnie from public.zadania where etap_id = v_s.seria_etap;
  update public.sesje
     set faza = case
           when exists (select 1 from public.zadania where quiz_id = v_s.quiz_id and nr > v_ostatnie) then 'ranking'
           else 'werble'
         end,
         zadanie_nr = coalesce(v_ostatnie, zadanie_nr),
         faza_od = clock_timestamp(),
         faza_do = null
   where id = v_s.id;
end;
$$;

-- Seria kończy się, gdy ktoś z grających odpowiedział na wszystkie pytania (doszedł do mety) albo minął czas.
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
  v_na_mecie int;
begin
  select * into v_s from public.sesje where id = p_sesja_id for update;
  if v_s.faza is distinct from 'seria' or v_teraz < v_s.faza_od then
    return;
  end if;
  select count(*) into v_pytan from public.zadania where etap_id = v_s.seria_etap;
  select count(*) into v_na_mecie
    from public.gracze g
   where g.sesja_id = v_s.id
     and (v_s.finalisci is null or g.id = any (v_s.finalisci))
     and (select count(*) from public.odpowiedzi o join public.zadania z on z.id = o.zadanie_id
           where o.gracz_id = g.id and z.etap_id = v_s.seria_etap) >= v_pytan;
  if v_na_mecie > 0 or (v_s.faza_do is not null and v_teraz >= v_s.faza_do + interval '1 second') then
    perform wewn.zakoncz_serie(v_s.id);
  end if;
end;
$$;

create or replace function public.pilot_akcja(p_kod text, p_host_token text, p_akcja text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_teraz timestamptz := clock_timestamp();
  v_nast public.zadania;
  v_etap_teraz uuid;
  v_e public.etapy;
  v_czas int;
  v_po_pytaniu constant text[] := array['wynik', 'odpowiedzi', 'ranking'];
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  select * into v_s from public.sesje where id = v_s.id for update;

  if p_akcja = 'nastepne' and v_s.faza in ('poczekalnia', 'etap', 'wynik', 'odpowiedzi', 'ranking') then
    select * into v_nast
      from public.zadania
     where quiz_id = v_s.quiz_id and nr > v_s.zadanie_nr
     order by nr
     limit 1;
    select etap_id into v_etap_teraz from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;

    if v_nast.id is null then
      update public.sesje
         set faza = 'podium', faza_od = v_teraz, faza_do = null
       where id = v_s.id;
    elsif v_s.faza = 'etap' and (select seria from public.etapy where id = v_nast.etap_id) then
      -- seria: wszystkie pytania etapu naraz, 5 s odliczania, czas etapu na całą serię (domyślnie 60 s)
      select * into v_e from public.etapy where id = v_nast.etap_id;
      v_czas := coalesce(v_e.czas_s, 60);
      update public.sesje
         set faza = 'seria',
             seria_etap = v_e.id,
             faza_od = v_teraz + interval '5 seconds',
             faza_do = v_teraz + interval '5 seconds' + make_interval(secs => v_czas)
       where id = v_s.id;
    elsif v_s.faza <> 'etap' and v_nast.etap_id is not null and v_nast.etap_id is distinct from v_etap_teraz then
      -- pierwsze pytanie nowego etapu: najpierw plansza etapu (finał: wybór trzech najlepszych)
      select * into v_e from public.etapy where id = v_nast.etap_id;
      update public.sesje
         set faza = 'etap',
             poczekalnia_otwarta = true,
             faza_od = v_teraz,
             faza_do = null,
             finalisci = case when v_e.finalowy then wewn.wybierz_finalistow(v_s.id) end
       where id = v_s.id;
    else
      v_czas := wewn.czas_pytania(v_s, v_nast.etap_id);
      update public.sesje
         set faza = 'pytanie',
             poczekalnia_otwarta = true,
             zadanie_nr = v_nast.nr,
             faza_od = v_teraz + interval '5 seconds',
             faza_do = case
               when v_czas is null then null
               else v_teraz + interval '5 seconds' + make_interval(secs => v_czas)
             end
       where id = v_s.id;
    end if;

  elsif p_akcja = 'otworz' and v_s.faza = 'poczekalnia' and not v_s.poczekalnia_otwarta then
    update public.sesje set poczekalnia_otwarta = true where id = v_s.id;

  elsif p_akcja = 'wynik' and v_s.faza = 'seria' then
    -- prowadzący kończy serię przed czasem
    perform wewn.zakoncz_serie(v_s.id);

  elsif p_akcja = 'wynik' and v_s.faza = 'pytanie' then
    update public.sesje set faza = 'wynik', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'odpowiedzi' and v_s.faza in ('wynik', 'ranking') then
    update public.sesje set faza = 'odpowiedzi', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'ranking' and v_s.faza in ('wynik', 'odpowiedzi', 'etap') then
    update public.sesje set faza = 'ranking', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'podium' and (v_s.faza = any (v_po_pytaniu) or v_s.faza in ('tabela', 'werble')) then
    update public.sesje set faza = 'podium', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'tabela' and (v_s.faza = any (v_po_pytaniu) or v_s.faza = 'podium') then
    update public.sesje set faza = 'tabela', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'koniec' and v_s.faza <> 'koniec' then
    update public.sesje set faza = 'koniec', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'plansze' and v_s.faza = 'koniec' then
    update public.sesje set ekran_zwolniony = true where id = v_s.id;

  else
    raise exception 'Akcja „%” nie jest teraz dostępna (faza: %)', p_akcja, v_s.faza;
  end if;

  return public.pilot_stan(v_s.kod, p_host_token);
end;
$$;
