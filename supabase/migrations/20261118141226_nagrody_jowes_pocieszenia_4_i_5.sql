-- Nagrody JOWES: tylko 2 nagrody pocieszenia, za miejsca 4 i 5 (18.11, Łukasz); w quizach i niezakończonych grach.
update public.quizy
   set nagrody = (select jsonb_agg(n order by (n ->> 'miejsce')::int) from jsonb_array_elements(nagrody) n where (n ->> 'miejsce')::int <= 5)
 where tytul = 'Jak dobrze znasz JOWES i siebie nawzajem?'
   and nagrody is not null;

update public.sesje s
   set nagrody = (select jsonb_agg(n order by (n ->> 'miejsce')::int) from jsonb_array_elements(s.nagrody) n where (n ->> 'miejsce')::int <= 5)
  from public.quizy q
 where q.id = s.quiz_id
   and q.tytul = 'Jak dobrze znasz JOWES i siebie nawzajem?'
   and s.nagrody is not null
   and s.faza <> 'koniec';
