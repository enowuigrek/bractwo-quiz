-- Nowa wspólna pula pijanego finału (30 pytań z komentarzami, od łagodnych do absurdu i zapowiedzi wybuchu)
-- i wejście dwóch quizów (po 3 pytania, które brzmią jak dalszy ciąg prawdziwego finału).
-- Bez usuwania (MCP go nie przepuszcza): pytania 1–10 nadpisane po nr, reszta dopisana. Stare pytania 4–10
-- prowizorki „Muzyki ponadczasowej” w pijane_pytania_quizu usunięte osobno kluczem serwisowym.
create temporary table nowe_pijane (nr int, tresc text, efekt text, kp text, kf text) on commit drop;
insert into nowe_pijane values
 (1,  'Szklanka piwa jest zawsze do połowy pełna.', 'drzenie', 'Optymizm. Szanuję.', 'Pesymizm. Albo barman.'),
 (2,  'Piwo smakuje lepiej, gdy płaci ktoś inny.', 'odwrocone_kolory', 'Zapisuję, kto dziś stawia.', 'Kłamiesz jak z nut.'),
 (3,  'Ostatnie piwo jest zawsze przedostatnie.', 'brak', 'Mądrość barowa.', 'Zobaczymy o północy.'),
 (4,  'Ten quiz trwa dłużej, niż powinien.', 'pion', 'Skarga przyjęta. I odrzucona.', 'Miło, że się podoba.'),
 (5,  'Podoba ci się dziś {za_barem}?', 'samoklik', 'Przekażemy.', 'Przekażemy mimo wszystko.'),
 (6,  'Na pewno jesteś w {lokal}?', 'ucieczka', 'A skąd ta pewność?', 'To gdzie jesteś?!'),
 (7,  'Pamiętasz, ile dziś było piw?', 'mgla', 'Jedno mniej, niż myślisz.', 'Uczciwie.'),
 (8,  'Twoje piwo patrzy na ciebie z wyrzutem.', 'drzenie', 'Dopij, to przestanie.', 'Spójrz jeszcze raz.'),
 (9,  'Piana to piwo, które się wstydzi.', 'odwrocone_kolory', 'Wrażliwe piwo.', 'Piana się obraziła.'),
 (10, 'Barman wie o tobie więcej niż twoja mama.', 'pion', 'I nikomu nie powie.', 'Barman ma inne zdanie.'),
 (11, 'Gdyby piwo mogło mówić, prosiłoby o litość.', 'obrot', 'Nie słuchaj go.', 'Naprawdę go nie słyszysz?'),
 (12, 'Lewa ręka trzyma piwo pewniej niż prawa.', 'ucieczka', 'Prawa ręka to słyszała.', 'Lewa ręka to słyszała.'),
 (13, 'Kliknij ✗, jeśli nie umiesz czytać.', 'brak', 'Hmm.', 'Ciekawe.'),
 (14, 'Masz ochotę na jeszcze jedno pytanie?', 'samoklik', 'Świetnie, bo będzie.', 'I tak będzie.'),
 (15, 'Kufel to szklanka po siłowni.', 'obrot', 'Wreszcie ktoś rozumie.', 'Szklanka jest dumna.'),
 (16, 'Czy życie ma sens, jeśli nikt nie pamięta, że się wydarzyło?', 'mgla', 'Głęboko.', 'A kto pamięta?'),
 (17, 'Ta odpowiedź zostanie w twojej historii.', 'drzenie', 'Już jest.', 'Za późno.'),
 (18, 'Ktoś przy twoim stoliku właśnie kliknął inaczej.', 'ucieczka', 'Zdrajca.', 'Ty też.'),
 (19, 'Czy można zgubić coś, czego nigdy się nie miało?', 'chaos', 'Rachunek na przykład.', 'Rozum na przykład.'),
 (20, 'Ziemia kręci się szybciej po trzecim piwie.', 'obrot', 'Potwierdzam, kręci się.', 'To czemu się trzymasz?'),
 (21, 'Ta odpowiedź jest prawdziwa.', 'mgla', 'Która?', '✗ to też odpowiedź.'),
 (22, 'Czy gdyby nikt nie zadawał pytań, odpowiedzi nadal miałyby sens?', 'chaos', 'Filozofia przy barze.', 'Odpowiedź bez pytania. Ładnie.'),
 (23, 'Wszystko jest w porządku.', 'pion', 'Na pewno.', 'Wiedziałem.'),
 (24, 'Czy jeśli wszystko przemija, to przemijanie też kiedyś przeminie?', 'chaos', 'Byle nie piwo.', 'Ten quiz nie przeminie.'),
 (25, 'Dobrze się czujesz?', 'drzenie', 'Telefon ma inne zdanie.', 'Zaraz będzie lepiej. Albo nie.'),
 (26, 'Ta szklanka jest pełna.', 'chaos', 'Na razie.', 'Spójrz na telewizor.'),
 (27, 'Słyszysz, jak trzeszczy szkło?', 'chaos', 'Ja też.', 'Posłuchaj uważnie.'),
 (28, 'Nie patrz na telewizor.', 'chaos', 'Za późno.', 'No to patrz.'),
 (29, 'Zaraz coś pęknie.', 'chaos', 'Dobrze myślisz.', 'Zobaczymy.'),
 (30, 'To już ostatnie pytanie.', 'chaos', 'Kłamałem.', 'Słusznie, nie wierz mi.');

update public.pijane_pytania p
   set tresc = n.tresc, efekt = n.efekt, komentarz_prawda = n.kp, komentarz_falsz = n.kf
  from nowe_pijane n
 where n.nr = p.nr;

insert into public.pijane_pytania (nr, tresc, efekt, komentarz_prawda, komentarz_falsz)
select n.nr, n.tresc, n.efekt, n.kp, n.kf
  from nowe_pijane n
 where not exists (select 1 from public.pijane_pytania p where p.nr = n.nr);

create temporary table nowe_wejscie (tytul text, nr int, tresc text, efekt text, kp text, kf text) on commit drop;
insert into nowe_wejscie values
 ('Piwny quiz Bractwa Piwnego', 1, 'Piana na piwie chroni je przed utlenianiem.', 'brak', 'Zgadza się.', 'A jednak chroni.'),
 ('Piwny quiz Bractwa Piwnego', 2, 'Ciemne piwo jest zawsze mocniejsze od jasnego.', 'drzenie', 'Nie zawsze. Ale ładnie brzmi.', 'Brawo, kolor nie mówi o mocy.'),
 ('Piwny quiz Bractwa Piwnego', 3, 'Piana na trzy palce to piwo o trzy palce lepsze.', 'odwrocone_kolory', 'Matematyka się zgadza.', 'Barman się obraził.'),
 ('Muzyka ponadczasowa', 1, 'Freddie Mercury potrafił zaśpiewać cztery oktawy.', 'brak', 'Podobno nawet więcej.', 'Freddie by się nie zgodził.'),
 ('Muzyka ponadczasowa', 2, 'Każdy przebój brzmi lepiej przy trzecim refrenie.', 'drzenie', 'Zwłaszcza po trzecim piwie.', 'To posłuchaj czwartego.'),
 ('Muzyka ponadczasowa', 3, 'Gdyby muzyka mogła mówić, prosiłaby o ciszę.', 'odwrocone_kolory', 'Cisza też jest muzyką.', 'To czemu tak głośno?');

update public.pijane_pytania_quizu x
   set tresc = n.tresc, efekt = n.efekt, komentarz_prawda = n.kp, komentarz_falsz = n.kf
  from nowe_wejscie n
  join public.quizy q on q.tytul = n.tytul
 where x.quiz_id = q.id and x.nr = n.nr;

insert into public.pijane_pytania_quizu (quiz_id, nr, tresc, efekt, komentarz_prawda, komentarz_falsz)
select q.id, n.nr, n.tresc, n.efekt, n.kp, n.kf
  from nowe_wejscie n
  join public.quizy q on q.tytul = n.tytul
 where not exists (select 1 from public.pijane_pytania_quizu x where x.quiz_id = q.id and x.nr = n.nr);
