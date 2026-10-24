-- 4. etap: „Jakoś się ułoży” (24.10, Łukasz): gotowe powiedzenie przy barze, a w etapie układa się kolejność i pary.
update public.etapy
   set nazwa = 'Jakoś się ułoży',
       opis = 'Ułóż pary i kolejność. Punkty za każdy dobry kawałek, a do finału wchodzi tylko trójka.'
 where nazwa = 'Poskłada się jakoś';
