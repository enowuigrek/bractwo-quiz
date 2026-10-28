-- Wejście pijanego finału piwnego quizu (28.10): kufel i gacie wyleciały (ręcznie), w ich miejsce mlíko i puszka;
-- „najlepsze piwo przed tobą” zostaje na końcu, bo jest najdziwniejsze.
update public.pijane_pytania_quizu w
   set nr = 5
  from public.quizy q
 where w.quiz_id = q.id and q.tytul = 'Piwny quiz Bractwa Piwnego' and q.usunieto is null
   and w.nr = 3 and w.tresc = 'Najlepsze piwo to to, które stoi teraz przed tobą.';

insert into public.pijane_pytania_quizu (quiz_id, nr, tresc, komentarz_prawda, komentarz_falsz)
select q.id, v.nr, v.tresc, v.kp, v.kf
  from public.quizy q,
       (values
         (3, 'W czeskich pubach można zamówić kufel samej piany.', 'Mlíko. Czesi wiedzą, co dobre.',
             'A jednak. Nazywa się mlíko.'),
         (4, 'Piwo w puszce chłodzi się w lodówce szybciej niż w butelce.', 'Fizyka po twojej stronie.',
             'Aluminium się nie zgadza.')
       ) as v(nr, tresc, kp, kf)
 where q.tytul = 'Piwny quiz Bractwa Piwnego' and q.usunieto is null
   and not exists (select 1 from public.pijane_pytania_quizu w where w.quiz_id = q.id and w.nr = v.nr);
