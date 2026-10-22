-- Pytania bez limitu czasu.
--
-- `zadania.czas_s = null`: pytanie trwa, dopóki nie odpowiedzą wszyscy gracze albo prowadzący
-- nie pokaże wyniku. W trakcie takiego pytania `sesje.faza_do` jest puste. Gdy odpowie ostatni
-- gracz, `zapisz_odpowiedz` ustawia `faza_do = teraz`, tak samo jak przy pytaniach na czas.
-- Bez limitu nie ma od czego liczyć bonusu za szybkość, więc poprawna odpowiedź daje 1000 pkt.

-- Ograniczenie `czas_s between 5 and 300` przepuszcza null, więc zostaje bez zmian.
alter table public.zadania alter column czas_s drop not null;

create or replace function public.pilot_akcja(p_kod text, p_host_token text, p_akcja text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_teraz timestamptz := clock_timestamp();
  v_nast public.zadania;
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  select * into v_s from public.sesje where id = v_s.id for update;

  if p_akcja = 'nastepne' and v_s.faza in ('poczekalnia', 'wynik', 'ranking') then
    select * into v_nast
      from public.zadania
     where quiz_id = v_s.quiz_id and nr > v_s.zadanie_nr
     order by nr
     limit 1;

    if v_nast.id is null then
      update public.sesje
         set faza = 'podium', faza_od = v_teraz, faza_do = null
       where id = v_s.id;
    else
      -- 3 s na `przygotuj`, potem pytanie trwa czas_s (bez limitu: faza_do puste)
      update public.sesje
         set faza = 'pytanie',
             zadanie_nr = v_nast.nr,
             faza_od = v_teraz + interval '3 seconds',
             faza_do = case
               when v_nast.czas_s is null then null
               else v_teraz + interval '3 seconds' + make_interval(secs => v_nast.czas_s)
             end
       where id = v_s.id;
    end if;

  elsif p_akcja = 'wynik' and v_s.faza = 'pytanie' then
    update public.sesje set faza = 'wynik', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'ranking' and v_s.faza = 'wynik' then
    update public.sesje set faza = 'ranking', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'podium' and v_s.faza in ('wynik', 'ranking') then
    update public.sesje set faza = 'podium', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'koniec' and v_s.faza <> 'koniec' then
    update public.sesje set faza = 'koniec', faza_od = v_teraz, faza_do = null where id = v_s.id;

  else
    raise exception 'Akcja „%” nie jest teraz dostępna (faza: %)', p_akcja, v_s.faza;
  end if;

  return public.pilot_stan(v_s.kod, p_host_token);
end;
$$;

-- Zapis odpowiedzi. Baza bierze czas, ocenia i liczy punkty.
-- Nie zwraca, czy odpowiedź jest poprawna: to wychodzi dopiero w `moj_wynik` od fazy `wynik`.
-- Gdy odpowiedzieli wszyscy gracze, pytanie kończy się od razu (`faza_do` = teraz),
-- także pytanie bez limitu czasu.
create or replace function public.zapisz_odpowiedz(p_token text, p_zadanie_id uuid, p_dane jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_teraz timestamptz := clock_timestamp();
  v_g public.gracze;
  v_s public.sesje;
  v_z public.zadania;
  v_czas_ms int;
  v_limit_ms int;
  v_poprawna boolean;
  v_punkty int;
  v_id uuid;
  v_liczba int;
begin
  select * into v_g from public.gracze where token = p_token;
  if v_g.id is null then
    raise exception 'Nieznany gracz';
  end if;

  select * into v_s from public.sesje where id = v_g.sesja_id;
  if v_s.faza <> 'pytanie' then
    return jsonb_build_object('przyjeta', false, 'powod', 'nie_teraz');
  end if;

  select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
  if v_z.id is distinct from p_zadanie_id then
    return jsonb_build_object('przyjeta', false, 'powod', 'inne_zadanie');
  end if;

  if v_teraz < v_s.faza_od then
    return jsonb_build_object('przyjeta', false, 'powod', 'za_wczesnie');
  end if;
  -- sekunda zapasu na opóźnienie sieci; czas i tak ucinamy do limitu
  if v_s.faza_do is not null and v_teraz > v_s.faza_do + interval '1 second' then
    return jsonb_build_object('przyjeta', false, 'powod', 'po_czasie');
  end if;

  if pg_column_size(p_dane) > 2000 then
    raise exception 'Nieprawidłowa odpowiedź';
  end if;

  v_czas_ms := greatest(floor(extract(epoch from (v_teraz - v_s.faza_od)) * 1000)::int, 0);
  v_poprawna := wewn.ocen(v_z.typ, v_z.dane, p_dane);

  if v_z.czas_s is null then
    v_punkty := case when v_poprawna then 1000 else 0 end;
  else
    v_limit_ms := v_z.czas_s * 1000;
    v_czas_ms := least(v_czas_ms, v_limit_ms);
    v_punkty := case
      when not v_poprawna then 0
      when v_s.bonus_czas then round(500 + 500 * (1 - v_czas_ms::numeric / v_limit_ms))::int
      else 1000
    end;
  end if;

  insert into public.odpowiedzi (gracz_id, sesja_id, zadanie_id, dane, czas_ms, poprawna, punkty)
  values (v_g.id, v_s.id, v_z.id, p_dane, v_czas_ms, v_poprawna, v_punkty)
  on conflict (gracz_id, zadanie_id) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('przyjeta', false, 'powod', 'juz_odpowiedziano');
  end if;

  select count(*) into v_liczba from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id;
  perform wewn.rozglos(v_s.kod, 'odpowiedz', jsonb_build_object('liczba', v_liczba));

  -- wszyscy odpowiedzieli: koniec czasu (wyzwalacz roześle `stan`)
  if v_liczba >= (select count(*) from public.gracze where sesja_id = v_s.id) then
    update public.sesje
       set faza_do = v_teraz
     where id = v_s.id and faza = 'pytanie' and zadanie_nr = v_z.nr
       and (faza_do is null or faza_do > v_teraz);
  end if;

  return jsonb_build_object('przyjeta', true, 'czas_ms', v_czas_ms);
end;
$$;
