-- Wynik sam po pytaniu, zarządzanie graczami z pilota i ekran lokalu po grze.
--
-- 1. Wynik pokazuje się sam: gdy wszyscy odpowiedzą (`zapisz_odpowiedz`) albo gdy minie czas
--    (`dokoncz_pytanie`, wołane przez TV, pilota i telefony; serwer sam sprawdza zegar).
-- 2. Pilot: lista graczy z tokenami (QR do powrotu na inny telefon). Usuwanie: /api/gracz (klucz serwisowy).
-- 3. Po grze prowadzący może oddać ekran lokalu planszom (`plansze`), a plansze przez 6 godzin
--    pokazują podium ostatniego quizu.

alter table public.sesje add column ekran_zwolniony boolean not null default false;

-- Wszyscy odpowiedzieli albo minął czas (z sekundą zapasu na sieć): pytanie → wynik.
create function wewn.zamknij_pytanie_jesli_gotowe(p_sesja_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_z public.zadania;
  v_teraz timestamptz := clock_timestamp();
  v_gracze int;
  v_odpowiedzi int;
begin
  select * into v_s from public.sesje where id = p_sesja_id for update;
  if v_s.faza is distinct from 'pytanie' or v_teraz < v_s.faza_od then
    return;
  end if;
  select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
  select count(*) into v_gracze from public.gracze where sesja_id = v_s.id;
  select count(*) into v_odpowiedzi from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id;

  if (v_gracze > 0 and v_odpowiedzi >= v_gracze)
     or (v_s.faza_do is not null and v_teraz >= v_s.faza_do + interval '1 second') then
    update public.sesje set faza = 'wynik', faza_od = v_teraz, faza_do = null where id = v_s.id;
  end if;
end;
$$;

revoke execute on function wewn.zamknij_pytanie_jesli_gotowe(uuid) from public, anon, authenticated;

-- Dla klientów, gdy ich zegar pokazuje koniec czasu. Bez skutku, dopóki czas naprawdę nie minie.
create function public.dokoncz_pytanie(p_kod text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null then
    raise exception 'Nie ma gry o kodzie %', upper(trim(p_kod));
  end if;
  perform wewn.zamknij_pytanie_jesli_gotowe(v_s.id);
end;
$$;

revoke execute on function public.dokoncz_pytanie(text) from public;
grant execute on function public.dokoncz_pytanie(text) to anon, authenticated;

-- Zapis odpowiedzi: jak w typy_pytan, ale po ostatniej odpowiedzi od razu wynik.
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
  v_ocena numeric;
  v_baza numeric;
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
  v_ocena := wewn.ocena(v_z.typ, v_z.dane, p_dane);
  v_poprawna := v_ocena = 1;

  if v_s.czas_s is null then
    v_baza := 1000;
  else
    v_limit_ms := v_s.czas_s * 1000;
    v_czas_ms := least(v_czas_ms, v_limit_ms);
    v_baza := case when v_s.bonus_czas then 500 + 500 * (1 - v_czas_ms::numeric / v_limit_ms) else 1000 end;
  end if;
  v_punkty := round(v_baza * v_ocena)::int;

  insert into public.odpowiedzi (gracz_id, sesja_id, zadanie_id, dane, czas_ms, poprawna, punkty, ocena)
  values (v_g.id, v_s.id, v_z.id, p_dane, v_czas_ms, v_poprawna, v_punkty, v_ocena)
  on conflict (gracz_id, zadanie_id) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('przyjeta', false, 'powod', 'juz_odpowiedziano');
  end if;

  select count(*) into v_liczba from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id;
  perform wewn.rozglos(v_s.kod, 'odpowiedz', jsonb_build_object('liczba', v_liczba));

  -- wszyscy odpowiedzieli: od razu wynik (wyzwalacz roześle `stan`)
  perform wewn.zamknij_pytanie_jesli_gotowe(v_s.id);

  return jsonb_build_object('przyjeta', true, 'czas_ms', v_czas_ms);
end;
$$;

-- Gracze dla prowadzącego: token do QR powrotu, punkty i czy odpowiedział na bieżące pytanie.
create function public.pilot_gracze(p_kod text, p_host_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_z public.zadania;
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
  return coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'nick', g.nick,
               'zdjecie', g.zdjecie_url,
               'token', g.token,
               'punkty', coalesce((select sum(o.punkty) from public.odpowiedzi o where o.gracz_id = g.id), 0),
               'odpowiedzial', exists (
                 select 1 from public.odpowiedzi o where o.gracz_id = g.id and o.zadanie_id = v_z.id
               )
             )
             order by g.dolaczyl
           )
      from public.gracze g
     where g.sesja_id = v_s.id
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.pilot_gracze(text, text) from public;
grant execute on function public.pilot_gracze(text, text) to anon, authenticated;

-- Akcje prowadzącego: jak w czas_w_grze, plus `plansze` po końcu gry (ekran lokalu wraca do plansz).
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
  v_po_pytaniu constant text[] := array['wynik', 'odpowiedzi', 'ranking'];
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  select * into v_s from public.sesje where id = v_s.id for update;

  if p_akcja = 'nastepne' and v_s.faza in ('poczekalnia', 'wynik', 'odpowiedzi', 'ranking') then
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
      update public.sesje
         set faza = 'pytanie',
             zadanie_nr = v_nast.nr,
             faza_od = v_teraz + interval '3 seconds',
             faza_do = case
               when v_s.czas_s is null then null
               else v_teraz + interval '3 seconds' + make_interval(secs => v_s.czas_s)
             end
       where id = v_s.id;
    end if;

  elsif p_akcja = 'wynik' and v_s.faza = 'pytanie' then
    update public.sesje set faza = 'wynik', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'odpowiedzi' and v_s.faza in ('wynik', 'ranking') then
    update public.sesje set faza = 'odpowiedzi', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'ranking' and v_s.faza in ('wynik', 'odpowiedzi') then
    update public.sesje set faza = 'ranking', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'podium' and (v_s.faza = any (v_po_pytaniu) or v_s.faza = 'tabela') then
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

-- Zdarzenie dla ekranu lokalu także przy oddaniu ekranu planszom.
create or replace function wewn.po_zmianie_gry_lokalu()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lokal uuid := coalesce(new.lokal_id, old.lokal_id);
  v_adres text;
begin
  if tg_op = 'UPDATE'
     and new.faza is not distinct from old.faza
     and new.lokal_id is not distinct from old.lokal_id
     and new.ekran_zwolniony is not distinct from old.ekran_zwolniony then
    return null;
  end if;
  select adres_ekranu into v_adres from public.lokale where id = v_lokal;
  if v_adres is not null then
    perform realtime.send('{}'::jsonb, 'gra', 'lokal:' || v_adres, false);
  end if;
  return null;
end;
$$;

-- Ekran lokalu: gra (bez oddanych planszom) i podium ostatniego quizu z 6 godzin do plansz.
create or replace function public.ekran_lokalu(p_adres text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_l public.lokale;
  v_ost public.sesje;
begin
  select * into v_l from public.lokale where adres_ekranu = lower(trim(p_adres));
  if v_l.id is null then
    raise exception 'Nie ma lokalu o adresie %', p_adres;
  end if;

  select * into v_ost
    from public.sesje s
   where s.lokal_id = v_l.id and s.faza = 'koniec' and s.faza_od > now() - interval '6 hours'
   order by s.faza_od desc
   limit 1;

  return jsonb_build_object(
    'lokal', jsonb_build_object('nazwa', v_l.nazwa, 'miasto', v_l.miasto, 'logo_url', v_l.logo_url),
    'kod', (
      select s.kod
        from public.sesje s
       where s.lokal_id = v_l.id
         and not s.ekran_zwolniony
         and (s.faza <> 'koniec' or s.faza_od > now() - interval '10 minutes')
       order by (s.faza <> 'koniec') desc, s.utworzono desc
       limit 1
    ),
    'ostatnia', case when v_ost.id is null then null else jsonb_build_object(
      'tytul', (select q.tytul from public.quizy q where q.id = v_ost.quiz_id),
      'okazja', v_ost.okazja,
      'podium', (
        select coalesce(jsonb_agg(r.e order by r.i), '[]'::jsonb)
          from jsonb_array_elements(public.ranking(v_ost.kod)) with ordinality r(e, i)
         where r.i <= 3 and (r.e ->> 'punkty')::int > 0
      )
    ) end
  );
end;
$$;
