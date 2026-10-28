-- Odpowiedzi na pytanie (28.10, po grze w Piwiarni): gracze, którzy odpadli w poprzednim etapie, stali w ramce
-- „Źle” jako bez odpowiedzi. Odpadnięci bez odpowiedzi na to pytanie już się nie pokazują.
do $$
declare
  d text := pg_get_functiondef('public.odpowiedzi_zadania(text)'::regprocedure);
  stare text := $a$       and (v_s.finalisci is null or g.id = any (v_s.finalisci))
$a$;
begin
  if position(stare in d) = 0 then
    raise exception 'Nie ma fragmentu w public.odpowiedzi_zadania';
  end if;
  execute replace(d, stare, $a$       and (v_s.finalisci is null or g.id = any (v_s.finalisci))
       -- odpadnięci w poprzednich etapach nie grają: bez wiersza „bez odpowiedzi”
       and (g.odpadl_po_etapie is null or o.id is not null)
$a$);
end $$;
