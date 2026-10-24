-- Koniec pijanego finału zostawia 7 s na wideo pękającej szklanki na TV (src/lib/pijany.ts: WYLEWANIE_S):
-- gracz, który skończył pytania, i przycisk pilota nie dają już od razu werbli, tylko skracają dogrywkę
-- do 7 s. Werble przychodzą po czasie przez `dokoncz_pytanie`, jak przy zwykłym końcu.
create or replace function public.zakoncz_pijany(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sesja uuid;
  v_koniec timestamptz := clock_timestamp() + interval '7 seconds';
begin
  select sesja_id into v_sesja from public.gracze where token = p_token;
  if v_sesja is null then
    raise exception 'Nieznany gracz';
  end if;
  update public.sesje
     set faza_do = least(coalesce(faza_do, v_koniec), v_koniec)
   where id = v_sesja and faza = 'pijany';
end;
$$;

-- `pilot_akcja('werble')`: podmiana jednego fragmentu (cała funkcja jest długa).
do $$
declare
  v_def text := pg_get_functiondef('public.pilot_akcja(text, text, text)'::regprocedure);
  v_stare text := '    update public.sesje set faza = ''werble'', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = ''plansze''';
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'pilot_akcja: nie znalazłem akcji werble';
  end if;
  execute replace(v_def, v_stare,
    '    -- 7 s na wideo pękającej szklanki, potem werble przez dokoncz_pytanie
    update public.sesje
       set faza_do = least(coalesce(faza_do, v_teraz + interval ''7 seconds''), v_teraz + interval ''7 seconds'')
     where id = v_s.id;

  elsif p_akcja = ''plansze''');
end;
$$;
