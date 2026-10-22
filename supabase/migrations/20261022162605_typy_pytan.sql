-- Nowe typy pytań: wielokrotny wybór, kolejność, pary. Punktacja częściowa.
--
-- Konwencja bez zmian: rozwiązanie każdego typu jest w `dane.poprawna` (ukryte do fazy `wynik`).
--   wybor        { odpowiedzi: [..], poprawna: 2 }                      odpowiedź { odpowiedz: 2 }
--   wielokrotny  { odpowiedzi: [..], poprawna: [0, 3] }                 odpowiedź { odpowiedzi: [0, 2] }
--   kolejnosc    { elementy: [..pomieszane..], poprawna: [2, 0, 1] }    odpowiedź { kolejnosc: [2, 1, 0] }
--                (poprawna = indeksy elementów we właściwej kolejności)
--   pary         { lewe: [..], prawe: [..pomieszane..], poprawna: [1, 0, 2] }  odpowiedź { pary: [1, 2, 0] }
--                (poprawna[i] = indeks prawego dla i-tego lewego)
--
-- Ocena 0..1: wielokrotny (trafione − błędnie zaznaczone) / liczba poprawnych, nie mniej niż 0;
-- kolejność i pary: część na właściwym miejscu. Punkty = punkty pytania × ocena.
-- `odpowiedzi.poprawna` = pełna ocena, `odpowiedzi.ocena` = ułamek (do „3/4” na ekranach).

alter table public.odpowiedzi add column ocena numeric check (ocena between 0 and 1);
update public.odpowiedzi set ocena = case when poprawna then 1 else 0 end where ocena is null;

-- Tablica indeksów 0..n-1 (liczby całkowite). `p_dlugosc`: wymagana długość albo null; `p_unikalne`: bez powtórzeń.
create function wewn.indeksy_ok(p_tab jsonb, p_n int, p_dlugosc int, p_unikalne boolean)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_tab) = 'array'
     and jsonb_array_length(p_tab) between 1 and p_n
     and (p_dlugosc is null or jsonb_array_length(p_tab) = p_dlugosc)
     and not exists (
       select 1 from jsonb_array_elements(p_tab) e
        where jsonb_typeof(e) <> 'number'
           or (e #>> '{}')::numeric <> floor((e #>> '{}')::numeric)
           or (e #>> '{}')::numeric < 0
           or (e #>> '{}')::numeric >= p_n
     )
     and (not p_unikalne or (select count(distinct (e #>> '{}')::numeric) from jsonb_array_elements(p_tab) e) = jsonb_array_length(p_tab))
$$;

-- Ocena odpowiedzi 0..1. Nowy typ zadania = nowa gałąź tutaj.
create function wewn.ocena(p_typ text, p_zadanie jsonb, p_odp jsonb)
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
begin
  if p_typ = 'wybor' then
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

  if p_typ in ('kolejnosc', 'pary') then
    v_n := jsonb_array_length(p_zadanie -> case when p_typ = 'kolejnosc' then 'elementy' else 'lewe' end);
    v_odp := p_odp -> case when p_typ = 'kolejnosc' then 'kolejnosc' else 'pary' end;
    if not wewn.indeksy_ok(v_odp, v_n, v_n, true) then
      raise exception 'Nieprawidłowa odpowiedź';
    end if;
    select count(*) into v_traf
      from generate_series(0, v_n - 1) i
     where (v_odp -> i) = (p_zadanie -> 'poprawna' -> i);
    return v_traf::numeric / v_n;
  end if;

  raise exception 'Nieznany typ zadania: %', p_typ;
end;
$$;

revoke execute on function wewn.indeksy_ok(jsonb, int, int, boolean), wewn.ocena(text, jsonb, jsonb) from public, anon, authenticated;

-- Rozkład odpowiedzi: wybór i wielokrotny wybór (ile osób zaznaczyło każdą odpowiedź), reszta null.
create or replace function wewn.rozklad(p_typ text, p_zadanie jsonb, p_sesja_id uuid, p_zadanie_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select case
    when p_typ = 'wybor' then (
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
  end
$$;

-- Zapis odpowiedzi z oceną częściową.
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
  -- ocena 0..1 (częściowa w nowych typach); „poprawna” tylko przy pełnej
  v_ocena := wewn.ocena(v_z.typ, v_z.dane, p_dane);
  v_poprawna := v_ocena = 1;

  -- punkty pytania: bez limitu 1000, z bonusem 500–1000 zależnie od czasu, bez bonusu 1000
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


-- Odpowiedzi na pytanie z oceną (do „3/4” na ekranie odpowiedzi).
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
  ), '[]'::jsonb);
end;
$$;
