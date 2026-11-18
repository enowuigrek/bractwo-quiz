-- Quizy JOWES jako quizy Zbyszka (konto JOWES): autor na liście quizów i stronie osoby.
update public.quizy q
   set autor_konto_id = k.id
  from public.konta k
 where k.email = 'zbyszko@jowes.pl'
   and q.tytul = 'Jak dobrze znasz JOWES i siebie nawzajem?'
   and q.usunieto is null;
