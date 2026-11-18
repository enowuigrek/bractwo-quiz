-- Wyjaśnienie poprawnej odpowiedzi (`zadania.dane.wyjasnienie`, 18.11, quiz JOWES) zdradza odpowiedź, więc przed
-- fazą wyniku znika z danych pytania tak samo jak `poprawna` (stan_sesji i pytania serii).
do $$
declare
  v_oid oid;
  v_def text;
begin
  for v_oid in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public' and p.proname in ('stan_sesji', 'seria_pytania')
  loop
    v_def := pg_get_functiondef(v_oid);
    if position('''wyjasnienie''' in v_def) = 0 then
      v_def := replace(v_def, '- ''poprawna'' - ''poprawna_do'' - ''podpowiedzi''',
                              '- ''poprawna'' - ''poprawna_do'' - ''podpowiedzi'' - ''wyjasnienie''');
      execute v_def;
    end if;
  end loop;
end $$;
