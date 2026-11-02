-- pilot: degustacja z poczekalni od razu do 1. piwa (bez planszy startowej z odliczaniem), a piwo bez odliczania
-- i bez zegara (ocenianie zamyka prowadzący akcją `wynik`)
create or replace function public.pilot_akcja(p_kod text, p_host_token text, p_akcja text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
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
  select * into v_s from public.sesje where id = v_s.id for no key update;

  if p_akcja = 'nastepne' and v_s.faza = 'poczekalnia'
     and exists (select 1 from public.etapy where quiz_id = v_s.quiz_id) then
    -- quiz z etapami: najpierw plansza wstępu (cała droga), potem plansza 1. etapu; start ustala progi
    update public.sesje
       set faza = 'wstep',
           poczekalnia_otwarta = true,
           faza_od = v_teraz,
           faza_do = null,
           progi = coalesce(progi, wewn.progi_domyslne(v_s.id))
     where id = v_s.id;

  elsif p_akcja = 'nastepne' and v_s.faza = 'poczekalnia' and not wewn.degustacja(v_s.quiz_id) then
    -- klasyczny quiz (bez etapów): plansza startowa z odliczaniem 10 s, potem 1. pytanie samo (dokoncz_pytanie)
    update public.sesje
       set faza = 'wstep',
           poczekalnia_otwarta = true,
           faza_od = v_teraz,
           faza_do = v_teraz + interval '10 seconds'
     where id = v_s.id;

  elsif p_akcja = 'nastepne' and v_s.faza in ('poczekalnia', 'wstep', 'etap', 'wynik', 'odpowiedzi', 'ranking') then
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
      -- seria: wszystkie pytania etapu naraz, 3 s odliczania, czas etapu na całą serię (domyślnie 60 s)
      select * into v_e from public.etapy where id = v_nast.etap_id;
      v_czas := coalesce(v_e.czas_s, 60);
      update public.sesje
         set faza = 'seria',
             seria_etap = v_e.id,
             faza_od = v_teraz + interval '3 seconds',
             faza_do = v_teraz + interval '3 seconds' + make_interval(secs => v_czas)
       where id = v_s.id;
    elsif v_s.faza <> 'etap' and v_nast.etap_id is not null and v_nast.etap_id is distinct from v_etap_teraz then
      -- pierwsze pytanie nowego etapu: najpierw plansza etapu (finał: wybór trzech najlepszych)
      select * into v_e from public.etapy where id = v_nast.etap_id;
      -- odpadanie: start quizu ustala progi (domyślne z liczby graczy, chyba że prowadzący zmienił),
      -- a koniec etapu z progiem odcina graczy spoza czołówki
      if v_s.faza = 'poczekalnia' then
        update public.sesje set progi = coalesce(progi, wewn.progi_domyslne(v_s.id)) where id = v_s.id;
      elsif v_etap_teraz is not null then
        perform wewn.odetnij(v_s.id, v_etap_teraz);
      end if;
      update public.sesje
         set faza = 'etap',
             poczekalnia_otwarta = true,
             faza_od = v_teraz,
             faza_do = null,
             finalisci = case when v_e.finalowy then wewn.wybierz_finalistow(v_s.id) end
       where id = v_s.id;
      -- finał: przewaga na starcie wyścigu według punktów sprzed finału
      if v_e.finalowy then
        perform wewn.ustaw_start_finalu(v_s.id);
      end if;
    elsif v_nast.typ = 'ciekawostka' then
      -- ciekawostka: od razu plansza (faza `wynik`), bez odliczania i zegara; dalej znów „następne”
      update public.sesje
         set faza = 'wynik',
             poczekalnia_otwarta = true,
             zadanie_nr = v_nast.nr,
             faza_od = v_teraz,
             faza_do = null
       where id = v_s.id;
    elsif v_nast.typ = 'piwo' then
      -- degustacja: karta otwiera się od razu, bez odliczania i zegara
      update public.sesje
         set faza = 'pytanie',
             poczekalnia_otwarta = true,
             zadanie_nr = v_nast.nr,
             faza_od = v_teraz,
             faza_do = null
       where id = v_s.id;
    else
      v_czas := wewn.czas_pytania(v_s, v_nast.etap_id);
      update public.sesje
         set faza = 'pytanie',
             poczekalnia_otwarta = true,
             zadanie_nr = v_nast.nr,
             faza_od = v_teraz + interval '3 seconds',
             faza_do = case
               when v_czas is null then null
               else v_teraz + interval '3 seconds' + make_interval(secs => v_czas)
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

  elsif p_akcja = 'werble' and v_s.faza = 'pijany' then
    -- 9 s: gaśnięcie telefonów, cisza i wideo pękającej szklanki, potem werble przez dokoncz_pytanie
    update public.sesje
       set faza_do = least(coalesce(faza_do, v_teraz + interval '9 seconds'), v_teraz + interval '9 seconds')
     where id = v_s.id;

  elsif p_akcja = 'muzyka' then
    update public.sesje set muzyka = not muzyka where id = v_s.id;

  elsif p_akcja = 'plansze' and v_s.faza = 'koniec' then
    update public.sesje set ekran_zwolniony = true where id = v_s.id;

  else
    raise exception 'Akcja „%” nie jest teraz dostępna (faza: %)', p_akcja, v_s.faza;
  end if;

  return public.pilot_stan(v_s.kod, p_host_token);
end;
$function$;
