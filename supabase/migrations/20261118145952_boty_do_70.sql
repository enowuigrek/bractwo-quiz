-- Boty do testów dużych gier (18.11, limit graczy 70): do 70 naraz; po 20 imionach kolejne jako „Gość 1 Bot”,
-- „Gość 2 Bot”… Reszta funkcji bez zmian.
do $$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid into v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'dodaj_boty';
  v_def := pg_get_functiondef(v_oid);
  if position('p_ile > 20' in v_def) = 0 or position($s$'Tadek', 'Irena'])$s$ in v_def) = 0 then
    raise exception 'dodaj_boty: nie pasuje do oczekiwanej wersji';
  end if;
  v_def := replace(v_def, 'p_ile > 20', 'p_ile > 70');
  v_def := replace(v_def, 'od 1 do 20 naraz', 'od 1 do 70 naraz');
  v_def := replace(v_def, $s$'Tadek', 'Irena'])$s$,
                   $s$'Tadek', 'Irena'] || array(select 'Gość ' || g from generate_series(1, 60) g))$s$);
  execute v_def;
end $$;
