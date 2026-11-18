-- Tytuły quizów JOWES bez dopisków „(quiz klasyczny)” i „(wyścig)”: na TV (poczekalnia, tabela) tylko przeszkadzały,
-- a w panelu rozróżniają je zakładki rodzaju quizu.
update public.quizy
   set tytul = 'Jak dobrze znasz JOWES i siebie nawzajem?'
 where tytul in ('Jak dobrze znasz JOWES i siebie nawzajem? (quiz klasyczny)', 'Jak dobrze znasz JOWES i siebie nawzajem? (wyścig)')
   and usunieto is null;
