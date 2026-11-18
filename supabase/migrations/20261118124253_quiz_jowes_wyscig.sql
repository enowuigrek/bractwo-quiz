-- Quiz JOWES jako wyścig (Forum Współpracy Przedsiębiorstw Społecznych, 19.11.2026): te same pytania i plansze co
-- quiz klasyczny (Jak dobrze znasz JOWES i siebie nawzajem? (quiz klasyczny)), poukładane w etapy według rodzaju; plansza zaraz po pytaniu, którego dotyczy.
-- Liczby z pytań jednokrotnego wyboru (miejsca pracy, kwoty, osoby) są w etapie „Ile?” jako szacowanie, a finał to
-- zdania prawda/fałsz z faktów z pliku zespołu JOWES (Dane pomocnicze). Etapy bez nawiązań do piwa (motyw JOWES).
with k as (
  select id from public.quizy where tytul = 'Jak dobrze znasz JOWES i siebie nawzajem? (quiz klasyczny)' and usunieto is null
), q as (
  insert into public.quizy (tytul, opis, lokal_id, autor_konto_id, udostepniony, tagi)
  select 'Jak dobrze znasz JOWES i siebie nawzajem? (wyścig)', quizy.opis, quizy.lokal_id, quizy.autor_konto_id, true, quizy.tagi
    from public.quizy join k on k.id = quizy.id
   where not exists (select 1 from public.quizy where tytul = 'Jak dobrze znasz JOWES i siebie nawzajem? (wyścig)' and usunieto is null)
  returning id
), e as (
  insert into public.etapy (quiz_id, nr, nazwa, opis, mnoznik, czas_s, finalowy, plan_pytan, typ_domyslny, seria, ikona)
  select q.id, v.* from q, (values
    (1, 'Jedno', 'Jedna dobra odpowiedź. Im szybciej, tym więcej punktów.', 1, null::int, false, null::int, 'wybor', false, '/grafiki/etapy/na-jedno.webp'),
    (2, 'Więcej', 'Dobrych odpowiedzi może być więcej. Zaznacz wszystkie, za złe tracisz część punktów pytania.', 1.5, null::int, false, null::int, 'wielokrotny', false, '/grafiki/etapy/jednak-wiecej.webp'),
    (3, 'Ile?', 'Podaj liczbę. Trafienie to pełne punkty, a im bliżej, tym więcej.', 2, null::int, false, null::int, 'szacowanie', false, '/grafiki/etapy/ile.webp'),
    (4, 'Poukładaj', 'Połącz pary i ułóż kolejność. Punkty za każdy dobry kawałek, a do finału wchodzi tylko trójka.', 2, null::int, false, null::int, 'pary', false, '/grafiki/etapy/poskladaj-sie.webp'),
    (5, 'Ostatnia prosta', 'Punkty z etapów zamieniły się na pozycję startową: lider ma kilka kroków przewagi. Teraz liczy się już tylko wyścig do mety: dobra odpowiedź to krok naprzód, zła to krok w tył, więc nie klikaj na oślep. Kto pierwszy dobiegnie, wygrywa.', 2, 120, true, 14, 'prawda_falsz', true, '/grafiki/etapy/jeszcze-zdaze.webp')
  ) as v(nr, nazwa, opis, mnoznik, czas_s, finalowy, plan_pytan, typ_domyslny, seria, ikona)
  returning id, nr
), z as (
  -- pytania i plansze przeniesione z quizu klasycznego
  insert into public.zadania (quiz_id, nr, typ, tresc, czas_s, dane, grafika_url, etap_id)
  select q.id, p.nr, s.typ, s.tresc, s.czas_s, s.dane, s.grafika_url, e.id
    from q, (values
      (1, 1, 4), (2, 1, 5), (3, 1, 6), (4, 1, 7), (5, 1, 8), (6, 1, 9), (7, 1, 11), (8, 1, 12), (9, 1, 13), (10, 1, 14), (11, 1, 15), (12, 1, 19), (13, 1, 22), (14, 1, 23), (15, 1, 24), (16, 1, 26), (17, 1, 27), (18, 1, 28), (19, 1, 29), (20, 1, 31), (21, 1, 32), (22, 1, 34), (23, 1, 35), (24, 2, 2), (25, 2, 3), (26, 2, 17), (27, 2, 33), (28, 2, 37), (29, 2, 41), (30, 2, 42), (31, 2, 43), (36, 3, 21), (38, 4, 1), (39, 4, 25), (40, 4, 36), (41, 4, 30), (42, 4, 39), (43, 4, 44), (44, 4, 40)
    ) as p(nr, etap_nr, nr_klasyczny)
    join e on e.nr = p.etap_nr
    join public.zadania s on s.nr = p.nr_klasyczny and s.quiz_id = (select id from k)
  returning 1
), s as (
  -- „Ile?”: te same liczby co w pytaniach jednokrotnego wyboru, jako szacowanie
  insert into public.zadania (quiz_id, nr, typ, tresc, czas_s, dane, etap_id)
  select q.id, v.nr, 'szacowanie', v.tresc, 25, v.dane, e.id from q, (values
    (32, 3, 'Ile osób co najmniej musi zatrudniać przedsiębiorstwo społeczne?', '{"min": 1, "max": 10, "krok": 1, "poprawna": 3, "jednostka": "osoby", "tolerancja": 3, "wyjasnienie": "Minimum 3 osoby na umowę o pracę lub spółdzielczą umowę o pracę, co najmniej na ¼ etatu. Co najmniej 30% zatrudnionych to osoby z grup zagrożonych wykluczeniem."}'::jsonb),
    (33, 3, 'Ile miejsc pracy w PES/PS JOWES pomógł utworzyć w samym 2026 roku?', '{"min": 0, "max": 100, "krok": 1, "poprawna": 44, "jednostka": null, "tolerancja": 25, "wyjasnienie": "44 miejsca pracy i prawie 3,9 mln zł dotacji dla NGO w 2026 roku. Do tego ponad 3 tys. godzin doradztwa i 14 dni szkoleniowych."}'::jsonb),
    (34, 3, 'Ile miejsc pracy powstało w PES/PS dzięki JOWES od 2013 roku?', '{"min": 200, "max": 800, "krok": 10, "poprawna": 570, "jednostka": null, "tolerancja": 150, "wyjasnienie": "570 miejsc pracy i ponad 28,6 mln zł dotacji dla NGO we wszystkich czterech edycjach JOWES (od 2013 r.). Sam obecny projekt (od 2024 r.) to już 177 miejsc pracy."}'::jsonb),
    (35, 3, 'Ile wynosi łączne wsparcie na utworzenie i utrzymanie jednego pełnoetatowego miejsca pracy w naborze 2026?', '{"min": 50000, "max": 110000, "krok": 1, "poprawna": 87068, "jednostka": "zł", "tolerancja": 20000, "wyjasnienie": "43 814 zł na utworzenie + 43 254 zł na utrzymanie przez 12 miesięcy = 87 068 zł. Szczegóły na następnej planszy."}'::jsonb),
    (37, 3, 'Jaką maksymalną kwotę można pożyczyć w ramach pożyczki rozwojowej ARR?', '{"min": 1, "max": 8, "krok": 0.5, "poprawna": 5, "jednostka": "mln zł", "tolerancja": 2, "wyjasnienie": "Do 5 mln zł, z możliwością sfinansowania nawet 100% inwestycji, w kwotach brutto (z VAT)."}'::jsonb)
  ) as v(nr, etap_nr, tresc, dane)
  join e on e.nr = v.etap_nr
  returning 1
)
-- finał: seria prawda/fałsz
insert into public.zadania (quiz_id, nr, typ, tresc, czas_s, dane, etap_id)
select q.id, v.nr, 'prawda_falsz', v.tresc, 20, v.dane, e.id from q, (values
  (45, 'Dominika Kasiura jest doradcą biznesowym w JOWES.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 0}'::jsonb),
  (46, 'Iwona Modlińska jest w JOWES animatorką.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 1}'::jsonb),
  (47, 'JOWES prowadzi Agencja Rozwoju Regionalnego w Częstochowie.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 0}'::jsonb),
  (48, 'JOWES działa w powiatach częstochowskim, kłobuckim i lublinieckim.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 1}'::jsonb),
  (49, 'VERTO ma ok. 100 klientów, z czego ok. 60% to NGO i PS.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 0}'::jsonb),
  (50, 'Fundacja Rething działa od 2015 roku.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 1}'::jsonb),
  (51, 'Fundacja Rething prowadzi 2 sklepy charytatywne z artykułami bez plastiku.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 0}'::jsonb),
  (52, 'Pożyczkę rozwojową ARR spłaca się do 120 miesięcy.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 1}'::jsonb),
  (53, 'Decyzja o pożyczce rozwojowej ARR zapada do 14 dni roboczych od złożenia kompletu.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 0}'::jsonb),
  (54, 'Trwałość miejsca pracy z dotacji JOWES to łącznie 24 miesiące.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 1}'::jsonb),
  (55, 'Refundacja Indywidualnego Planu Reintegracji wynosi do 10 800 zł.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 0}'::jsonb),
  (56, 'Jeden PS może w naborze 2026 dostać wsparcie na maks. 10 miejsc pracy.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 1}'::jsonb),
  (57, 'Obecny projekt JOWES objął już wsparciem 241 PES.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 0}'::jsonb),
  (58, 'Trasa koncertowa Fundacji Muzyki Niezależnej to „Analogowy horyzont dźwięku”.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 0}'::jsonb),
  (59, 'Osikowa Dolina robi dekoracje z wiórków brzozowych.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 1}'::jsonb),
  (60, 'Kinesis prowadzi siłownię i treningi funkcjonalne.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 0}'::jsonb),
  (61, 'NGO Marketing Days JOWES organizuje od 2020 roku.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 1}'::jsonb),
  (62, 'Fundacja Kuźnia Pomysłów prowadzi zajęcia z alpakami.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 0}'::jsonb),
  (63, 'Premium Tour Szymczyk organizuje m.in. wyjazdy dla osób z niepełnosprawnością.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 0}'::jsonb),
  (64, 'Fundacja Czas na Seniora prowadzi biuro rachunkowe.', '{"odpowiedzi": ["Prawda", "Fałsz"], "poprawna": 1}'::jsonb)
) as v(nr, tresc, dane)
join e on e.nr = 5;
