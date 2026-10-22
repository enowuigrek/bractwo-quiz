-- Odbiór nagrody: zwycięzca pokazuje kartę nagrody obsłudze, a barman klika „Potwierdź odbiór”.
-- Od tej chwili karta pokazuje „ODEBRANA” z godziną, więc ten sam ekran nie zadziała drugi raz.

alter table public.gracze add column nagroda_odebrana timestamptz;

-- Potwierdzenie odbioru tokenem gracza. Tylko gdy gra jest po podium, a gracz ma nagradzane miejsce.
-- Drugie kliknięcie niczego nie zmienia (zostaje pierwsza godzina).
create function public.odbierz_nagrode(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_g public.gracze;
  v_s public.sesje;
  v_miejsce bigint;
begin
  select * into v_g from public.gracze where token = p_token for update;
  if v_g.id is null then
    raise exception 'Nieznany gracz';
  end if;
  select * into v_s from public.sesje where id = v_g.sesja_id;
  if v_s.faza not in ('podium', 'tabela', 'koniec') then
    raise exception 'Nagrody wydajemy dopiero po ogłoszeniu wyników';
  end if;

  select r.miejsce into v_miejsce
    from wewn.ranking(v_s.id, wewn.ranking_do_nr(v_s)) r
   where r.gracz_id = v_g.id;
  if v_s.nagrody is null or not exists (
    select 1 from jsonb_array_elements(v_s.nagrody) n where (n ->> 'miejsce')::int = v_miejsce
  ) then
    raise exception 'To miejsce nie ma nagrody';
  end if;

  if v_g.nagroda_odebrana is null then
    update public.gracze set nagroda_odebrana = clock_timestamp() where id = v_g.id
    returning * into v_g;
  end if;
  return jsonb_build_object('odebrana', v_g.nagroda_odebrana);
end;
$$;

revoke execute on function public.odbierz_nagrode(text) from public;
grant execute on function public.odbierz_nagrode(text) to anon, authenticated;

-- Mój wynik z informacją o odebranej nagrodzie.
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
      v_odp := v_odp || jsonb_build_object('poprawna', v_o.poprawna, 'punkty', v_o.punkty, 'ocena', v_o.ocena);
    end if;
  end if;

  select r.punkty, r.miejsce into v_r
    from wewn.ranking(v_s.id, wewn.ranking_do_nr(v_s)) r
   where r.gracz_id = v_g.id;

  return jsonb_build_object(
    'kod', v_s.kod,
    'nick', v_g.nick,
    'zdjecie', v_g.zdjecie_url,
    'nagroda_odebrana', v_g.nagroda_odebrana,
    'faza', v_faza,
    'zadanie_nr', v_s.zadanie_nr,
    'odpowiedz', v_odp,
    'punkty', v_r.punkty,
    'miejsce', v_r.miejsce,
    'liczba_graczy', (select count(*) from public.gracze where sesja_id = v_s.id)
  );
end;
$$;
