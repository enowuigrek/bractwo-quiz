-- „Ile?” to trudna konkurencja (26.10, Łukasz): mnożnik ×2 jak „Jakoś się ułoży” (było ×1,5),
-- w Piwnym quizie Bractwa i Muzyce ponadczasowej. Rozegrane odpowiedzi mają punkty już zapisane.
update public.etapy e
   set mnoznik = 2
  from public.quizy q
 where q.id = e.quiz_id
   and q.tytul in ('Piwny quiz Bractwa Piwnego', 'Muzyka ponadczasowa')
   and e.nazwa = 'Ile?'
   and e.mnoznik = 1.5;
