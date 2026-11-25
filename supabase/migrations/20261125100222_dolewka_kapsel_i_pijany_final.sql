-- „Piwny quiz Bractwa: dolewka” (Łukasz, 25.11): ostatnie pytanie „Ile?” to teraz ząbki kapsla (daty archeologów
-- się zmieniają), grafika kapsle.webp dojdzie osobno. Pijany finał dostaje te same pytania quizu co Piwny quiz.
update public.zadania z
   set tresc = 'Ile ząbków ma kapsel?',
       grafika_url = null,
       dane = '{"min": 5, "max": 60, "krok": 1, "poprawna": 21, "jednostka": null, "tolerancja": 10, "wyjasnienie": "21 ząbków. Pierwsze kapsle z końca XIX wieku miały ich 24, a 21 przyjęło się później jako standard i trzyma się do dziś."}'::jsonb
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null
   and z.tresc like 'Ile lat temu, według archeologów%';

insert into public.pijane_pytania_quizu (quiz_id, nr, tresc, efekt, komentarz_prawda, komentarz_falsz)
select d.id, p.nr, p.tresc, p.efekt, p.komentarz_prawda, p.komentarz_falsz
  from public.quizy d
  join public.quizy s on s.tytul = 'Piwny quiz Bractwa Piwnego' and s.usunieto is null
  join public.pijane_pytania_quizu p on p.quiz_id = s.id
 where d.tytul = 'Piwny quiz Bractwa: dolewka' and d.usunieto is null
   and not exists (select 1 from public.pijane_pytania_quizu x where x.quiz_id = d.id);
