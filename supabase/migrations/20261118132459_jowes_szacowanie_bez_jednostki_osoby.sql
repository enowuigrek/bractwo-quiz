-- Szacowanie w wyścigu JOWES („Ile osób co najmniej musi zatrudniać PS?”): bez jednostki „osoby”, bo się nie
-- odmienia (8 osoby); treść pytania mówi, co liczymy.
update public.zadania z
   set dane = jsonb_set(z.dane, '{jednostka}', 'null'::jsonb)
  from public.quizy q
 where z.quiz_id = q.id
   and q.tytul = 'Jak dobrze znasz JOWES i siebie nawzajem?'
   and z.typ = 'szacowanie'
   and z.dane ->> 'jednostka' = 'osoby';
