-- Nagrody JOWES bez instrukcji odbioru (18.11, Łukasz: na miejscu będzie wiadomo, co z czym): w quizach
-- i w grach JOWES, które jeszcze się nie skończyły.
update public.quizy
   set nagrody = (select jsonb_agg(n - 'instrukcja' || jsonb_build_object('instrukcja', null)) from jsonb_array_elements(nagrody) n)
 where tytul = 'Jak dobrze znasz JOWES i siebie nawzajem?'
   and nagrody is not null;

update public.sesje s
   set nagrody = (select jsonb_agg(n - 'instrukcja' || jsonb_build_object('instrukcja', null)) from jsonb_array_elements(s.nagrody) n)
  from public.quizy q
 where q.id = s.quiz_id
   and q.tytul = 'Jak dobrze znasz JOWES i siebie nawzajem?'
   and s.nagrody is not null
   and s.faza <> 'koniec';
