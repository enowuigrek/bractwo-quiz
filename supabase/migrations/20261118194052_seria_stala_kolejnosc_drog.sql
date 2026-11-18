-- Seria (finał): stała kolejność graczy, więc i dróg na TV (18.11). Było `order by g.dolaczyl`, a gracze dołączeni
-- w tej samej chwili (boty, ale też remis co do mikrosekundy) przy każdym odświeżeniu stawali w innej kolejności i
-- awatary skakały między drogami. Teraz kolejność finalistów z wyboru (`sesje.finalisci`), potem dołączenie i id.
do $$
declare
  v_def text := pg_get_functiondef('public.stan_sesji'::regproc);
  v_stare text := ') order by g.dolaczyl), ''[]''::jsonb)';
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono kolejności serii';
  end if;
  execute replace(v_def, v_stare, ') order by array_position(v_s.finalisci, g.id), g.dolaczyl, g.id), ''[]''::jsonb)');
end;
$$;
