-- Muzyka na TV (opcjonalna): przełącznik w pilocie, domyślnie wyłączona. TV gra utwory z public/muzyka/
-- zależnie od fazy i etapu (src/app/ekran/_ekran/muzyka.tsx). Telefony nie grają.
alter table public.sesje add column muzyka boolean not null default false;

-- `stan_sesji`: pole `muzyka` (podmiana fragmentu, cała funkcja jest długa).
do $$
declare
  v_def text := pg_get_functiondef('public.stan_sesji(text)'::regprocedure);
  v_stare text := '''pijany_final'', v_s.pijany_final,';
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'stan_sesji: nie znalazłem miejsca na pole muzyka';
  end if;
  execute replace(v_def, v_stare, '''pijany_final'', v_s.pijany_final, ''muzyka'', v_s.muzyka,');
end;
$$;

-- `pilot_akcja('muzyka')`: włącza albo wyłącza muzykę w każdej fazie.
do $$
declare
  v_def text := pg_get_functiondef('public.pilot_akcja(text, text, text)'::regprocedure);
  v_stare text := '  elsif p_akcja = ''plansze'' and v_s.faza = ''koniec'' then';
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'pilot_akcja: nie znalazłem miejsca na akcję muzyka';
  end if;
  execute replace(v_def, v_stare,
    '  elsif p_akcja = ''muzyka'' then
    update public.sesje set muzyka = not muzyka where id = v_s.id;

' || v_stare);
end;
$$;
