-- Boty do testów (26.10): można je dodać, zanim prowadzący otworzy poczekalnię (czekają w grze), a dodaje je tylko
-- główny admin przez serwer Next (src/app/pilot/[kod]/akcje.ts, klucz serwisowy). `dolacz` przepuszcza zamkniętą
-- poczekalnię tylko w trakcie `dodaj_boty` (flaga transakcji `bq.dodaje_boty`).
do $$
declare
  d text;
  stare text := $a$if not v_s.poczekalnia_otwarta and not wewn.otworz_o_czasie(v_s.id) then$a$;
  nowe text := $a$if not v_s.poczekalnia_otwarta and not wewn.otworz_o_czasie(v_s.id)
     and coalesce(current_setting('bq.dodaje_boty', true), '') <> 'tak' then$a$;
begin
  d := pg_get_functiondef('public.dolacz(text,text,text)'::regprocedure);
  if position(stare in d) = 0 then raise exception 'Nie ma fragmentu w dolacz'; end if;
  execute replace(d, stare, nowe);

  d := pg_get_functiondef('public.dodaj_boty(text,text,integer)'::regprocedure);
  stare := $a$  for v_imie in$a$;
  nowe := $a$  perform set_config('bq.dodaje_boty', 'tak', true);
  for v_imie in$a$;
  if position(stare in d) = 0 then raise exception 'Nie ma fragmentu w dodaj_boty'; end if;
  d := replace(d, stare, nowe);
  stare := $a$  perform wewn.rozglos(v_s.kod, 'stan', '{}'::jsonb);$a$;
  nowe := $a$  perform set_config('bq.dodaje_boty', '', true);
  perform wewn.rozglos(v_s.kod, 'stan', '{}'::jsonb);$a$;
  if position(stare in d) = 0 then raise exception 'Nie ma końca w dodaj_boty'; end if;
  execute replace(d, stare, nowe);
end $$;

revoke execute on function public.dodaj_boty(text, text, integer) from public, anon, authenticated;
grant execute on function public.dodaj_boty(text, text, integer) to service_role;
