-- Nagrody za miejsca, ustawiane przy uruchamianiu gry.
-- `sesje.nagrody`: null (bez nagród) albo tablica [{ "miejsce": 1, "nagroda": "Piwo gratis", "instrukcja": "Pokaż ten ekran barmanowi" }],
-- tylko 1. miejsce albo pierwsza trójka. `instrukcja` może być null.

alter table public.sesje add column nagrody jsonb
  check (nagrody is null or (jsonb_typeof(nagrody) = 'array' and jsonb_array_length(nagrody) between 1 and 3));

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
