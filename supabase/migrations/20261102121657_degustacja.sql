-- Degustacja (02.11): trzeci rodzaj wieczoru. Piwo to zadanie typu `piwo` (tresc = nazwa, grafika_url = etykieta,
-- dane: styl, moc, browar, piwowar, historia). Goście wypełniają kartę degustacyjną (JSON w `odpowiedzi.dane`),
-- bez punktów i zegara; kartę można poprawiać, dopóki trwa ocenianie, a ocenianie zamyka prowadzący.

-- quiz złożony z samych piw (ciekawostki obok nie przeszkadzają)
create or replace function wewn.degustacja(p_quiz_id uuid)
returns boolean
language sql
stable
set search_path to ''
as $$
  select exists (select 1 from public.zadania where quiz_id = p_quiz_id and typ = 'piwo')
     and not exists (select 1 from public.zadania where quiz_id = p_quiz_id and typ not in ('piwo', 'ciekawostka'))
$$;

-- karta gościa: zapis i poprawki w trakcie oceniania (faza `pytanie` bieżącego piwa)
create or replace function public.zapisz_karte(p_token text, p_zadanie_id uuid, p_dane jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_teraz timestamptz := clock_timestamp();
  v_g public.gracze;
  v_s public.sesje;
  v_z public.zadania;
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
  if v_z.id is distinct from p_zadanie_id or v_z.typ <> 'piwo' then
    return jsonb_build_object('przyjeta', false, 'powod', 'inne_zadanie');
  end if;
  if jsonb_typeof(p_dane) <> 'object' or pg_column_size(p_dane) > 4000 then
    raise exception 'Nieprawidłowa karta';
  end if;

  insert into public.odpowiedzi (gracz_id, sesja_id, zadanie_id, dane, czas_ms, poprawna, punkty, ocena)
  values (v_g.id, v_s.id, v_z.id, p_dane,
          greatest(floor(extract(epoch from (v_teraz - v_s.faza_od)) * 1000)::int, 0), false, 0, null)
  on conflict (gracz_id, zadanie_id) do update set dane = excluded.dane, czas_ms = excluded.czas_ms;

  select count(*) into v_liczba from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id;
  perform wewn.rozglos(v_s.kod, 'odpowiedz', jsonb_build_object('liczba', v_liczba));
  return jsonb_build_object('przyjeta', true);
end;
$$;

-- karty wszystkich piw do tej pory, anonimowo i bez notatek (TV i telefony liczą z nich wyniki sali).
-- Bieżące piwo w trakcie oceniania: same aromaty i smaki (chmura na żywo), oceny dopiero po „Pokaż wyniki”.
create or replace function public.karty_degustacji(p_kod text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_s public.sesje;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null then
    raise exception 'Nie ma gry o kodzie %', upper(trim(p_kod));
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'zadanie_id', z.id,
             'karty', (
               select coalesce(jsonb_agg(
                        case when z.nr = v_s.zadanie_nr and v_s.faza = 'pytanie'
                             then jsonb_build_object('aromaty', o.dane -> 'aromaty', 'smaki', o.dane -> 'smaki')
                             else o.dane - 'notatka' end
                        order by o.utworzono), '[]'::jsonb)
                 from public.odpowiedzi o
                where o.sesja_id = v_s.id and o.zadanie_id = z.id
             )
           ) order by z.nr)
      from public.zadania z
     where z.quiz_id = v_s.quiz_id and z.typ = 'piwo' and z.nr <= v_s.zadanie_nr
  ), '[]'::jsonb);
end;
$$;

-- własne karty gościa (powrót do karty po przeładowaniu, „Twoja degustacja” na koniec)
create or replace function public.moje_karty(p_token text)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('zadanie_id', o.zadanie_id, 'dane', o.dane)), '[]'::jsonb)
    from public.odpowiedzi o
    join public.gracze g on g.id = o.gracz_id
    join public.zadania z on z.id = o.zadanie_id
   where g.token = p_token and z.typ = 'piwo'
$$;

grant execute on function public.zapisz_karte(text, uuid, jsonb) to anon, authenticated;
grant execute on function public.karty_degustacji(text) to anon, authenticated;
grant execute on function public.moje_karty(text) to anon, authenticated;

-- piwo nie zamyka się samo, gdy wszyscy ocenią: kartę można jeszcze poprawić, a zamyka prowadzący
create or replace function wewn.zamknij_pytanie_jesli_gotowe(p_sesja_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_s public.sesje;
  v_z public.zadania;
  v_teraz timestamptz := clock_timestamp();
  v_gracze int;
  v_odpowiedzi int;
begin
  select * into v_s from public.sesje where id = p_sesja_id for no key update;
  if v_s.faza is distinct from 'pytanie' or v_teraz < v_s.faza_od then
    return;
  end if;
  select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
  if v_z.typ = 'piwo' then
    return;
  end if;
  -- w finale czekamy tylko na finalistów
  select count(*) into v_gracze
    from public.gracze
   where sesja_id = v_s.id and odpadl_po_etapie is null and (v_s.finalisci is null or id = any (v_s.finalisci));
  select count(*) into v_odpowiedzi from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id;

  if (v_gracze > 0 and v_odpowiedzi >= v_gracze)
     or (v_s.faza_do is not null and v_teraz >= v_s.faza_do + interval '1 second') then
    update public.sesje set faza = 'wynik', faza_od = v_teraz, faza_do = null where id = v_s.id;
  end if;
end;
$$;

-- bot wypełnia kartę losowo (do testów): kilka aromatów, suwaki, ocena, czasem wada
create or replace function wewn.karta_bota()
returns jsonb
language sql
volatile
set search_path to ''
as $$
  select jsonb_build_object(
    'kolor', floor(random() * 3)::int + 2,
    'klarownosc', floor(random() * 3)::int,
    'piana', round(random() * 100),
    'aromaty', (select jsonb_agg(a) from (
      select a from unnest(array['cytrusy', 'tropiki', 'owoce_czerwone', 'kwiaty', 'zywica', 'chleb', 'karmel',
                                 'kawa', 'czekolada', 'banan', 'przyprawy']) a
       order by random() limit 1 + floor(random() * 3)::int) t),
    'intensywnosc', round(random() * 100),
    'slodycz', round(random() * 100),
    'goryczka', round(40 + random() * 60),
    'kwasnosc', round(random() * 40),
    'smaki', (select jsonb_agg(a) from (
      select a from unnest(array['cytrusy', 'tropiki', 'zywica', 'chleb', 'karmel', 'kawa']) a
       order by random() limit 1 + floor(random() * 2)::int) t),
    'nagazowanie', round(random() * 100),
    'pelnia', round(random() * 100),
    'alkohol', round(random() * 60),
    'finisz', round(random() * 100),
    'wady', case when random() < 0.25 then jsonb_build_array((array['diacetyl', 'dms', 'utlenienie'])[1 + floor(random() * 3)::int])
                 else '[]'::jsonb end,
    'ocena', (2 + floor(random() * 7)::int) / 2.0,
    'jeszcze', random() < 0.6
  )
$$;

create or replace function public.boty_odpowiadaj(p_kod text, p_host_token text)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_s public.sesje;
  v_faza text;
  v_z public.zadania;
  v_b record;
  v_dane jsonb;
  v_ile int := 0;
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  v_faza := wewn.faza_widoczna(v_s);
  if v_faza not in ('pytanie', 'seria') or clock_timestamp() < v_s.faza_od then
    return 0;
  end if;
  if v_faza = 'pytanie' then
    select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
  end if;

  for v_b in
    select g.id, g.token,
           0.4 + 0.45 * (('x' || substr(md5(g.id::text), 1, 4))::bit(16)::int / 65535.0) as wiedza
      from public.gracze g
     where g.sesja_id = v_s.id and g.bot and g.odpadl_po_etapie is null
       and (v_faza = 'pytanie' or v_s.finalisci is null or g.id = any (v_s.finalisci))
  loop
    begin
      if v_faza = 'pytanie' then
        -- boty wpadają w pierwszych sekundach, a czas odpowiedzi udawany (niżej), żeby nie czekać na nie przy testach
        continue when random() > 0.4
          or exists (select 1 from public.odpowiedzi o where o.gracz_id = v_b.id and o.zadanie_id = v_z.id);
        -- degustacja: karta zamiast odpowiedzi, bez punktów i udawanego czasu
        if v_z.typ = 'piwo' then
          perform public.zapisz_karte(v_b.token, v_z.id, wewn.karta_bota());
          v_ile := v_ile + 1;
          continue;
        end if;
        v_dane := wewn.odpowiedz_bota(v_z, v_b.wiedza);
        continue when v_dane is null;
        perform public.zapisz_odpowiedz(v_b.token, v_z.id, v_dane);
        perform wewn.udawany_czas_bota(v_b.id, v_z, v_s, v_b.wiedza);
      else
        -- seria: następne pytanie w tej samej kolejności co na telefonach, mniej więcej co 3,5 s
        continue when random() > 0.2;
        select z.* into v_z
          from public.zadania z
         where z.etap_id = v_s.seria_etap
           and not exists (select 1 from public.odpowiedzi o where o.gracz_id = v_b.id and o.zadanie_id = z.id)
         order by md5(z.id::text || v_s.id::text)
         limit 1;
        continue when v_z.id is null;
        v_dane := wewn.odpowiedz_bota(v_z, v_b.wiedza);
        perform public.zapisz_odpowiedz_serii(v_b.token, v_z.id, v_dane);
      end if;
      v_ile := v_ile + 1;
    exception when others then
      -- np. czas minął albo seria właśnie się skończyła: ten bot po prostu nie odpowiada
      null;
    end;
  end loop;
  return v_ile;
end;
$$;

