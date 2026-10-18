-- Dzień 4: rozgrywka pytań.
-- * `stan_sesji` zwraca licznik odpowiedzi na bieżące zadanie (bez ujawniania, kto i co),
--   a od fazy `wynik` także rozkład odpowiedzi, liczbę poprawnych i najszybszą poprawną.
-- * `zapisz_odpowiedz` kończy czas pytania, gdy odpowiedzieli wszyscy gracze.

-- Rozkład odpowiedzi na zadanie. Nowy typ zadania = nowa gałąź tutaj (inne typy: null).
create function wewn.rozklad(p_typ text, p_zadanie jsonb, p_sesja_id uuid, p_zadanie_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select case when p_typ = 'wybor' then (
    select coalesce(jsonb_agg(coalesce(c.n, 0) order by i), '[]'::jsonb)
      from generate_series(0, jsonb_array_length(p_zadanie -> 'odpowiedzi') - 1) i
      left join (
        select (o.dane ->> 'odpowiedz')::int as idx, count(*) as n
          from public.odpowiedzi o
         where o.sesja_id = p_sesja_id and o.zadanie_id = p_zadanie_id
         group by 1
      ) c on c.idx = i
  ) end
$$;

revoke execute on function wewn.rozklad(text, jsonb, uuid, uuid) from public, anon, authenticated;

-- Stan gry dla TV i telefonów. `teraz` służy do wyrównania zegara klienta.
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
        'czas_s', v_z.czas_s,
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
    'max_graczy', v_s.max_graczy,
    'lokal', (
      select jsonb_build_object('nazwa', l.nazwa, 'miasto', l.miasto, 'logo_url', l.logo_url)
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

-- Zapis odpowiedzi. Baza bierze czas, ocenia i liczy punkty.
-- Nie zwraca, czy odpowiedź jest poprawna: to wychodzi dopiero w `moj_wynik` od fazy `wynik`.
-- Gdy odpowiedzieli wszyscy gracze, czas pytania kończy się od razu (`faza_do` = teraz).
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

  -- wszyscy odpowiedzieli: koniec czasu (wyzwalacz roześle `stan`)
  if v_liczba >= (select count(*) from public.gracze where sesja_id = v_s.id) then
    update public.sesje
       set faza_do = v_teraz
     where id = v_s.id and faza = 'pytanie' and zadanie_nr = v_z.nr and faza_do > v_teraz;
  end if;

  return jsonb_build_object('przyjeta', true, 'czas_ms', v_czas_ms);
end;
$$;
