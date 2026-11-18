-- Quiz JOWES: „Ile procent podatku dochodowego można przekazać OPP?” miało zakres 0–3 z poprawną 1,5, czyli
-- na środku, skąd suwak startuje: kto nie ruszył suwaka, nie wysłał nic i miał 0 (18.11). Zakres 0–5, start 2,5.
update public.zadania z
   set dane = jsonb_set(z.dane, '{max}', '5'::jsonb)
  from public.quizy q, public.lokale l
 where z.quiz_id = q.id
   and l.id = q.lokal_id
   and l.adres_ekranu = 'jowes'
   and q.usunieto is null
   and z.typ = 'szacowanie'
   and z.tresc = 'Ile procent podatku dochodowego można przekazać organizacji pożytku publicznego?'
   and (z.dane->>'max')::numeric = 3;
