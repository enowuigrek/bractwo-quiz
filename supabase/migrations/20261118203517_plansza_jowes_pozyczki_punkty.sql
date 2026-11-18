-- Plansza „Pożyczki dla PES – ściąga” w quizie JOWES (wyścig): punkty „•” były w jednej linii, a plansza pokazuje je
-- jako listę tylko od nowej linii (18.11). Ta sama treść, każdy punkt w osobnej linii.
update public.zadania z
   set dane = jsonb_set(z.dane, '{tekst}', to_jsonb(replace(z.dane->>'tekst', ' • ', E'\n• ')))
  from public.quizy q, public.lokale l
 where z.quiz_id = q.id
   and l.id = q.lokal_id
   and l.adres_ekranu = 'jowes'
   and q.tytul = 'Quiz JOWES'
   and q.usunieto is null
   and z.typ = 'ciekawostka'
   and z.tresc = 'Pożyczki dla PES – ściąga'
   and position(' • ' in z.dane->>'tekst') > 0;
