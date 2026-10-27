-- Finał bez punktów (27.10, Łukasz): punkty z etapów zamieniają się na pozycję startową (przewaga 0–3 kroki),
-- a w finale liczy się już tylko wyścig. Odpowiedzi w serii etapu finałowego dają 0 pkt (było ±500), a podium
-- pokazuje przy finalistach miejsce w wyścigu zamiast punktów. Opis etapu finałowego mówi o tym przed startem.
do $$
declare
  d text := pg_get_functiondef('public.zapisz_odpowiedz_serii(text,uuid,jsonb)'::regprocedure);
  stare text := $a$case when v_e.finalowy then case when v_ocena >= 1 then 500 else -500 end$a$;
begin
  if position(stare in d) = 0 then raise exception 'zapisz_odpowiedz_serii: nie ma punktów finału'; end if;
  execute replace(d, stare, $a$case when v_e.finalowy then 0$a$);
end $$;

alter table public.odpowiedzi drop constraint odpowiedzi_punkty_check;
alter table public.odpowiedzi add constraint odpowiedzi_punkty_check check (punkty >= 0);

update public.etapy
   set opis = 'Punkty z etapów zamieniły się na pozycję startową: lider ma kilka kroków przewagi. Teraz liczy się już tylko wyścig do piwa: dobra odpowiedź to krok naprzód, zła to krok w tył, więc nie klikaj na oślep. Kto pierwszy dobiegnie, wygrywa.'
 where finalowy
   and opis = 'Trzej najlepsi ścigają się do piwa: dobra odpowiedź to krok naprzód, zła to krok w tył, więc nie klikaj na oślep. Lider ma kilka kroków przewagi. Kto pierwszy dobiegnie, wygrywa.';
