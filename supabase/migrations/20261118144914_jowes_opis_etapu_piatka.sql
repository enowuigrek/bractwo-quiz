-- Wyścig JOWES: do finału wchodzi piątka (quizy.finalistow = 5), więc i opis etapu przed finałem.
update public.etapy e
   set opis = replace(e.opis, 'do finału wchodzi tylko trójka', 'do finału wchodzi tylko piątka')
  from public.quizy q
 where e.quiz_id = q.id
   and q.tytul = 'Jak dobrze znasz JOWES i siebie nawzajem?'
   and e.opis like '%do finału wchodzi tylko trójka%';
