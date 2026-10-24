-- Quiz „Muzyka ponadczasowa” (24.10, na test z Basią i Łukaszem): te same etapy, zasady, odpadanie, finał jako
-- wyścig i pijany finał co „Piwny quiz Bractwa Piwnego”, ale przez historię muzyki (barok, klasyka, jazz, blues,
-- rock and roll, rock, reggae, punk, grunge, hip-hop, pop, polska muzyka). Trudność rośnie w każdym etapie,
-- w strzale liczbowym poprawna nie jest w środku suwaka, w „Kilka dobrych” różna liczba dobrych (1–4).
-- Grafiki: public/grafiki/pytania/{saksofon,kaseta,organy,chopin,woodstock}.webp (scripts/grafiki.mjs).
do $$
declare
  v_piwo uuid;
  v_quiz uuid;
  e1 uuid;
  e2 uuid;
  e3 uuid;
  e4 uuid;
  e5 uuid;
begin
  select id into v_piwo from public.quizy where tytul = 'Piwny quiz Bractwa Piwnego';
  if v_piwo is null then
    raise exception 'Nie ma quizu „Piwny quiz Bractwa Piwnego”, z którego biorę etapy';
  end if;
  if exists (select 1 from public.quizy where tytul = 'Muzyka ponadczasowa') then
    raise exception 'Quiz „Muzyka ponadczasowa” już jest';
  end if;

  insert into public.quizy (tytul, opis, tylko_glowny)
  values ('Muzyka ponadczasowa',
          'Przez historię muzyki: od baroku po hip-hop. Te same etapy, odpadanie i finał co Piwny quiz Bractwa Piwnego.',
          false)
  returning id into v_quiz;

  -- etapy jeden do jednego jak w Piwnym quizie (nazwy, opisy, mnożniki, czasy, seria i finał)
  insert into public.etapy (quiz_id, nr, nazwa, opis, mnoznik, czas_s, finalowy, plan_pytan, typ_domyslny, seria)
  select v_quiz, nr, nazwa, opis, mnoznik, czas_s, finalowy, plan_pytan, typ_domyslny, seria
    from public.etapy where quiz_id = v_piwo;
  select id into e1 from public.etapy where quiz_id = v_quiz and nr = 1;
  select id into e2 from public.etapy where quiz_id = v_quiz and nr = 2;
  select id into e3 from public.etapy where quiz_id = v_quiz and nr = 3;
  select id into e4 from public.etapy where quiz_id = v_quiz and nr = 4;
  select id into e5 from public.etapy where quiz_id = v_quiz and nr = 5;

  insert into public.zadania (quiz_id, etap_id, nr, typ, tresc, grafika_url, dane, czas_s) values
    -- 1. Rozgrzewka: jedna dobra, od łatwych do trudniejszych, trzy z grafiką i ciekawostka przed ostatnim
    (v_quiz, e1, 1, 'wybor', 'Kto nagrał album „Thriller”?', null,
     '{"odpowiedzi": ["Prince", "Michael Jackson", "Stevie Wonder", "Lionel Richie"], "poprawna": 1}', 20),
    (v_quiz, e1, 2, 'wybor', 'Jak nazywa się ten instrument?', '/grafiki/pytania/saksofon.webp',
     '{"odpowiedzi": ["Klarnet", "Trąbka", "Puzon", "Saksofon"], "poprawna": 3}', 20),
    (v_quiz, e1, 3, 'wybor', 'Który zespół nagrał „Bohemian Rhapsody”?', null,
     '{"odpowiedzi": ["Queen", "The Who", "Led Zeppelin", "Pink Floyd"], "poprawna": 0}', 20),
    (v_quiz, e1, 4, 'wybor', 'Jak nazywa się ten nośnik muzyki?', '/grafiki/pytania/kaseta.webp',
     '{"odpowiedzi": ["Płyta winylowa", "Minidysk", "Kaseta magnetofonowa", "Dyskietka"], "poprawna": 2}', 20),
    (v_quiz, e1, 5, 'wybor', 'Kogo nazywano „królem rock and rolla”?', null,
     '{"odpowiedzi": ["Chuck Berry", "Little Richard", "Buddy Holly", "Elvis Presley"], "poprawna": 3}', 20),
    (v_quiz, e1, 6, 'wybor', 'Z jakiego miasta pochodzi zespół The Beatles?', null,
     '{"odpowiedzi": ["Londyn", "Liverpool", "Manchester", "Birmingham"], "poprawna": 1}', 20),
    (v_quiz, e1, 7, 'wybor', 'Który kompozytor stracił słuch, a mimo to napisał IX Symfonię?', null,
     '{"odpowiedzi": ["Ludwig van Beethoven", "Wolfgang Amadeusz Mozart", "Johann Sebastian Bach", "Joseph Haydn"], "poprawna": 0}', 20),
    (v_quiz, e1, 8, 'wybor', 'Jaki to instrument?', '/grafiki/pytania/organy.webp',
     '{"odpowiedzi": ["Fortepian", "Akordeon", "Organy", "Klawesyn"], "poprawna": 2, "odslaniaj": true}', 20),
    (v_quiz, e1, 9, 'wybor', 'Który gatunek narodził się w Nowym Orleanie na początku XX wieku?', null,
     '{"odpowiedzi": ["Country", "Jazz", "Reggae", "Techno"], "poprawna": 1}', 20),
    (v_quiz, e1, 10, 'ciekawostka', 'Serce wróciło do Warszawy', '/grafiki/pytania/chopin.webp',
     jsonb_build_object('tekst',
       'Fryderyk Chopin zmarł w Paryżu, ale zgodnie z jego wolą siostra przywiozła jego serce do Warszawy. '
       || 'Spoczywa w filarze kościoła Świętego Krzyża na Krakowskim Przedmieściu.'), null),
    (v_quiz, e1, 11, 'wybor', 'Gdzie urodził się Fryderyk Chopin?', null,
     '{"odpowiedzi": ["Warszawa", "Kraków", "Żelazowa Wola", "Paryż"], "poprawna": 2}', 20),

    -- 2. Kilka dobrych: od 1 do 4 dobrych odpowiedzi z pięciu
    (v_quiz, e2, 12, 'wielokrotny', 'Którzy z tych muzyków grali w The Beatles?', null,
     '{"odpowiedzi": ["John Lennon", "Mick Jagger", "Ringo Starr", "Keith Richards", "George Harrison"], "poprawna": [0, 2, 4]}', 20),
    (v_quiz, e2, 13, 'wielokrotny', 'Które z tych instrumentów są dęte?', null,
     '{"odpowiedzi": ["Wiolonczela", "Trąbka", "Kontrabas", "Flet", "Harfa"], "poprawna": [1, 3]}', 20),
    (v_quiz, e2, 14, 'wielokrotny', 'Które z tych utworów nagrał zespół Queen?', null,
     '{"odpowiedzi": ["„Stairway to Heaven”", "„We Will Rock You”", "„Don''t Stop Me Now”", "„Hotel California”", "„Another One Bites the Dust”"], "poprawna": [1, 2, 4]}', 20),
    (v_quiz, e2, 15, 'wielokrotny', 'Który z tych muzyków dostał literacką Nagrodę Nobla?', null,
     '{"odpowiedzi": ["Leonard Cohen", "Paul Simon", "Bob Dylan", "Bruce Springsteen", "Joni Mitchell"], "poprawna": [2]}', 20),
    (v_quiz, e2, 16, 'wielokrotny', 'Które z tych zespołów pochodzą z Seattle?', null,
     '{"odpowiedzi": ["Nirvana", "Pearl Jam", "Oasis", "Soundgarden", "Alice in Chains"], "poprawna": [0, 1, 3, 4]}', 20),
    (v_quiz, e2, 17, 'wielokrotny', 'Które z tych gatunków narodziły się na Jamajce?', null,
     '{"odpowiedzi": ["Bossa nova", "Reggae", "Calypso", "Ska", "Flamenco"], "poprawna": [1, 3]}', 20),
    (v_quiz, e2, 18, 'wielokrotny', 'Którzy z tych kompozytorów tworzyli w epoce baroku?', null,
     '{"odpowiedzi": ["Fryderyk Chopin", "Johann Sebastian Bach", "Claude Debussy", "Antonio Vivaldi", "Georg Friedrich Händel"], "poprawna": [1, 3, 4]}', 20),
    (v_quiz, e2, 19, 'wielokrotny', 'Którzy z tych artystów są Polakami?', null,
     '{"odpowiedzi": ["Edith Piaf", "Czesław Niemen", "Freddie Mercury", "Krzysztof Komeda", "Nina Simone"], "poprawna": [1, 3]}', 20),

    -- 3. Strzał liczbowy: poprawna w różnych miejscach suwaka (nie w środku)
    (v_quiz, e3, 20, 'szacowanie', 'Ile klawiszy ma standardowy fortepian?', null,
     '{"min": 50, "max": 100, "krok": 1, "poprawna": 88, "jednostka": null, "tolerancja": 12}', 20),
    (v_quiz, e3, 21, 'szacowanie', 'W którym roku zmarł Fryderyk Chopin?', null,
     '{"min": 1780, "max": 1880, "krok": 1, "poprawna": 1849, "jednostka": null, "tolerancja": 15}', 20),
    (v_quiz, e3, 22, 'szacowanie', 'W którym roku odbył się festiwal Woodstock?', null,
     '{"min": 1955, "max": 2000, "krok": 1, "poprawna": 1969, "jednostka": null, "tolerancja": 6}', 20),
    (v_quiz, e3, 23, 'szacowanie', 'W którym roku The Beatles wydali swój pierwszy album?', null,
     '{"min": 1945, "max": 1975, "krok": 1, "poprawna": 1963, "jednostka": null, "tolerancja": 5}', 20),
    (v_quiz, e3, 24, 'szacowanie', 'Ile lat miał Wolfgang Amadeusz Mozart, gdy zmarł?', null,
     '{"min": 20, "max": 90, "krok": 1, "poprawna": 35, "jednostka": "lat", "tolerancja": 10}', 20),

    -- 4. Połącz i ułóż (walka o finał): ciekawostka, potem na zmianę kolejność i pary, najtrudniejsze na koniec
    (v_quiz, e4, 25, 'ciekawostka', 'Woodstock 1969', '/grafiki/pytania/woodstock.webp',
     jsonb_build_object('tekst',
       'W sierpniu 1969 roku na festiwal Woodstock przyjechało około 400 tysięcy ludzi, wielu więcej, niż spodziewali '
       || 'się organizatorzy. Jimi Hendrix zagrał na sam koniec, w poniedziałek rano, gdy większość publiczności już wyjechała.'), null),
    (v_quiz, e4, 26, 'kolejnosc', 'Ułóż nośniki muzyki od najstarszego', null,
     '{"elementy": ["Płyta CD", "Plik MP3", "Płyta winylowa (LP)", "Kaseta magnetofonowa"], "poprawna": [2, 3, 0, 1]}', 30),
    (v_quiz, e4, 27, 'pary', 'Połącz artystę z gatunkiem', null,
     '{"lewe": ["Bob Marley", "Miles Davis", "Johnny Cash", "Run-D.M.C."], "prawe": ["Country", "Hip-hop", "Reggae", "Jazz"], "poprawna": [2, 3, 0, 1]}', 30),
    (v_quiz, e4, 28, 'kolejnosc', 'Ułóż epoki muzyki klasycznej od najstarszej', null,
     '{"elementy": ["Romantyzm", "Barok", "Klasycyzm", "Renesans"], "poprawna": [3, 1, 2, 0]}', 30),
    (v_quiz, e4, 29, 'pary', 'Połącz zespół z krajem, z którego pochodzi', null,
     '{"lewe": ["ABBA", "U2", "AC/DC", "Rammstein"], "prawe": ["Niemcy", "Australia", "Szwecja", "Irlandia"], "poprawna": [2, 3, 1, 0]}', 30),
    (v_quiz, e4, 30, 'kolejnosc', 'Ułóż gatunki od najstarszego', null,
     '{"elementy": ["Punk rock", "Blues", "Grunge", "Rock and roll"], "poprawna": [1, 3, 0, 2]}', 30),
    (v_quiz, e4, 31, 'pary', 'Połącz utwór z kompozytorem', null,
     '{"lewe": ["Cztery pory roku", "Bolero", "Dla Elizy", "Lot trzmiela"], "prawe": ["Ludwig van Beethoven", "Nikołaj Rimski-Korsakow", "Antonio Vivaldi", "Maurice Ravel"], "poprawna": [2, 3, 0, 1]}', 30);

  -- 5. Finał: pula 30 prawda/fałsz (15 + 15), w grze w losowej kolejności
  insert into public.zadania (quiz_id, etap_id, nr, typ, tresc, dane, czas_s)
  select v_quiz, e5, 31 + t.i, 'prawda_falsz', t.tresc,
         jsonb_build_object('poprawna', t.poprawna, 'odpowiedzi', jsonb_build_array('Prawda', 'Fałsz')), 20
    from (values
      (1, 'Jimi Hendrix grał na gitarze leworęcznie.', 0),
      (2, 'Elvis Presley nigdy nie koncertował poza Ameryką Północną.', 0),
      (3, 'Mozart urodził się w Salzburgu.', 0),
      (4, '„Imagine” to piosenka Johna Lennona.', 0),
      (5, 'Skrzypce mają cztery struny.', 0),
      (6, 'Freddie Mercury urodził się na Zanzibarze.', 0),
      (7, 'Johann Sebastian Bach miał dwadzieścioro dzieci.', 0),
      (8, 'Zespół Nirvana pochodzi ze Stanów Zjednoczonych.', 0),
      (9, 'Bob Marley pochodził z Jamajki.', 0),
      (10, 'Fortepian to instrument strunowy.', 0),
      (11, '„Cztery pory roku” skomponował Antonio Vivaldi.', 0),
      (12, 'Miles Davis grał na trąbce.', 0),
      (13, 'Czesław Niemen zaśpiewał „Dziwny jest ten świat”.', 0),
      (14, 'ABBA wygrała Eurowizję piosenką „Waterloo”.', 0),
      (15, 'Kontrabas jest większy od wiolonczeli.', 0),
      (16, 'Beethoven urodził się w Wiedniu.', 1),
      (17, 'The Rolling Stones pochodzą z Liverpoolu.', 1),
      (18, 'Fryderyk Chopin zmarł w Warszawie.', 1),
      (19, 'Saksofon to instrument blaszany.', 1),
      (20, 'Elvis Presley sam napisał większość swoich przebojów.', 1),
      (21, '„Bohemian Rhapsody” nagrał zespół The Who.', 1),
      (22, 'Gitara klasyczna ma metalowe struny.', 1),
      (23, 'Mozart i Beethoven nigdy nie żyli w tym samym czasie.', 1),
      (24, 'Reggae narodziło się w Brazylii.', 1),
      (25, 'Michael Jackson zaczynał karierę w zespole The Temptations.', 1),
      (26, 'Operę „Carmen” napisał Giuseppe Verdi.', 1),
      (27, 'Pianino i fortepian to dokładnie to samo.', 1),
      (28, 'Bob Dylan dostał Pokojową Nagrodę Nobla.', 1),
      (29, '„Smells Like Teen Spirit” nagrał zespół Pearl Jam.', 1),
      (30, 'Hip-hop narodził się w Londynie.', 1)
    ) as t(i, tresc, poprawna);
end $$;
