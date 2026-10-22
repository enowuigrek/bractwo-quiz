-- Selfie graczy (opcjonalne). Zapisuje i usuwa je serwer (/api/zdjecie) kluczem serwisowym:
-- gracz swoim tokenem, prowadzący kluczem pilota. Zdjęcia znikają po 7 dniach (/api/keepalive).
-- Funkcje gry zwracają adres zdjęcia przy nicku: lista graczy, ranking, odpowiedzi, mój wynik.

alter table public.gracze add column zdjecie_url text;

-- Lista graczy z zdjęciami do poczekalni (TV, pilot, telefon). Następca `gracze_sesji`,
-- który zostaje dla wersji aplikacji sprzed tej zmiany.
create function public.lista_graczy(p_kod text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('nick', g.nick, 'zdjecie', g.zdjecie_url) order by g.dolaczyl), '[]'::jsonb)
    from public.gracze g
   where g.sesja_id = (wewn.sesja_po_kodzie(p_kod)).id
$$;

revoke execute on function public.lista_graczy(text) from public;
grant execute on function public.lista_graczy(text) to anon, authenticated;

-- Nowe albo usunięte zdjęcie: TV i pilot odświeżają listę graczy (zdarzenie `gracz`).
create function wewn.po_zmianie_zdjecia()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kod text;
begin
  if new.zdjecie_url is not distinct from old.zdjecie_url then
    return null;
  end if;
  select kod into v_kod from public.sesje where id = new.sesja_id;
  perform wewn.rozglos(v_kod, 'gracz', jsonb_build_object('nick', new.nick));
  return null;
end;
$$;

revoke execute on function wewn.po_zmianie_zdjecia() from public, anon, authenticated;

create trigger gracze_rozglos_zdjecie
  after update of zdjecie_url on public.gracze
  for each row execute function wewn.po_zmianie_zdjecia();

-- Ranking z adresem zdjęcia.
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

-- Odpowiedzi na pytanie z adresem zdjęcia.
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
               'punkty', o.punkty
             )
             order by o.poprawna desc nulls last, o.czas_ms nulls last, g.nick
           )
      from public.gracze g
      left join public.odpowiedzi o on o.gracz_id = g.id and o.zadanie_id = v_z.id
     where g.sesja_id = v_s.id
  ), '[]'::jsonb);
end;
$$;

-- Mój wynik z adresem mojego zdjęcia.
create or replace function public.moj_wynik(p_token text)
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
    'zdjecie', v_g.zdjecie_url,
    'faza', v_faza,
    'zadanie_nr', v_s.zadanie_nr,
    'odpowiedz', v_odp,
    'punkty', v_r.punkty,
    'miejsce', v_r.miejsce,
    'liczba_graczy', (select count(*) from public.gracze where sesja_id = v_s.id)
  );
end;
$$;
