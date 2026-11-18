-- Quizy lokalu JOWES po zmianie nazwy (wyścig to teraz „Quiz JOWES”): wcześniejsze migracje szukały quizu po starym
-- tytule. Tu po lokalu: 5 finalistów, nagrody tylko za miejsca 1–5 i opis etapu z piątką. Pytań nie ruszamy.
update public.quizy q
   set finalistow = 5
  from public.lokale l
 where l.id = q.lokal_id and l.adres_ekranu = 'jowes' and q.usunieto is null and q.finalistow <> 5;

update public.quizy q
   set nagrody = (select jsonb_agg(n order by (n ->> 'miejsce')::int) from jsonb_array_elements(q.nagrody) n where (n ->> 'miejsce')::int <= 5)
  from public.lokale l
 where l.id = q.lokal_id and l.adres_ekranu = 'jowes' and q.usunieto is null
   and q.nagrody is not null and jsonb_array_length(q.nagrody) > 5;

update public.etapy e
   set opis = replace(e.opis, 'do finału wchodzi tylko trójka', 'do finału wchodzi tylko piątka')
  from public.quizy q, public.lokale l
 where e.quiz_id = q.id and l.id = q.lokal_id and l.adres_ekranu = 'jowes'
   and e.opis like '%do finału wchodzi tylko trójka%';
