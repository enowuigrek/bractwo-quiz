-- Kolejność liczona po sąsiadach: część dobrze ułożonych par kolejnych elementów (n − 1 par),
-- zamiast elementów na dokładnie swoim miejscu. Przesunięcie wszystkiego o jeden nie daje już zera.
-- Pozostałe typy bez zmian. Odpowiedzi zapisane wcześniej mają już policzoną ocenę.
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

  raise exception 'Nieznany typ zadania: %', p_typ;
end;
$$;
