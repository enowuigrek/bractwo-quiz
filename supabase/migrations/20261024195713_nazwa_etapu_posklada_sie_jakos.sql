-- 4. etap: „Poskłada się jakoś” zamiast „Poskładaj się” (24.10, Łukasz): jak reszta nazw to zdanie, które mówi
-- się przy barze, a nie polecenie.
update public.etapy
   set nazwa = 'Poskłada się jakoś'
 where nazwa = 'Poskładaj się';
