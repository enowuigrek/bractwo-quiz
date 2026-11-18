-- Kolejność niepełna (18.11): telefon po końcu czasu wysyła to, co gracz zdążył ułożyć (od 1 do wszystkich
-- elementów, bez powtórzeń). Ocena jak dotąd: dobrze ułożone sąsiednie pary z tego, co ułożone, przez wszystkie pary.
do $$
declare
  v_oid oid;
  v_def text;
  v_stare text := $s$    v_odp := p_odp -> 'kolejnosc';
    if not wewn.indeksy_ok(v_odp, v_n, v_n, true) then$s$;
  v_nowe text := $s$    v_odp := p_odp -> 'kolejnosc';
    -- niepełna kolejność po czasie: od 1 elementu, bez powtórzeń
    if not wewn.indeksy_ok(v_odp, v_n, null, true) or jsonb_array_length(v_odp) < 1 then$s$;
begin
  select p.oid into v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'wewn' and p.proname = 'ocena';
  v_def := pg_get_functiondef(v_oid);
  if position(v_stare in v_def) = 0 then
    raise exception 'Nie znaleziono walidacji kolejności w wewn.ocena';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;
