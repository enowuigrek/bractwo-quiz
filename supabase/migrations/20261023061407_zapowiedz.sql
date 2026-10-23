-- Zapowiedź quizu na ekranie lokalu i konta Instagram do oznaczania przy udostępnianiu.
--
-- Gra może być zapowiedziana: ma planowaną godzinę startu, a poczekalnia jest zamknięta. Ekran lokalu
-- pokazuje wtedy plansze z godziną i odliczaniem (zamiast QR), a dołączyć się nie da. Prowadzący
-- otwiera poczekalnię na pilocie (`otworz`), a quiz startuje jak dotąd przyciskiem.

alter table public.sesje
  add column planowany_start timestamptz,
  add column poczekalnia_otwarta boolean not null default true,
  add column browar_instagram text check (char_length(browar_instagram) <= 60);

alter table public.lokale
  add column instagram text check (char_length(instagram) <= 60);

create or replace function public.dolacz(p_kod text, p_nick text, p_token text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_g public.gracze;
  v_nick text;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null then
    raise exception 'Nie ma gry o kodzie %', upper(trim(p_kod));
  end if;

  if p_token is not null then
    select * into v_g from public.gracze where token = p_token and sesja_id = v_s.id;
    if v_g.id is not null then
      return jsonb_build_object('token', v_g.token, 'nick', v_g.nick, 'powrot', true);
    end if;
  end if;

  if v_s.faza = 'koniec' then
    raise exception 'Ta gra już się skończyła';
  end if;

  -- zapowiedziana gra: dołączanie dopiero, gdy prowadzący otworzy poczekalnię (QR na TV)
  if not v_s.poczekalnia_otwarta then
    raise exception 'Zapisy jeszcze nie ruszyły. Poczekaj, aż na telewizorze pojawi się kod QR.';
  end if;

  v_nick := regexp_replace(trim(coalesce(p_nick, '')), '\s+', ' ', 'g');
  if char_length(v_nick) not between 1 and 24 then
    raise exception 'Nick musi mieć od 1 do 24 znaków';
  end if;

  -- blokada wiersza gry, żeby limit graczy działał przy równoczesnych wejściach
  perform 1 from public.sesje where id = v_s.id for update;
  if (select count(*) from public.gracze where sesja_id = v_s.id) >= v_s.max_graczy then
    raise exception 'Komplet graczy, nie ma już miejsc';
  end if;

  begin
    insert into public.gracze (sesja_id, nick) values (v_s.id, v_nick) returning * into v_g;
  exception when unique_violation then
    raise exception 'Nick „%” jest już zajęty', v_nick;
  end;

  return jsonb_build_object('token', v_g.token, 'nick', v_g.nick, 'powrot', false);
end;
$$;

create or replace function wewn.po_zmianie_sesji()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.faza, new.zadanie_nr, new.faza_od, new.faza_do, new.poczekalnia_otwarta, new.planowany_start)
     is distinct from (old.faza, old.zadanie_nr, old.faza_od, old.faza_do, old.poczekalnia_otwarta, old.planowany_start) then
    perform wewn.rozglos(new.kod, 'stan', jsonb_build_object('faza', new.faza, 'zadanie_nr', new.zadanie_nr));
  end if;
  return null;
end;
$$;

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
             poczekalnia_otwarta = true,
             zadanie_nr = v_nast.nr,
             faza_od = v_teraz + interval '5 seconds',
             faza_do = case
               when v_s.czas_s is null then null
               else v_teraz + interval '5 seconds' + make_interval(secs => v_s.czas_s)
             end
       where id = v_s.id;
    end if;

  elsif p_akcja = 'otworz' and v_s.faza = 'poczekalnia' and not v_s.poczekalnia_otwarta then
    update public.sesje set poczekalnia_otwarta = true where id = v_s.id;

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

create or replace function public.stan_sesji(p_kod text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_faza text;
  v_z public.zadania;
  v_zadanie jsonb;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null then
    raise exception 'Nie ma gry o kodzie %', upper(trim(p_kod));
  end if;

  v_faza := wewn.faza_widoczna(v_s);

  if v_s.zadanie_nr > 0 then
    select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
    if v_z.id is not null then
      v_zadanie := jsonb_build_object(
        'id', v_z.id,
        'nr', v_z.nr,
        'lp', (select count(*) from public.zadania where quiz_id = v_s.quiz_id and nr <= v_z.nr),
        'typ', v_z.typ,
        'tresc', v_z.tresc,
        'grafika_url', v_z.grafika_url,
        -- czas na odpowiedź jest ustawieniem gry, nie pytania (null: bez limitu)
        'czas_s', v_s.czas_s,
        'dane', case when wewn.odslania_poprawna(v_faza) then v_z.dane else v_z.dane - 'poprawna' end
      );
      -- statystyki zdradzają poprawną, więc dopiero od fazy `wynik`
      if wewn.odslania_poprawna(v_faza) then
        v_zadanie := v_zadanie || jsonb_build_object(
          'rozklad', wewn.rozklad(v_z.typ, v_z.dane, v_s.id, v_z.id),
          'liczba_poprawnych', (
            select count(*) from public.odpowiedzi
             where sesja_id = v_s.id and zadanie_id = v_z.id and poprawna
          ),
          'najszybszy', (
            select jsonb_build_object('nick', g.nick, 'czas_ms', o.czas_ms)
              from public.odpowiedzi o
              join public.gracze g on g.id = o.gracz_id
             where o.sesja_id = v_s.id and o.zadanie_id = v_z.id and o.poprawna
             order by o.czas_ms, o.utworzono
             limit 1
          )
        );
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'kod', v_s.kod,
    'tryb', v_s.tryb,
    'okazja', v_s.okazja,
    'grafika_url', v_s.grafika_url,
    'bonus_czas', v_s.bonus_czas,
    -- nagrody nie są tajne: TV pokazuje je na podium, telefon zwycięzcy z instrukcją odbioru
    'nagrody', v_s.nagrody,
    -- gościnny browar (kranoprzejęcie): logo na TV obok Bractwa i lokalu
    'browar', case when v_s.browar_nazwa is null then null
                   else jsonb_build_object('nazwa', v_s.browar_nazwa, 'logo_url', v_s.browar_logo_url,
                                           'instagram', v_s.browar_instagram) end,
    -- zapowiedź: planowana godzina startu; QR i dołączanie dopiero po otwarciu poczekalni
    'planowany_start', v_s.planowany_start,
    'poczekalnia_otwarta', v_s.poczekalnia_otwarta,
    'max_graczy', v_s.max_graczy,
    'lokal', (
      select jsonb_build_object('nazwa', l.nazwa, 'miasto', l.miasto, 'logo_url', l.logo_url, 'instagram', l.instagram)
        from public.lokale l where l.id = v_s.lokal_id
    ),
    'quiz', (
      select jsonb_build_object(
        'tytul', q.tytul,
        'liczba_zadan', (select count(*) from public.zadania where quiz_id = q.id)
      )
        from public.quizy q where q.id = v_s.quiz_id
    ),
    'faza', v_faza,
    'faza_od', v_s.faza_od,
    'faza_do', v_s.faza_do,
    'zadanie', v_zadanie,
    'liczba_graczy', (select count(*) from public.gracze where sesja_id = v_s.id),
    'liczba_odpowiedzi', (
      select count(*) from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id
    ),
    'teraz', clock_timestamp()
  );
end;
$$;

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
     and new.ekran_zwolniony is not distinct from old.ekran_zwolniony
     and new.poczekalnia_otwarta is not distinct from old.poczekalnia_otwarta
     and new.planowany_start is not distinct from old.planowany_start then
    return null;
  end if;
  select adres_ekranu into v_adres from public.lokale where id = v_lokal;
  if v_adres is not null then
    perform realtime.send('{}'::jsonb, 'gra', 'lokal:' || v_adres, false);
  end if;
  return null;
end;
$$;

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
  v_zap public.sesje;
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

  -- zapowiedziana gra (poczekalnia jeszcze zamknięta): plansze z godziną i odliczaniem
  select * into v_zap
    from public.sesje s
   where s.lokal_id = v_l.id and s.faza = 'poczekalnia' and not s.poczekalnia_otwarta
   order by s.planowany_start nulls last, s.utworzono desc
   limit 1;

  return jsonb_build_object(
    'lokal', jsonb_build_object('nazwa', v_l.nazwa, 'miasto', v_l.miasto, 'logo_url', v_l.logo_url),
    'kod', (
      select s.kod
        from public.sesje s
       where s.lokal_id = v_l.id
         and not s.ekran_zwolniony
         and s.poczekalnia_otwarta
         and (s.faza <> 'koniec' or s.faza_od > now() - interval '10 minutes')
       order by (s.faza <> 'koniec') desc, s.utworzono desc
       limit 1
    ),
    'zapowiedz', case when v_zap.id is null then null else jsonb_build_object(
      'planowany_start', v_zap.planowany_start,
      'tytul', (select q.tytul from public.quizy q where q.id = v_zap.quiz_id),
      'okazja', v_zap.okazja,
      'browar', case when v_zap.browar_nazwa is null then null
                     else jsonb_build_object('nazwa', v_zap.browar_nazwa, 'logo_url', v_zap.browar_logo_url) end
    ) end,
    'teraz', clock_timestamp(),
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
