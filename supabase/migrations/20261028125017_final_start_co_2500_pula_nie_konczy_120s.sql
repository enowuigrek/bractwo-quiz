-- Finał uczciwszy (28.10, Łukasz):
-- 1. Przewaga na starcie z różnicy punktów, nie z miejsca w trójce: 1 krok za każde 2500 pkt przewagi nad najsłabszym
--    finalistą, najwyżej 4 (było: najlepszy zawsze 3, najsłabszy 0, nawet przy 500 pkt różnicy).
-- 2. Wyczerpana pula nie kończy finału wszystkim: kto odpowiedział na wszystko, czeka; finał kończy dobiegnięcie do
--    piwa, czas albo wyczerpanie puli przez wszystkich (było: najszybszy klikacz kończył finał, a wygrywał lider,
--    który nic nie zrobił).
-- 3. Czas finału 120 s zamiast 180 s (bezpiecznik; do piwa dobiega się zwykle w 40–60 s).
do $$
declare
  d text;
  zmiany text[][] := array[
    ['wewn.ustaw_start_finalu(uuid)',
     $a$set start_finalu = case when z.najw = z.najm then 0
                             else round(3.0 * (gr.punkty - z.najm) / (z.najw - z.najm))::int end$a$,
     $a$set start_finalu = least(4, floor((gr.punkty - z.najm) / 2500.0))::int$a$],
    ['wewn.zamknij_serie_jesli_gotowe(uuid)',
     $a$         -- finał: gdy ktoś odpowiedział na całą pulę, koniec (inaczej przy złych odpowiedziach zabrakłoby pytań)
         case when v_meta is not null and count(*) filter (where odpowiedzi >= v_pytan) > 0 then 0
              else count(*) filter (where odpowiedzi < v_pytan) end$a$,
     $a$         -- kto odpowiedział na całą pulę, czeka; koniec, gdy pula skończy się wszystkim (28.10)
         count(*) filter (where odpowiedzi < v_pytan)$a$]
  ];
  i int;
begin
  for i in 1 .. array_length(zmiany, 1) loop
    d := pg_get_functiondef(zmiany[i][1]::regprocedure);
    if position(zmiany[i][2] in d) = 0 then
      raise exception 'Nie ma fragmentu w %', zmiany[i][1];
    end if;
    execute replace(d, zmiany[i][2], zmiany[i][3]);
  end loop;
end $$;

update public.etapy set czas_s = 120 where finalowy and seria and czas_s = 180;
