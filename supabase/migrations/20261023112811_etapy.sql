-- Etapy quizu: quiz dzieli się na etapy (np. jedna odpowiedź → kilka poprawnych → pary → finał).
-- Przed pierwszym pytaniem etapu TV pokazuje planszę z zasadami (faza `etap`), a prowadzący startuje
-- etap z pilota. Etap ma mnożnik punktów, może mieć własny czas na odpowiedź i może być finałem,
-- w którym odpowiadają tylko 3 najlepsi (`sesje.finalisci`). Quiz bez etapów działa jak dotąd.
-- Do tego nowe typy pytań: `prawda_falsz` (dane jak w `wybor`: odpowiedzi „Prawda”, „Fałsz”)
-- i `szacowanie` (liczba z zakresu, punkty maleją z odległością), oraz dodatki do każdego pytania:
-- `dane.podpowiedzi` (odsłaniane po kolei w trakcie pytania) i `dane.odslaniaj` (grafika wyostrza się na TV).

create table public.etapy (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizy (id) on delete cascade,
  nr integer not null check (nr > 0),
  nazwa text not null check (char_length(trim(nazwa)) between 1 and 60),
  opis text check (char_length(opis) <= 240),
  mnoznik numeric(3, 1) not null default 1 check (mnoznik between 1 and 3),
  -- null: czas z ustawień gry
  czas_s integer check (czas_s between 5 and 300),
  finalowy boolean not null default false,
  constraint etapy_quiz_nr_unikalny unique (quiz_id, nr) deferrable initially deferred
);

alter table public.etapy enable row level security;
revoke all on public.etapy from anon, authenticated;
grant select, insert, update, delete on public.etapy to service_role;

alter table public.zadania add column etap_id uuid references public.etapy (id) on delete set null;
create index zadania_etap_id on public.zadania (etap_id);

-- gracze, którzy odpowiadają w finale (null: wszyscy)
alter table public.sesje add column finalisci uuid[];

alter table public.sesje drop constraint sesje_faza_check;
alter table public.sesje add constraint sesje_faza_check check (
  faza in ('poczekalnia', 'etap', 'pytanie', 'wynik', 'odpowiedzi', 'ranking', 'podium', 'tabela', 'koniec')
);

-- ---------------------------------------------------------------------------
-- Panel: kolejność pytań zgodna z kolejnością etapów
-- ---------------------------------------------------------------------------

-- Numeruje etapy 1..n, a pytania po kolei etapami (pytania bez etapu na początku).
-- Panel woła ją po każdej zmianie etapów i po przeniesieniu pytania do innego etapu.
create function public.admin_uporzadkuj_quiz(p_quiz uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.etapy e
     set nr = k.nowy
    from (select id, row_number() over (order by nr, id) as nowy from public.etapy where quiz_id = p_quiz) k
   where e.id = k.id and e.nr is distinct from k.nowy;

  update public.zadania z
     set nr = k.nowy
    from (
      select z2.id, row_number() over (order by e.nr nulls first, z2.nr) as nowy
        from public.zadania z2
        left join public.etapy e on e.id = z2.etap_id
       where z2.quiz_id = p_quiz
    ) k
   where z.id = k.id and z.nr is distinct from k.nowy;
end;
$$;

revoke execute on function public.admin_uporzadkuj_quiz(uuid) from public, anon, authenticated;
grant execute on function public.admin_uporzadkuj_quiz(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Pomocnicze
-- ---------------------------------------------------------------------------

-- Etap do pokazania na planszy, TV i telefonach.
create function wewn.etap_json(p_etap_id uuid, p_s public.sesje)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', e.id,
    'nr', e.nr,
    'liczba', (select count(*) from public.etapy where quiz_id = e.quiz_id),
    'nazwa', e.nazwa,
    'opis', e.opis,
    'mnoznik', e.mnoznik,
    'czas_s', coalesce(e.czas_s, p_s.czas_s),
    'finalowy', e.finalowy,
    'liczba_pytan', (select count(*) from public.zadania where etap_id = e.id),
    'typy', (
      select coalesce(jsonb_agg(t.typ order by t.pierwszy), '[]'::jsonb)
        from (select typ, min(nr) as pierwszy from public.zadania where etap_id = e.id group by typ) t
    )
  )
    from public.etapy e
   where e.id = p_etap_id
$$;

-- Trzech najlepszych do finału (przy remisie mniejszy łączny czas odpowiedzi). Null, gdy graczy jest najwyżej 3.
create function wewn.wybierz_finalistow(p_sesja_id uuid)
returns uuid[]
language sql
stable
set search_path = ''
as $$
  select case
    when (select count(*) from public.gracze where sesja_id = p_sesja_id) <= 3 then null
    else (
      select array_agg(t.id order by t.r)
        from (
          select g.id,
                 row_number() over (
                   order by coalesce(sum(o.punkty), 0) desc, coalesce(sum(o.czas_ms), 0), g.dolaczyl
                 ) as r
            from public.gracze g
            left join public.odpowiedzi o on o.gracz_id = g.id
           where g.sesja_id = p_sesja_id
           group by g.id
        ) t
       where t.r <= 3
    )
  end
$$;

-- Czas na odpowiedź w pytaniu: czas etapu albo gry (null: bez limitu).
create function wewn.czas_pytania(p_s public.sesje, p_etap_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select coalesce((select czas_s from public.etapy where id = p_etap_id), p_s.czas_s)
$$;

revoke execute on function wewn.etap_json(uuid, public.sesje), wewn.wybierz_finalistow(uuid),
  wewn.czas_pytania(public.sesje, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Ocena nowych typów
-- ---------------------------------------------------------------------------

create or replace function wewn.ocen(p_typ text, p_zadanie jsonb, p_odp jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_idx int;
begin
  if p_typ in ('wybor', 'prawda_falsz') then
    if jsonb_typeof(p_odp -> 'odpowiedz') is distinct from 'number' then
      raise exception 'Nieprawidłowa odpowiedź';
    end if;
    v_idx := (p_odp ->> 'odpowiedz')::numeric;
    if v_idx::numeric <> (p_odp ->> 'odpowiedz')::numeric
       or v_idx < 0
       or v_idx >= jsonb_array_length(p_zadanie -> 'odpowiedzi') then
      raise exception 'Nieprawidłowa odpowiedź';
    end if;
    return v_idx = (p_zadanie ->> 'poprawna')::int;
  end if;

  raise exception 'Nieznany typ zadania: %', p_typ;
end;
$$;

create or replace function wewn.ocena(p_typ text, p_zadanie jsonb, p_odp jsonb)
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_n int;
  v_odp jsonb;
  v_traf int;
  v_bl int;
  v_x numeric;
  v_d numeric;
begin
  if p_typ in ('wybor', 'prawda_falsz') then
    return case when wewn.ocen(p_typ, p_zadanie, p_odp) then 1 else 0 end;
  end if;

  if p_typ = 'wielokrotny' then
    v_n := jsonb_array_length(p_zadanie -> 'odpowiedzi');
    v_odp := p_odp -> 'odpowiedzi';
    if not wewn.indeksy_ok(v_odp, v_n, null, true) then
      raise exception 'Nieprawidłowa odpowiedź';
    end if;
    select count(*) filter (where (p_zadanie -> 'poprawna') @> jsonb_build_array(e)),
           count(*) filter (where not (p_zadanie -> 'poprawna') @> jsonb_build_array(e))
      into v_traf, v_bl
      from jsonb_array_elements(v_odp) e;
    return greatest(0, (v_traf - v_bl)::numeric / jsonb_array_length(p_zadanie -> 'poprawna'));
  end if;

  -- kolejność: dobrze ułożone pary sąsiadów (B C D A zamiast A B C D: B→C i C→D, czyli 2/3)
  if p_typ = 'kolejnosc' then
    v_n := jsonb_array_length(p_zadanie -> 'elementy');
    v_odp := p_odp -> 'kolejnosc';
    if not wewn.indeksy_ok(v_odp, v_n, v_n, true) then
      raise exception 'Nieprawidłowa odpowiedź';
    end if;
    if v_n < 2 then
      return 1;
    end if;
    select count(*) into v_traf
      from generate_series(0, v_n - 2) i
     where exists (
       select 1
         from generate_series(0, v_n - 2) j
        where (v_odp -> j) = (p_zadanie -> 'poprawna' -> i)
          and (v_odp -> (j + 1)) = (p_zadanie -> 'poprawna' -> (i + 1))
     );
    return v_traf::numeric / (v_n - 1);
  end if;

  if p_typ = 'pary' then
    v_n := jsonb_array_length(p_zadanie -> 'lewe');
    v_odp := p_odp -> 'pary';
    if not wewn.indeksy_ok(v_odp, v_n, v_n, true) then
      raise exception 'Nieprawidłowa odpowiedź';
    end if;
    select count(*) into v_traf
      from generate_series(0, v_n - 1) i
     where (v_odp -> i) = (p_zadanie -> 'poprawna' -> i);
    return v_traf::numeric / v_n;
  end if;

  -- szacowanie: pełne punkty za trafienie (co do kroku), dalej mniej, aż do zera w odległości `tolerancja`
  if p_typ = 'szacowanie' then
    if jsonb_typeof(p_odp -> 'liczba') is distinct from 'number' then
      raise exception 'Nieprawidłowa odpowiedź';
    end if;
    v_x := (p_odp ->> 'liczba')::numeric;
    if v_x < (p_zadanie ->> 'min')::numeric or v_x > (p_zadanie ->> 'max')::numeric then
      raise exception 'Nieprawidłowa odpowiedź';
    end if;
    v_d := abs(v_x - (p_zadanie ->> 'poprawna')::numeric);
    if v_d * 2 < (p_zadanie ->> 'krok')::numeric then
      return 1;
    end if;
    return least(0.999, greatest(0, round(1 - v_d / (p_zadanie ->> 'tolerancja')::numeric, 3)));
  end if;

  raise exception 'Nieznany typ zadania: %', p_typ;
end;
$$;

create or replace function wewn.rozklad(p_typ text, p_zadanie jsonb, p_sesja_id uuid, p_zadanie_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select case
    when p_typ in ('wybor', 'prawda_falsz') then (
      select coalesce(jsonb_agg(coalesce(c.n, 0) order by i), '[]'::jsonb)
        from generate_series(0, jsonb_array_length(p_zadanie -> 'odpowiedzi') - 1) i
        left join (
          select (o.dane ->> 'odpowiedz')::int as idx, count(*) as n
            from public.odpowiedzi o
           where o.sesja_id = p_sesja_id and o.zadanie_id = p_zadanie_id
           group by 1
        ) c on c.idx = i
    )
    when p_typ = 'wielokrotny' then (
      select coalesce(jsonb_agg(coalesce(c.n, 0) order by i), '[]'::jsonb)
        from generate_series(0, jsonb_array_length(p_zadanie -> 'odpowiedzi') - 1) i
        left join (
          select (e #>> '{}')::int as idx, count(*) as n
            from public.odpowiedzi o, jsonb_array_elements(o.dane -> 'odpowiedzi') e
           where o.sesja_id = p_sesja_id and o.zadanie_id = p_zadanie_id
           group by 1
        ) c on c.idx = i
    )
    -- szacowanie: wszystkie podane liczby (bez nicków), do osi na TV
    when p_typ = 'szacowanie' then (
      select coalesce(jsonb_agg((o.dane ->> 'liczba')::numeric order by (o.dane ->> 'liczba')::numeric), '[]'::jsonb)
        from public.odpowiedzi o
       where o.sesja_id = p_sesja_id and o.zadanie_id = p_zadanie_id
    )
  end
$$;

-- ---------------------------------------------------------------------------
-- Gra
-- ---------------------------------------------------------------------------

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

  elsif p_akcja = 'wynik' and v_s.faza = 'pytanie' then
    update public.sesje set faza = 'wynik', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'odpowiedzi' and v_s.faza in ('wynik', 'ranking') then
    update public.sesje set faza = 'odpowiedzi', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'ranking' and v_s.faza in ('wynik', 'odpowiedzi', 'etap') then
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

create or replace function public.zapisz_odpowiedz(p_token text, p_zadanie_id uuid, p_dane jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teraz timestamptz := clock_timestamp();
  v_g public.gracze;
  v_s public.sesje;
  v_z public.zadania;
  v_e public.etapy;
  v_czas int;
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

  -- finał: odpowiadają tylko finaliści, reszta kibicuje
  if v_s.finalisci is not null and not (v_g.id = any (v_s.finalisci)) then
    return jsonb_build_object('przyjeta', false, 'powod', 'kibic');
  end if;

  if v_teraz < v_s.faza_od then
    return jsonb_build_object('przyjeta', false, 'powod', 'za_wczesnie');
  end if;
  if v_s.faza_do is not null and v_teraz > v_s.faza_do + interval '1 second' then
    return jsonb_build_object('przyjeta', false, 'powod', 'po_czasie');
  end if;

  if pg_column_size(p_dane) > 2000 then
    raise exception 'Nieprawidłowa odpowiedź';
  end if;

  select * into v_e from public.etapy where id = v_z.etap_id;
  v_czas := coalesce(v_e.czas_s, v_s.czas_s);

  v_czas_ms := greatest(floor(extract(epoch from (v_teraz - v_s.faza_od)) * 1000)::int, 0);
  v_ocena := wewn.ocena(v_z.typ, v_z.dane, p_dane);
  v_poprawna := v_ocena = 1;

  if v_czas is null then
    v_baza := 1000;
  else
    v_limit_ms := v_czas * 1000;
    v_czas_ms := least(v_czas_ms, v_limit_ms);
    v_baza := case when v_s.bonus_czas then 500 + 500 * (1 - v_czas_ms::numeric / v_limit_ms) else 1000 end;
  end if;
  -- mnożnik etapu: trudniejsze etapy są więcej warte
  v_punkty := round(v_baza * v_ocena * coalesce(v_e.mnoznik, 1))::int;

  insert into public.odpowiedzi (gracz_id, sesja_id, zadanie_id, dane, czas_ms, poprawna, punkty, ocena)
  values (v_g.id, v_s.id, v_z.id, p_dane, v_czas_ms, v_poprawna, v_punkty, v_ocena)
  on conflict (gracz_id, zadanie_id) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('przyjeta', false, 'powod', 'juz_odpowiedziano');
  end if;

  select count(*) into v_liczba from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id;
  perform wewn.rozglos(v_s.kod, 'odpowiedz', jsonb_build_object('liczba', v_liczba));

  perform wewn.zamknij_pytanie_jesli_gotowe(v_s.id);

  return jsonb_build_object('przyjeta', true, 'czas_ms', v_czas_ms);
end;
$$;

create or replace function wewn.zamknij_pytanie_jesli_gotowe(p_sesja_id uuid)
returns void
language plpgsql
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
  -- w finale czekamy tylko na finalistów
  select count(*) into v_gracze
    from public.gracze
   where sesja_id = v_s.id and (v_s.finalisci is null or id = any (v_s.finalisci));
  select count(*) into v_odpowiedzi from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id;

  if (v_gracze > 0 and v_odpowiedzi >= v_gracze)
     or (v_s.faza_do is not null and v_teraz >= v_s.faza_do + interval '1 second') then
    update public.sesje set faza = 'wynik', faza_od = v_teraz, faza_do = null where id = v_s.id;
  end if;
end;
$$;

create or replace function public.odpowiedzi_zadania(p_kod text)
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
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null then
    raise exception 'Nie ma gry o kodzie %', upper(trim(p_kod));
  end if;
  if not wewn.odslania_poprawna(wewn.faza_widoczna(v_s)) then
    return '[]'::jsonb;
  end if;

  select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
  if v_z.id is null then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'nick', g.nick,
               'zdjecie', g.zdjecie_url,
               'dane', o.dane,
               'poprawna', o.poprawna,
               'czas_ms', o.czas_ms,
               'punkty', o.punkty,
               'ocena', o.ocena
             )
             order by o.ocena desc nulls last, o.czas_ms nulls last, g.nick
           )
      from public.gracze g
      left join public.odpowiedzi o on o.gracz_id = g.id and o.zadanie_id = v_z.id
     where g.sesja_id = v_s.id
       -- w finale tylko finaliści (kibice nie odpowiadali)
       and (v_s.finalisci is null or g.id = any (v_s.finalisci))
  ), '[]'::jsonb);
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
  v_jawne boolean;
  v_czas int;
  v_etap_id uuid;
  v_podp jsonb;
  v_ile_podp int;
  v_co_s numeric;
  v_widac int;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null then
    raise exception 'Nie ma gry o kodzie %', upper(trim(p_kod));
  end if;

  v_faza := wewn.faza_widoczna(v_s);
  v_jawne := wewn.odslania_poprawna(v_faza);

  if v_s.zadanie_nr > 0 then
    select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
    if v_z.id is not null then
      v_czas := wewn.czas_pytania(v_s, v_z.etap_id);

      -- podpowiedzi: pierwsza od startu pytania, kolejne co (czas / liczba) sekund, bez limitu co 10 s
      v_podp := coalesce(v_z.dane -> 'podpowiedzi', '[]'::jsonb);
      v_ile_podp := jsonb_array_length(v_podp);
      v_co_s := case when v_ile_podp = 0 then null when v_czas is null then 10 else v_czas::numeric / v_ile_podp end;
      v_widac := case
        when v_ile_podp = 0 then 0
        when v_jawne then v_ile_podp
        when v_faza = 'pytanie' then
          least(v_ile_podp, 1 + floor(extract(epoch from (clock_timestamp() - v_s.faza_od)) / v_co_s)::int)
        else 0
      end;

      v_zadanie := jsonb_build_object(
        'id', v_z.id,
        'nr', v_z.nr,
        'lp', (select count(*) from public.zadania where quiz_id = v_s.quiz_id and nr <= v_z.nr),
        'typ', v_z.typ,
        'tresc', v_z.tresc,
        'grafika_url', v_z.grafika_url,
        -- czas na odpowiedź: z etapu albo z ustawień gry (null: bez limitu)
        'czas_s', v_czas,
        'dane', case when v_jawne then v_z.dane - 'podpowiedzi' else v_z.dane - 'poprawna' - 'podpowiedzi' end,
        'podpowiedzi', (
          select coalesce(jsonb_agg(p.e order by p.i), '[]'::jsonb)
            from jsonb_array_elements(v_podp) with ordinality p(e, i)
           where p.i <= v_widac
        ),
        'liczba_podpowiedzi', v_ile_podp,
        'podpowiedzi_co_s', v_co_s
      );
      -- statystyki zdradzają poprawną, więc dopiero od fazy `wynik`
      if v_jawne then
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
          ),
          -- szacowanie: kto był najbliżej
          'najblizej', case when v_z.typ = 'szacowanie' then (
            select coalesce(jsonb_agg(jsonb_build_object('nick', t.nick, 'liczba', t.liczba) order by t.r), '[]'::jsonb)
              from (
                select g.nick, (o.dane ->> 'liczba')::numeric as liczba,
                       row_number() over (order by o.ocena desc, o.czas_ms) as r
                  from public.odpowiedzi o
                  join public.gracze g on g.id = o.gracz_id
                 where o.sesja_id = v_s.id and o.zadanie_id = v_z.id and o.ocena > 0
              ) t
             where t.r <= 3
          ) end
        );
      end if;
    end if;
  end if;

  -- etap do pokazania: na planszy etapu ten, który się zaczyna, potem etap bieżącego pytania
  if v_faza = 'etap' then
    select etap_id into v_etap_id
      from public.zadania
     where quiz_id = v_s.quiz_id and nr > v_s.zadanie_nr
     order by nr
     limit 1;
  else
    v_etap_id := v_z.etap_id;
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
    -- jak TV pokazuje ranking po pytaniu: tabela albo wyścig (wybiera prowadzący)
    'widok_rankingu', v_s.widok_rankingu,
    'max_graczy', v_s.max_graczy,
    'lokal', (
      select jsonb_build_object('nazwa', l.nazwa, 'miasto', l.miasto, 'logo_url', l.logo_url, 'instagram', l.instagram)
        from public.lokale l where l.id = v_s.lokal_id
    ),
    'quiz', (
      select jsonb_build_object(
        'tytul', q.tytul,
        'liczba_zadan', (select count(*) from public.zadania where quiz_id = q.id),
        'liczba_etapow', (select count(*) from public.etapy where quiz_id = q.id)
      )
        from public.quizy q where q.id = v_s.quiz_id
    ),
    'etap', case when v_etap_id is null then null else wewn.etap_json(v_etap_id, v_s) end,
    -- finał: kto odpowiada (null: wszyscy)
    'finalisci', case when v_s.finalisci is null then null else (
      select coalesce(jsonb_agg(jsonb_build_object('nick', g.nick, 'zdjecie', g.zdjecie_url)
                                order by array_position(v_s.finalisci, g.id)), '[]'::jsonb)
        from public.gracze g
       where g.id = any (v_s.finalisci)
    ) end,
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

create or replace function public.pilot_stan(p_kod text, p_host_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_z public.zadania;
  v_nast public.zadania;
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
  select * into v_nast
    from public.zadania
   where quiz_id = v_s.quiz_id and nr > v_s.zadanie_nr
   order by nr
   limit 1;

  return public.stan_sesji(v_s.kod) || jsonb_build_object(
    'poprawna', v_z.dane -> 'poprawna',
    -- prowadzący widzi wszystkie podpowiedzi od początku
    'wszystkie_podpowiedzi', coalesce(v_z.dane -> 'podpowiedzi', '[]'::jsonb),
    'liczba_odpowiedzi', (
      select count(*) from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id
    ),
    'ostatnie_zadanie', v_nast.id is null,
    'nastepne_typ', v_nast.typ,
    -- następne pytanie zaczyna nowy etap: przycisk „Następny etap”
    'nastepny_etap', case
      when v_s.faza <> 'etap' and v_nast.etap_id is not null and v_nast.etap_id is distinct from v_z.etap_id
        then wewn.etap_json(v_nast.etap_id, v_s)
    end
  );
end;
$$;
