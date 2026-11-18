-- Pary z niepełnym połączeniem (18.11): telefon po końcu czasu wysyła to, co gracz zdążył połączyć, a niepołączone
-- jako -1. Ocena liczy tylko dobre pary (-1 nigdy nie trafia), więc punkty są cząstkowe jak dotąd. Reszta bez zmian.
do $$
declare
  v_oid oid;
  v_def text;
  v_stare text := $s$    v_odp := p_odp -> 'pary';
    if not wewn.indeksy_ok(v_odp, v_n, v_n, true) then$s$;
  v_nowe text := $s$    v_odp := p_odp -> 'pary';
    -- -1 = bez pary (niepełne połączenie po czasie); pozostałe indeksy prawej kolumny bez powtórzeń
    if jsonb_typeof(v_odp) is distinct from 'array' or jsonb_array_length(v_odp) <> v_n
       or exists (select 1 from jsonb_array_elements(v_odp) e
                   where jsonb_typeof(e) <> 'number' or e::text !~ '^-?[0-9]+$' or e::text::int < -1 or e::text::int >= v_n)
       or (select count(*) from jsonb_array_elements(v_odp) e where e::text <> '-1')
          <> (select count(distinct e::text) from jsonb_array_elements(v_odp) e where e::text <> '-1') then$s$;
begin
  select p.oid into v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'wewn' and p.proname = 'ocena';
  v_def := pg_get_functiondef(v_oid);
  if position(v_stare in v_def) = 0 then
    raise exception 'Nie znaleziono walidacji par w wewn.ocena';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;
