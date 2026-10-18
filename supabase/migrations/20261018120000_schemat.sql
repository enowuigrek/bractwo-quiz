-- Bractwo Quiz: schemat, RLS i funkcje gry
--
-- Zasady (docs/PLAN.md, „Uczciwość i bezpieczeństwo”):
-- * Tabele są niedostępne publicznie (RLS bez zasad + odebrane uprawnienia).
--   Admin pisze kluczem serwisowym z Server Actions.
-- * Przeglądarka rozmawia z bazą tylko przez funkcje z sekcji „API publiczne”.
-- * Poprawna odpowiedź (klucz `poprawna` w `zadania.dane`) wychodzi dopiero od fazy `wynik`.
-- * Czas i punkty liczy baza.
-- * Zmiany stanu idą do TV i telefonów przez Realtime Broadcast, temat `sesja:<KOD>`.
--   Klient po zdarzeniu `stan` woła `stan_sesji`, więc w zdarzeniach nie ma nic tajnego.

-- Funkcje pomocnicze trzymamy w osobnym schemacie, którego PostgREST nie wystawia.
create schema if not exists wewn;
revoke all on schema wewn from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Pomocnicze: kody i tokeny
-- ---------------------------------------------------------------------------

create function wewn.losowy_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
$$;

-- Cztery litery bez I i O, żeby nie myliły się z 1 i 0.
-- Kod jest unikalny tylko wśród gier, które się nie skończyły.
create function wewn.nowy_kod()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_litery constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_kod text;
begin
  loop
    select string_agg(substr(v_litery, 1 + floor(random() * length(v_litery))::int, 1), '')
      into v_kod
      from generate_series(1, 4);
    exit when not exists (
      select 1 from public.sesje where kod = v_kod and faza <> 'koniec'
    );
  end loop;
  return v_kod;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tabele
-- ---------------------------------------------------------------------------

create table public.piwiarnie (
  id uuid primary key default gen_random_uuid(),
  nazwa text not null check (char_length(trim(nazwa)) > 0),
  miasto text,
  logo_url text,
  utworzono timestamptz not null default now()
);

create table public.quizy (
  id uuid primary key default gen_random_uuid(),
  tytul text not null check (char_length(trim(tytul)) > 0),
  opis text,
  utworzono timestamptz not null default now()
);

-- `typ` + `dane` pozwalają dokładać rodzaje zadań bez zmian w tabeli.
-- Konwencja: poprawna odpowiedź każdego typu siedzi w `dane.poprawna`.
--   wybor: { "odpowiedzi": ["A", "B", "C", "D"], "poprawna": 2 }
create table public.zadania (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizy (id) on delete cascade,
  nr int not null check (nr > 0),
  typ text not null default 'wybor',
  tresc text not null,
  grafika_url text,
  czas_s int not null default 20 check (czas_s between 5 and 300),
  dane jsonb not null default '{}'::jsonb,
  -- odroczone, żeby dało się zamieniać kolejność w jednej transakcji
  constraint zadania_quiz_nr_unikalny unique (quiz_id, nr) deferrable initially deferred
);

create table public.sesje (
  id uuid primary key default gen_random_uuid(),
  kod text not null default wewn.nowy_kod() check (kod ~ '^[A-Z]{4}$'),
  quiz_id uuid not null references public.quizy (id) on delete restrict,
  piwiarnia_id uuid references public.piwiarnie (id) on delete set null,
  okazja text,
  grafika_url text,
  tryb text not null default 'solo' check (tryb in ('solo', 'druzyny')),
  bonus_czas boolean not null default true,
  max_graczy int not null default 30 check (max_graczy between 1 and 500),
  -- `przygotuj` nie jest zapisywane: to faza `pytanie`, zanim minie `faza_od`
  faza text not null default 'poczekalnia'
    check (faza in ('poczekalnia', 'pytanie', 'wynik', 'ranking', 'podium', 'koniec')),
  zadanie_nr int not null default 0,
  faza_od timestamptz,
  faza_do timestamptz,
  host_token text not null default wewn.losowy_token(),
  utworzono timestamptz not null default now()
);

create unique index sesje_kod_aktywny on public.sesje (kod) where faza <> 'koniec';
create index sesje_kod on public.sesje (kod, utworzono desc);

create table public.gracze (
  id uuid primary key default gen_random_uuid(),
  sesja_id uuid not null references public.sesje (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 24),
  token text not null unique default wewn.losowy_token(),
  dolaczyl timestamptz not null default now()
);

create unique index gracze_nick_unikalny on public.gracze (sesja_id, lower(nick));

create table public.odpowiedzi (
  id uuid primary key default gen_random_uuid(),
  gracz_id uuid not null references public.gracze (id) on delete cascade,
  sesja_id uuid not null references public.sesje (id) on delete cascade,
  zadanie_id uuid not null references public.zadania (id) on delete cascade,
  dane jsonb not null,
  czas_ms int not null check (czas_ms >= 0),
  poprawna boolean not null,
  punkty int not null check (punkty >= 0),
  utworzono timestamptz not null default now(),
  unique (gracz_id, zadanie_id)
);

create index odpowiedzi_sesja_zadanie on public.odpowiedzi (sesja_id, zadanie_id);

-- RLS włączone wszędzie, bez żadnych zasad: anon i authenticated nie widzą nic.
-- Klucz serwisowy (panel admina) omija RLS.
alter table public.piwiarnie enable row level security;
alter table public.quizy enable row level security;
alter table public.zadania enable row level security;
alter table public.sesje enable row level security;
alter table public.gracze enable row level security;
alter table public.odpowiedzi enable row level security;

revoke all on public.piwiarnie, public.quizy, public.zadania, public.sesje, public.gracze, public.odpowiedzi
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Pomocnicze: logika gry
-- ---------------------------------------------------------------------------

-- Najnowsza gra o danym kodzie (kody wracają po zakończeniu gry).
create function wewn.sesja_po_kodzie(p_kod text)
returns public.sesje
language sql
stable
set search_path = ''
as $$
  select s.*
    from public.sesje s
   where s.kod = upper(trim(p_kod))
   order by (s.faza = 'koniec'), s.utworzono desc
   limit 1
$$;

-- Faza widziana przez klientów: `pytanie` przed `faza_od` to odliczanie `przygotuj`.
create function wewn.faza_widoczna(p_s public.sesje)
returns text
language sql
volatile
set search_path = ''
as $$
  select case
    when p_s.faza = 'pytanie' and clock_timestamp() < p_s.faza_od then 'przygotuj'
    else p_s.faza
  end
$$;

create function wewn.odslania_poprawna(p_faza text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_faza in ('wynik', 'ranking', 'podium', 'koniec')
$$;

-- Ocena odpowiedzi. Nowy typ zadania = nowa gałąź tutaj.
create function wewn.ocen(p_typ text, p_zadanie jsonb, p_odp jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_idx int;
begin
  if p_typ = 'wybor' then
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

-- Ranking z odpowiedzi na zadania o numerach <= p_do_nr. Remisy dzielą miejsce.
create function wewn.ranking(p_sesja_id uuid, p_do_nr int)
returns table (gracz_id uuid, nick text, punkty bigint, miejsce bigint)
language sql
stable
set search_path = ''
as $$
  select g.id,
         g.nick,
         coalesce(sum(o.punkty) filter (where z.nr <= p_do_nr), 0) as punkty,
         rank() over (order by coalesce(sum(o.punkty) filter (where z.nr <= p_do_nr), 0) desc) as miejsce
    from public.gracze g
    left join public.odpowiedzi o on o.gracz_id = g.id
    left join public.zadania z on z.id = o.zadanie_id
   where g.sesja_id = p_sesja_id
   group by g.id, g.nick
$$;

-- Do jakiego zadania ranking jest jawny. W trakcie pytania pokazujemy stan sprzed niego,
-- bo inaczej ranking zdradzałby, kto już trafił.
create function wewn.ranking_do_nr(p_s public.sesje)
returns int
language sql
stable
set search_path = ''
as $$
  select case when p_s.faza = 'pytanie' then p_s.zadanie_nr - 1 else p_s.zadanie_nr end
$$;

create function wewn.rozglos(p_kod text, p_zdarzenie text, p_dane jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(p_dane, p_zdarzenie, 'sesja:' || p_kod, false);
end;
$$;

create function wewn.po_zmianie_sesji()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.faza, new.zadanie_nr, new.faza_od, new.faza_do)
     is distinct from (old.faza, old.zadanie_nr, old.faza_od, old.faza_do) then
    perform wewn.rozglos(new.kod, 'stan', jsonb_build_object('faza', new.faza, 'zadanie_nr', new.zadanie_nr));
  end if;
  return null;
end;
$$;

create trigger sesje_rozglos
  after update on public.sesje
  for each row execute function wewn.po_zmianie_sesji();

create function wewn.po_dolaczeniu()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kod text;
  v_liczba int;
begin
  select kod into v_kod from public.sesje where id = new.sesja_id;
  select count(*) into v_liczba from public.gracze where sesja_id = new.sesja_id;
  perform wewn.rozglos(v_kod, 'gracz', jsonb_build_object('nick', new.nick, 'liczba', v_liczba));
  return null;
end;
$$;

create trigger gracze_rozglos
  after insert on public.gracze
  for each row execute function wewn.po_dolaczeniu();

-- ---------------------------------------------------------------------------
-- API publiczne (anon)
-- ---------------------------------------------------------------------------

-- Stan gry dla TV i telefonów. `teraz` służy do wyrównania zegara klienta.
create function public.stan_sesji(p_kod text)
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
        'czas_s', v_z.czas_s,
        'dane', case when wewn.odslania_poprawna(v_faza) then v_z.dane else v_z.dane - 'poprawna' end
      );
    end if;
  end if;

  return jsonb_build_object(
    'kod', v_s.kod,
    'tryb', v_s.tryb,
    'okazja', v_s.okazja,
    'grafika_url', v_s.grafika_url,
    'bonus_czas', v_s.bonus_czas,
    'max_graczy', v_s.max_graczy,
    'piwiarnia', (
      select jsonb_build_object('nazwa', p.nazwa, 'miasto', p.miasto, 'logo_url', p.logo_url)
        from public.piwiarnie p where p.id = v_s.piwiarnia_id
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
    'teraz', clock_timestamp()
  );
end;
$$;

-- Lista nicków do poczekalni na TV.
create function public.gracze_sesji(p_kod text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(g.nick order by g.dolaczyl), '[]'::jsonb)
    from public.gracze g
   where g.sesja_id = (wewn.sesja_po_kodzie(p_kod)).id
$$;

-- Dołączenie do gry. Z ważnym tokenem z localStorage zwraca istniejącego gracza.
create function public.dolacz(p_kod text, p_nick text, p_token text default null)
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

-- Zapis odpowiedzi. Baza bierze czas, ocenia i liczy punkty.
-- Nie zwraca, czy odpowiedź jest poprawna: to wychodzi dopiero w `moj_wynik` od fazy `wynik`.
create function public.zapisz_odpowiedz(p_token text, p_zadanie_id uuid, p_dane jsonb)
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
  if v_teraz > v_s.faza_do + interval '1 second' then
    return jsonb_build_object('przyjeta', false, 'powod', 'po_czasie');
  end if;

  if pg_column_size(p_dane) > 2000 then
    raise exception 'Nieprawidłowa odpowiedź';
  end if;

  v_limit_ms := v_z.czas_s * 1000;
  v_czas_ms := least(greatest(floor(extract(epoch from (v_teraz - v_s.faza_od)) * 1000)::int, 0), v_limit_ms);
  v_poprawna := wewn.ocen(v_z.typ, v_z.dane, p_dane);
  v_punkty := case
    when not v_poprawna then 0
    when v_s.bonus_czas then round(500 + 500 * (1 - v_czas_ms::numeric / v_limit_ms))::int
    else 1000
  end;

  insert into public.odpowiedzi (gracz_id, sesja_id, zadanie_id, dane, czas_ms, poprawna, punkty)
  values (v_g.id, v_s.id, v_z.id, p_dane, v_czas_ms, v_poprawna, v_punkty)
  on conflict (gracz_id, zadanie_id) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('przyjeta', false, 'powod', 'juz_odpowiedziano');
  end if;

  select count(*) into v_liczba from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id;
  perform wewn.rozglos(v_s.kod, 'odpowiedz', jsonb_build_object('liczba', v_liczba));

  return jsonb_build_object('przyjeta', true, 'czas_ms', v_czas_ms);
end;
$$;

-- Wynik gracza: jego odpowiedź na bieżące zadanie, suma punktów i miejsce.
-- Ocena i punkty za bieżące zadanie dopiero od fazy `wynik`.
create function public.moj_wynik(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_g public.gracze;
  v_s public.sesje;
  v_faza text;
  v_o public.odpowiedzi;
  v_r record;
  v_odp jsonb;
begin
  select * into v_g from public.gracze where token = p_token;
  if v_g.id is null then
    raise exception 'Nieznany gracz';
  end if;

  select * into v_s from public.sesje where id = v_g.sesja_id;
  v_faza := wewn.faza_widoczna(v_s);

  select o.* into v_o
    from public.odpowiedzi o
    join public.zadania z on z.id = o.zadanie_id
   where o.gracz_id = v_g.id and z.quiz_id = v_s.quiz_id and z.nr = v_s.zadanie_nr;

  if v_o.id is not null then
    v_odp := jsonb_build_object('dane', v_o.dane, 'czas_ms', v_o.czas_ms);
    if wewn.odslania_poprawna(v_faza) then
      v_odp := v_odp || jsonb_build_object('poprawna', v_o.poprawna, 'punkty', v_o.punkty);
    end if;
  end if;

  select r.punkty, r.miejsce into v_r
    from wewn.ranking(v_s.id, wewn.ranking_do_nr(v_s)) r
   where r.gracz_id = v_g.id;

  return jsonb_build_object(
    'kod', v_s.kod,
    'nick', v_g.nick,
    'faza', v_faza,
    'zadanie_nr', v_s.zadanie_nr,
    'odpowiedz', v_odp,
    'punkty', v_r.punkty,
    'miejsce', v_r.miejsce,
    'liczba_graczy', (select count(*) from public.gracze where sesja_id = v_s.id)
  );
end;
$$;

-- Ranking z poprzednim miejscem (do animacji przetasowań) i punktami za ostatnie zadanie.
create function public.ranking(p_kod text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_do int;
  v_poprz int;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null then
    raise exception 'Nie ma gry o kodzie %', upper(trim(p_kod));
  end if;
  -- ostatnie jawne zadanie i to przed nim (numeracja może mieć dziury)
  select coalesce(max(nr), 0) into v_do
    from public.zadania where quiz_id = v_s.quiz_id and nr <= wewn.ranking_do_nr(v_s);
  select coalesce(max(nr), 0) into v_poprz
    from public.zadania where quiz_id = v_s.quiz_id and nr < v_do;

  return coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'nick', t.nick,
               'punkty', t.punkty,
               'miejsce', t.miejsce,
               'poprzednie_miejsce', p.miejsce,
               'zdobyte', t.punkty - p.punkty
             )
             order by t.miejsce, t.nick
           )
      from wewn.ranking(v_s.id, v_do) t
      join wewn.ranking(v_s.id, v_poprz) p on p.gracz_id = t.gracz_id
  ), '[]'::jsonb);
end;
$$;

-- ---------------------------------------------------------------------------
-- API prowadzącego (pilot). Każda funkcja wymaga host_token.
-- ---------------------------------------------------------------------------

create function wewn.sesja_prowadzacego(p_kod text, p_host_token text)
returns public.sesje
language plpgsql
stable
set search_path = ''
as $$
declare
  v_s public.sesje;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null or v_s.host_token is distinct from p_host_token then
    raise exception 'Brak dostępu do pilota';
  end if;
  return v_s;
end;
$$;

-- Stan gry + to, co widzi tylko prowadzący: poprawna odpowiedź i licznik odpowiedzi.
create function public.pilot_stan(p_kod text, p_host_token text)
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

  return public.stan_sesji(v_s.kod) || jsonb_build_object(
    'poprawna', v_z.dane -> 'poprawna',
    'liczba_odpowiedzi', (
      select count(*) from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id
    ),
    'ostatnie_zadanie', not exists (
      select 1 from public.zadania where quiz_id = v_s.quiz_id and nr > v_s.zadanie_nr
    )
  );
end;
$$;

-- Akcje prowadzącego:
--   nastepne  poczekalnia | wynik | ranking → pytanie (albo podium po ostatnim zadaniu)
--   wynik     pytanie → wynik (kończy pytanie od razu, jeśli czas jeszcze leci)
--   ranking   wynik → ranking
--   podium    wynik | ranking → podium
--   koniec    dowolna → koniec
create function public.pilot_akcja(p_kod text, p_host_token text, p_akcja text)
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
      -- 3 s na `przygotuj`, potem pytanie trwa czas_s
      update public.sesje
         set faza = 'pytanie',
             zadanie_nr = v_nast.nr,
             faza_od = v_teraz + interval '3 seconds',
             faza_do = v_teraz + interval '3 seconds' + make_interval(secs => v_nast.czas_s)
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

-- ---------------------------------------------------------------------------
-- Uprawnienia do funkcji
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema wewn from public, anon, authenticated;
-- service_role (panel admina) potrzebuje ich do domyślnych wartości `kod` i `host_token`
grant usage on schema wewn to service_role;
grant execute on function wewn.nowy_kod(), wewn.losowy_token() to service_role;

revoke execute on function
  public.stan_sesji(text),
  public.gracze_sesji(text),
  public.dolacz(text, text, text),
  public.zapisz_odpowiedz(text, uuid, jsonb),
  public.moj_wynik(text),
  public.ranking(text),
  public.pilot_stan(text, text),
  public.pilot_akcja(text, text, text)
from public;

grant execute on function
  public.stan_sesji(text),
  public.gracze_sesji(text),
  public.dolacz(text, text, text),
  public.zapisz_odpowiedz(text, uuid, jsonb),
  public.moj_wynik(text),
  public.ranking(text),
  public.pilot_stan(text, text),
  public.pilot_akcja(text, text, text)
to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: logo piwiarni i grafiki. Publiczny odczyt, zapis tylko kluczem serwisowym.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('grafiki', 'grafiki', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;
