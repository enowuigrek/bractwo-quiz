-- Punkty po teście 27.10 (Łukasz):
-- * szybkość waży więcej: punkty spadają z 1000 do 200 (było do 500), a bez limitu czasu przez 30 s przy jednej
--   dobrej (było 20 s) i 60 s przy kilku dobrych, kolejności i parach (było 40 s); 10 s różnicy to ok. 270 / 135 pkt
--   przed mnożnikiem, a dwie wolne odpowiedzi też się różnią. Z limitem czasu tak samo, przez cały limit.
-- * finał (seria w etapie finałowym): dobra odpowiedź +500, zła −500, bez szybkości i mnożnika, jak krok wyścigu
--   naprzód albo w tył. Było do 2000 za dobrą, więc przegrany wyścigu miewał na podium więcej punktów.
do $$
declare
  d text;
  stare text;
begin
  d := pg_get_functiondef('wewn.punkty_odpowiedzi(text,numeric,integer,integer,boolean,numeric)'::regprocedure);
  stare := $a$p_ocena * case when p_bonus then 500 + 500 * (1 - least(p_czas_ms, p_limit_ms)::numeric / p_limit_ms) else 1000 end$a$;
  if position(stare in d) = 0 then raise exception 'punkty_odpowiedzi: nie ma wzoru'; end if;
  execute replace(d, stare, $a$p_ocena * case when p_bonus then 200 + 800 * (1 - least(p_czas_ms, p_limit_ms)::numeric / p_limit_ms) else 1000 end$a$);

  d := pg_get_functiondef('wewn.okno_bez_limitu_ms(text)'::regprocedure);
  stare := $a$then 40000 else 20000 end$a$;
  if position(stare in d) = 0 then raise exception 'okno_bez_limitu_ms: nie ma okien'; end if;
  execute replace(d, stare, $a$then 60000 else 30000 end$a$);

  d := pg_get_functiondef('public.zapisz_odpowiedz_serii(text,uuid,jsonb)'::regprocedure);
  stare := $a$round(v_baza * v_ocena * coalesce(v_e.mnoznik, 1))::int, v_ocena)$a$;
  if position(stare in d) = 0 then raise exception 'zapisz_odpowiedz_serii: nie ma punktów'; end if;
  execute replace(d, stare, $a$case when v_e.finalowy then case when v_ocena >= 1 then 500 else -500 end
               else round(v_baza * v_ocena * coalesce(v_e.mnoznik, 1))::int end, v_ocena)$a$);
end $$;

-- zła odpowiedź w finale odbiera punkty
alter table public.odpowiedzi drop constraint odpowiedzi_punkty_check;
alter table public.odpowiedzi add constraint odpowiedzi_punkty_check check (punkty >= -1000);
