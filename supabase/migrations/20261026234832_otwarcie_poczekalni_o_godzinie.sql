-- Gra zapowiedziana z automatem (27.10, Łukasz): o godzinie z kreatora otwiera się poczekalnia, a quiz startuje sam
-- 5 minut później (src/lib/gra/auto.ts). Wcześniej (26.10) poczekalnia otwierała się 5 minut przed tą godziną.
do $$
declare
  d text := pg_get_functiondef('wewn.otworz_o_czasie(uuid)'::regprocedure);
  stare text := $a$and planowany_start - interval '5 minutes' <= clock_timestamp();$a$;
begin
  if position(stare in d) = 0 then raise exception 'otworz_o_czasie: nie ma warunku godziny'; end if;
  execute replace(d, stare, $a$and planowany_start <= clock_timestamp();$a$);
end $$;
