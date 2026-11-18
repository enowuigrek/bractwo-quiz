-- Nagrody domyślne quizu (18.11, quiz JOWES): gra z kreatora bez wybranych nagród dostaje je z quizu
-- (`sesje.nagrody`, ten sam kształt: miejsce, nagroda, instrukcja). Mogą dotyczyć też miejsc za podium
-- (nagrody pocieszenia); odbiór (`odbierz_nagrode`) działa dla każdego miejsca z listy.
alter table public.quizy add column if not exists nagrody jsonb;

update public.quizy
   set nagrody = jsonb_build_array(
     jsonb_build_object('miejsce', 1, 'nagroda', 'Grant marketingowy 500 zł', 'instrukcja', 'Zgłoś się do zespołu JOWES po zakończeniu quizu.'),
     jsonb_build_object('miejsce', 2, 'nagroda', 'Grant marketingowy 500 zł', 'instrukcja', 'Zgłoś się do zespołu JOWES po zakończeniu quizu.'),
     jsonb_build_object('miejsce', 3, 'nagroda', 'Grant marketingowy 500 zł', 'instrukcja', 'Zgłoś się do zespołu JOWES po zakończeniu quizu.'),
     jsonb_build_object('miejsce', 4, 'nagroda', 'Nagroda pocieszenia', 'instrukcja', 'Zgłoś się do zespołu JOWES po zakończeniu quizu.'),
     jsonb_build_object('miejsce', 5, 'nagroda', 'Nagroda pocieszenia', 'instrukcja', 'Zgłoś się do zespołu JOWES po zakończeniu quizu.'),
     jsonb_build_object('miejsce', 6, 'nagroda', 'Nagroda pocieszenia', 'instrukcja', 'Zgłoś się do zespołu JOWES po zakończeniu quizu.'),
     jsonb_build_object('miejsce', 7, 'nagroda', 'Nagroda pocieszenia', 'instrukcja', 'Zgłoś się do zespołu JOWES po zakończeniu quizu.'),
     jsonb_build_object('miejsce', 8, 'nagroda', 'Nagroda pocieszenia', 'instrukcja', 'Zgłoś się do zespołu JOWES po zakończeniu quizu.')
   )
 where tytul = 'Jak dobrze znasz JOWES i siebie nawzajem?'
   and usunieto is null;
