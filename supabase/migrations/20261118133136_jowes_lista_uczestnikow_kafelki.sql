-- Plansza z listą uczestników Forum (quizy JOWES): każda organizacja w osobnej linii od „- ”, TV i telefon
-- pokazują je jako kafelki (components/tekst-planszy.tsx) zamiast ciągłego tekstu z kropkami.
update public.zadania z
   set dane = jsonb_set(z.dane, '{tekst}', to_jsonb('- ' || replace(z.dane ->> 'tekst', '  ·  ', E'\n- ')))
  from public.quizy q
 where z.quiz_id = q.id
   and q.tytul = 'Jak dobrze znasz JOWES i siebie nawzajem?'
   and z.typ = 'ciekawostka'
   and z.tresc like 'Dziękujemy!%'
   and z.dane ->> 'tekst' like '%  ·  %';
