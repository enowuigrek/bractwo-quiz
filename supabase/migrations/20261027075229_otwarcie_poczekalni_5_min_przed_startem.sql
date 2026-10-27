-- Cofnięcie zmiany z 27.10 w nocy (Łukasz): przy automacie godzina z kreatora to znowu start quizu, a poczekalnia
-- otwiera się 5 minut wcześniej (jak 26.10). Gra bez automatu czeka, aż prowadzący otworzy poczekalnię.
do $$
declare
  d text := pg_get_functiondef('wewn.otworz_o_czasie(uuid)'::regprocedure);
  stare text := $a$and planowany_start <= clock_timestamp();$a$;
begin
  if position(stare in d) = 0 then raise exception 'otworz_o_czasie: nie ma warunku godziny'; end if;
  execute replace(d, stare, $a$and planowany_start - interval '5 minutes' <= clock_timestamp();$a$);
end $$;
