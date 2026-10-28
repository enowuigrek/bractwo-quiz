-- Odpadanie procentowe (28.10, Łukasz): po pierwszym etapie nikt nie odpada (rozgrzewka), po przedostatnim etapie
-- przed walką o finał przechodzi 80% grających (w górę), po etapie przed walką połowa (w górę), a po walce trójka
-- (to robi finał trójki). Cięcie tylko wtedy, gdy kogoś wyrzuca i zostaje więcej niż 3 osoby. Było: do 8 graczy
-- nikt, od 9 po etapie 3 zawsze 6, od 16 po etapie 2 połowa (co najmniej 8).
create or replace function wewn.progi_domyslne(p_sesja_id uuid)
 returns jsonb
 language plpgsql
 stable
 set search_path to ''
as $function$
declare
  v_n int;
  v_walka int;
  v_po int;
  v_wynik jsonb := '{}'::jsonb;
begin
  select count(*) into v_n from public.gracze where sesja_id = p_sesja_id;
  select min(e.nr) - 1 into v_walka
    from public.etapy e join public.sesje s on s.quiz_id = e.quiz_id
   where s.id = p_sesja_id and e.finalowy;
  if v_walka is null or v_walka < 2 then
    return v_wynik;
  end if;
  -- 80% po etapie walka-2 (nie po pierwszym etapie)
  if v_walka - 2 >= 2 then
    v_po := ceil(v_n * 0.8)::int;
    if v_po < v_n and v_po > 3 then
      v_wynik := v_wynik || jsonb_build_object((v_walka - 2)::text, v_po);
      v_n := v_po;
    end if;
  end if;
  -- połowa po etapie walka-1 (też nie po pierwszym)
  if v_walka - 1 >= 2 then
    v_po := ceil(v_n / 2.0)::int;
    if v_po < v_n and v_po > 3 then
      v_wynik := v_wynik || jsonb_build_object((v_walka - 1)::text, v_po);
    end if;
  end if;
  return v_wynik;
end;
$function$;
