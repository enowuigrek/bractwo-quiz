-- Pula finału piwnego quizu (28.10): po usunięciu powtórek z etapów zostało 21 zdań, więc dopisujemy 17 nowych
-- (9 prawdziwych, 8 fałszywych), żadne nie powtarza faktów z etapów ani ciekawostek. Seria daje graczowi całą pulę
-- w losowej kolejności, a wyścig kończy się wcześniej, więc nadmiar to zapas.
insert into public.zadania (quiz_id, etap_id, nr, typ, tresc, dane, czas_s)
select q.id, e.id, m.max_nr + n.i, 'prawda_falsz', n.tresc,
       jsonb_build_object('poprawna', n.poprawna, 'odpowiedzi', '["Prawda", "Fałsz"]'::jsonb), 20
  from public.quizy q
  join public.etapy e on e.quiz_id = q.id and e.finalowy and e.seria
  cross join lateral (select max(nr) as max_nr from public.zadania where quiz_id = q.id) m
  cross join (values
    (1, 'Hefeweizen podaje się zwykle mętny, razem z drożdżami.', 0),
    (2, 'Chmiel to roślina jednoroczna, którą co roku sieje się od nowa.', 1),
    (3, 'Szyszki chmielu do piwa rosną na roślinach żeńskich.', 0),
    (4, 'Brytyjski cask ale z ręcznej pompy jest mocno nagazowany dwutlenkiem węgla z butli.', 1),
    (5, 'Brązowa butelka chroni piwo przed światłem lepiej niż zielona.', 0),
    (6, 'Na Oktoberfeście można pić piwo z dowolnego niemieckiego browaru.', 1),
    (7, 'Oktoberfest zaczyna się we wrześniu.', 0),
    (8, 'Kveik to norweska odmiana chmielu.', 1),
    (9, 'Milk stout zawdzięcza słodycz laktozie, czyli cukrowi mlecznemu.', 0),
    (10, 'Im ciemniejsze piwo, tym więcej ma alkoholu.', 1),
    (11, 'Sumerowie mieli boginię piwa o imieniu Ninkasi.', 0),
    (12, 'Piwo niepasteryzowane wytrzyma w cieple dłużej niż pasteryzowane.', 1),
    (13, 'Słowo „lager” pochodzi od niemieckiego słowa oznaczającego przechowywanie.', 0),
    (14, 'Brettanomyces to odmiana chmielu.', 1),
    (15, 'Chmiel dodaje się do piwa także dlatego, że pomaga je zakonserwować.', 0),
    (16, 'Prohibicja w USA trwała tylko rok.', 1),
    (17, 'Stout z azotem ma drobniejszą i gęstszą pianę niż ten sam stout z samym dwutlenkiem węgla.', 0)
  ) as n(i, tresc, poprawna)
 where q.tytul = 'Piwny quiz Bractwa Piwnego' and q.usunieto is null
   and not exists (select 1 from public.zadania z where z.quiz_id = q.id and z.tresc = n.tresc);
