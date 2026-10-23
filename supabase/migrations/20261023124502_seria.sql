-- Etap „seria”: wszystkie pytania etapu naraz, każdy gracz odpowiada we własnym tempie, bez wyniku po
-- każdym pytaniu. Czas etapu (`etapy.czas_s`, domyślnie 60 s) to czas na całą serię. Punkty za dobrą
-- odpowiedź maleją z czasem od startu serii, więc liczy się trafność i tempo. TV pokazuje na żywo,
-- jak gracze zbliżają się do szklanki (każda dobra odpowiedź to krok). Seria kończy się, gdy wszyscy
-- odpowiedzą na wszystko albo minie czas; po ostatnim etapie od razu podium.

alter table public.etapy add column seria boolean not null default false;

-- etap trwającej serii (faza `seria`)
alter table public.sesje add column seria_etap uuid references public.etapy (id) on delete set null;

alter table public.sesje drop constraint sesje_faza_check;
alter table public.sesje add constraint sesje_faza_check check (
  faza in ('poczekalnia', 'etap', 'seria', 'pytanie', 'wynik', 'odpowiedzi', 'ranking', 'podium', 'tabela', 'koniec')
);

-- ---------------------------------------------------------------------------
-- Koniec serii
-- ---------------------------------------------------------------------------

create function wewn.zakoncz_serie(p_sesja_id uuid)
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
           else 'podium'
         end,
         zadanie_nr = coalesce(v_ostatnie, zadanie_nr),
         faza_od = clock_timestamp(),
         faza_do = null
   where id = v_s.id;
end;
$$;

-- Kończy serię, gdy minął czas albo wszyscy grający odpowiedzieli na wszystkie pytania etapu.
create function wewn.zamknij_serie_jesli_gotowe(p_sesja_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_teraz timestamptz := clock_timestamp();
  v_pytan int;
  v_brakuje int;
begin
  select * into v_s from public.sesje where id = p_sesja_id for update;
  if v_s.faza is distinct from 'seria' or v_teraz < v_s.faza_od then
    return;
  end if;
  select count(*) into v_pytan from public.zadania where etap_id = v_s.seria_etap;
  select count(*) into v_brakuje
    from public.gracze g
   where g.sesja_id = v_s.id
     and (v_s.finalisci is null or g.id = any (v_s.finalisci))
     and (select count(*) from public.odpowiedzi o join public.zadania z on z.id = o.zadanie_id
           where o.gracz_id = g.id and z.etap_id = v_s.seria_etap) < v_pytan;
  if v_brakuje = 0 or (v_s.faza_do is not null and v_teraz >= v_s.faza_do + interval '1 second') then
    perform wewn.zakoncz_serie(v_s.id);
  end if;
end;
$$;

revoke execute on function wewn.zakoncz_serie(uuid), wewn.zamknij_serie_jesli_gotowe(uuid)
  from public, anon, authenticated;

-- dokoncz_pytanie wołają TV, pilot i telefony po końcu czasu: teraz też dla serii
create or replace function public.dokoncz_pytanie(p_kod text)
returns void
language plpgsql
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
  if v_s.faza = 'seria' then
    perform wewn.zamknij_serie_jesli_gotowe(v_s.id);
  else
    perform wewn.zamknij_pytanie_jesli_gotowe(v_s.id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Telefon: pytania serii i odpowiedzi
-- ---------------------------------------------------------------------------

-- Pytania trwającej serii (bez rozwiązań) i te, na które gracz już odpowiedział. Dopiero od startu serii.
create function public.seria_pytania(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_g public.gracze;
  v_s public.sesje;
begin
  select * into v_g from public.gracze where token = p_token;
  if v_g.id is null then
    raise exception 'Nieznany gracz';
  end if;
  select * into v_s from public.sesje where id = v_g.sesja_id;
  if v_s.faza <> 'seria' or clock_timestamp() < v_s.faza_od then
    return jsonb_build_object('pytania', '[]'::jsonb, 'odpowiedziane', '[]'::jsonb);
  end if;
  return jsonb_build_object(
    'pytania', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', z.id, 'nr', z.nr, 'typ', z.typ, 'tresc', z.tresc, 'grafika_url', z.grafika_url,
               'dane', z.dane - 'poprawna' - 'podpowiedzi'
             ) order by z.nr)
        from public.zadania z where z.etap_id = v_s.seria_etap
    ), '[]'::jsonb),
    'odpowiedziane', coalesce((
      select jsonb_agg(o.zadanie_id)
        from public.odpowiedzi o join public.zadania z on z.id = o.zadanie_id
       where o.gracz_id = v_g.id and z.etap_id = v_s.seria_etap
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.seria_pytania(text) from public;
grant execute on function public.seria_pytania(text) to anon, authenticated;

create function public.zapisz_odpowiedz_serii(p_token text, p_zadanie_id uuid, p_dane jsonb)
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
  v_czas_ms int;
  v_limit_ms int;
  v_ocena numeric;
  v_baza numeric;
  v_id uuid;
begin
  select * into v_g from public.gracze where token = p_token;
  if v_g.id is null then
    raise exception 'Nieznany gracz';
  end if;
  select * into v_s from public.sesje where id = v_g.sesja_id;
  if v_s.faza <> 'seria' then
    return jsonb_build_object('przyjeta', false, 'powod', 'nie_teraz');
  end if;
  if v_s.finalisci is not null and not (v_g.id = any (v_s.finalisci)) then
    return jsonb_build_object('przyjeta', false, 'powod', 'kibic');
  end if;
  if v_teraz < v_s.faza_od then
    return jsonb_build_object('przyjeta', false, 'powod', 'za_wczesnie');
  end if;
  if v_s.faza_do is not null and v_teraz > v_s.faza_do + interval '1 second' then
    return jsonb_build_object('przyjeta', false, 'powod', 'po_czasie');
  end if;
  select * into v_z from public.zadania where id = p_zadanie_id and etap_id = v_s.seria_etap;
  if v_z.id is null then
    return jsonb_build_object('przyjeta', false, 'powod', 'inne_zadanie');
  end if;
  if pg_column_size(p_dane) > 2000 then
    raise exception 'Nieprawidłowa odpowiedź';
  end if;

  select * into v_e from public.etapy where id = v_s.seria_etap;
  -- czas od startu serii: im szybciej przez całą serię, tym więcej punktów za każdą dobrą
  v_czas_ms := greatest(floor(extract(epoch from (v_teraz - v_s.faza_od)) * 1000)::int, 0);
  v_limit_ms := greatest(1000, floor(extract(epoch from (v_s.faza_do - v_s.faza_od)) * 1000)::int);
  v_czas_ms := least(v_czas_ms, v_limit_ms);
  v_ocena := wewn.ocena(v_z.typ, v_z.dane, p_dane);
  v_baza := case when v_s.bonus_czas then 500 + 500 * (1 - v_czas_ms::numeric / v_limit_ms) else 1000 end;

  insert into public.odpowiedzi (gracz_id, sesja_id, zadanie_id, dane, czas_ms, poprawna, punkty, ocena)
  values (v_g.id, v_s.id, v_z.id, p_dane, v_czas_ms, v_ocena = 1,
          round(v_baza * v_ocena * coalesce(v_e.mnoznik, 1))::int, v_ocena)
  on conflict (gracz_id, zadanie_id) do nothing
  returning id into v_id;
  if v_id is null then
    return jsonb_build_object('przyjeta', false, 'powod', 'juz_odpowiedziano');
  end if;

  perform wewn.rozglos(v_s.kod, 'odpowiedz', jsonb_build_object('seria', true));
  perform wewn.zamknij_serie_jesli_gotowe(v_s.id);
  return jsonb_build_object('przyjeta', true, 'czas_ms', v_czas_ms);
end;
$$;

revoke execute on function public.zapisz_odpowiedz_serii(text, uuid, jsonb) from public;
grant execute on function public.zapisz_odpowiedz_serii(text, uuid, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Ranking: po serii „zdobyte” to punkty z całej serii, nie z ostatniego pytania
-- ---------------------------------------------------------------------------

create or replace function public.ranking(p_kod text)
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
  v_etap uuid;
  v_seria boolean;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null then
    raise exception 'Nie ma gry o kodzie %', upper(trim(p_kod));
  end if;
  -- ostatnie jawne zadanie i to przed nim (numeracja może mieć dziury)
  select coalesce(max(nr), 0) into v_do
    from public.zadania where quiz_id = v_s.quiz_id and nr <= wewn.ranking_do_nr(v_s);
  select z.etap_id, coalesce(e.seria, false) into v_etap, v_seria
    from public.zadania z left join public.etapy e on e.id = z.etap_id
   where z.quiz_id = v_s.quiz_id and z.nr = v_do;
  if v_seria then
    select coalesce(max(nr), 0) into v_poprz
      from public.zadania
     where quiz_id = v_s.quiz_id and nr < (select min(nr) from public.zadania where etap_id = v_etap);
  else
    select coalesce(max(nr), 0) into v_poprz
      from public.zadania where quiz_id = v_s.quiz_id and nr < v_do;
  end if;

  return coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'nick', t.nick,
               'zdjecie', g.zdjecie_url,
               'punkty', t.punkty,
               'miejsce', t.miejsce,
               'poprzednie_miejsce', p.miejsce,
               'zdobyte', t.punkty - p.punkty
             )
             order by t.miejsce, t.nick
           )
      from wewn.ranking(v_s.id, v_do) t
      join wewn.ranking(v_s.id, v_poprz) p on p.gracz_id = t.gracz_id
      join public.gracze g on g.id = t.gracz_id
  ), '[]'::jsonb);
end;
$$;

-- ---------------------------------------------------------------------------
-- Etap: znacznik serii; pilot startuje serię z planszy etapu, „wynik” kończy ją wcześniej
-- ---------------------------------------------------------------------------

create or replace function wewn.etap_json(p_etap_id uuid, p_s public.sesje)
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
    -- w serii: czas na całą serię (domyślnie 60 s)
    'czas_s', case when e.seria then coalesce(e.czas_s, 60) else coalesce(e.czas_s, p_s.czas_s) end,
    'finalowy', e.finalowy,
    'seria', e.seria,
    'final_po_etapie', exists (
      select 1 from public.etapy n where n.quiz_id = e.quiz_id and n.nr = e.nr + 1 and n.finalowy
    ),
    'final_dalej', exists (
      select 1 from public.etapy n where n.quiz_id = e.quiz_id and n.nr > e.nr and n.finalowy
    ),
    'liczba_pytan', (select count(*) from public.zadania where etap_id = e.id),
    'typy', (
      select coalesce(jsonb_agg(t.typ order by t.pierwszy), '[]'::jsonb)
        from (select typ, min(nr) as pierwszy from public.zadania where etap_id = e.id group by typ) t
    )
  )
    from public.etapy e
   where e.id = p_etap_id
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
  if v_faza = 'seria' then
    v_etap_id := v_s.seria_etap;
  elsif v_faza = 'etap' then
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
    -- seria na żywo: ile każdy grający już odpowiedział i ile trafił (TV przesuwa awatary)
    'seria', case when v_faza = 'seria' then (
      select coalesce(jsonb_agg(jsonb_build_object(
               'nick', g.nick, 'zdjecie', g.zdjecie_url,
               'odpowiedzi', (select count(*) from public.odpowiedzi o join public.zadania z on z.id = o.zadanie_id
                               where o.gracz_id = g.id and z.etap_id = v_s.seria_etap),
               'dobre', (select coalesce(sum(o.ocena), 0) from public.odpowiedzi o join public.zadania z on z.id = o.zadanie_id
                          where o.gracz_id = g.id and z.etap_id = v_s.seria_etap)
             ) order by g.dolaczyl), '[]'::jsonb)
        from public.gracze g
       where g.sesja_id = v_s.id and (v_s.finalisci is null or g.id = any (v_s.finalisci))
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
