-- Piwny quiz Bractwa (dawniej „Piwo - quiz testowy”): przegląd całego quizu z Łukaszem 24.10.
-- Mniej stoutu i porteru, więcej podawania i degustacji, dłuższy strzał liczbowy (5 pytań), w etapach
-- przeplatające się dziedziny i rosnąca trudność, w finale 7 × prawda i 7 × fałsz, krótkie zdania w drugiej
-- połowie serii (tam wchodzą przeszkadzacze). Pytania zmieniane po treści, potem cała numeracja od nowa
-- (unikalność (quiz_id, nr) jest odroczona do końca transakcji).
do $$
declare
  v_quiz uuid;
  v_etap3 uuid;
  v_ile int;
begin
  select id into v_quiz from public.quizy where tytul = 'Piwo - quiz testowy';
  if v_quiz is null then
    raise exception 'Nie ma quizu „Piwo - quiz testowy”';
  end if;
  select id into v_etap3 from public.etapy where quiz_id = v_quiz and nr = 3;

  -- Rozgrzewka: zamiast powtórek (lager, najciemniejsze piwo) podawanie i degustacja
  update public.zadania
     set tresc = 'W jakim szkle tradycyjnie podaje się niemieckie piwo pszeniczne?',
         dane = '{"odpowiedzi": ["Tulipan", "Wysoki, smukły pokal (weizenglas)", "Kufel z uchem", "Snifter (koniakówka)"], "poprawna": 1}'
   where quiz_id = v_quiz and tresc = 'Lager to piwo fermentowane drożdżami…';
  update public.zadania
     set tresc = 'Co mierzy skala IBU?',
         dane = '{"odpowiedzi": ["Kolor piwa", "Zawartość alkoholu", "Goryczkę", "Nasycenie dwutlenkiem węgla"], "poprawna": 2}'
   where quiz_id = v_quiz and tresc = 'Które z tych piw jest zwykle najciemniejsze?';

  -- Strzał liczbowy: rok prawa czystości pada już dwa razy gdzie indziej, więc Oktoberfest, i dwa nowe
  update public.zadania
     set tresc = 'W którym roku odbył się pierwszy Oktoberfest w Monachium?',
         dane = '{"min": 1700, "max": 1950, "krok": 1, "poprawna": 1810, "jednostka": null, "tolerancja": 40}'
   where quiz_id = v_quiz and tresc = 'W którym roku ogłoszono bawarskie prawo czystości (Reinheitsgebot)?';
  insert into public.zadania (quiz_id, etap_id, nr, typ, tresc, dane, czas_s) values
    (v_quiz, v_etap3, 1001, 'szacowanie', 'Ile procent alkoholu ma zwykle belgijski tripel?',
     '{"min": 3, "max": 15, "krok": 0.5, "poprawna": 8.5, "jednostka": "%", "tolerancja": 2}', 20),
    (v_quiz, v_etap3, 1002, 'szacowanie',
     'W którym roku powstał browar Weihenstephan, uważany za najstarszy działający browar świata?',
     '{"min": 800, "max": 1600, "krok": 1, "poprawna": 1040, "jednostka": null, "tolerancja": 120}', 20);

  -- Finał: mniej stoutu, 7 × prawda i 7 × fałsz
  update public.zadania
     set tresc = 'Słód to skiełkowane i wysuszone zboże.', dane = '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'
   where quiz_id = v_quiz and tresc = 'Stout to piwo ciemne.';
  update public.zadania
     set tresc = 'Rauchbier pochodzi z Belgii.', dane = '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'
   where quiz_id = v_quiz and tresc = 'Rauchbier to piwo wędzone.';
  update public.zadania
     set tresc = 'Lambic fermentuje drożdżami z hodowli dodanymi przez piwowara.',
         dane = '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'
   where quiz_id = v_quiz and tresc = 'Słowo „stout” pierwotnie określało mocniejszą wersję porteru.';

  -- Nowa kolejność całego quizu
  update public.zadania z
     set nr = m.nr
    from (values
      ('Z jakiego kraju pochodzi styl pilzner?', 1),
      ('Który składnik piwa odpowiada głównie za goryczkę?', 2),
      ('Co oznacza skrót IPA?', 3),
      ('Jaki gaz, obok alkoholu, powstaje podczas fermentacji?', 4),
      ('W którym mieście narodził się porter?', 5),
      ('W jakim szkle tradycyjnie podaje się niemieckie piwo pszeniczne?', 6),
      ('Co mierzy skala IBU?', 7),
      ('Kto warzy belgijskie piwa trapistów?', 8),
      ('Co wymieniało jako składniki piwa bawarskie prawo czystości?', 9),
      ('Z jakiego słodu warzy się polskie piwo grodziskie?', 10),
      ('Które z tych stylów pochodzą z Belgii?', 11),
      ('Które z tych odmian chmielu to polskie chmiele?', 12),
      ('Które z tych stylów to piwa górnej fermentacji?', 13),
      ('Które z tych stylów są zwykle kwaśne?', 14),
      ('Które miasta dały nazwę własnemu stylowi piwa?', 15),
      ('Które z tych piw powstają z fermentacji spontanicznej?', 16),
      ('Które z tych piw to polskie tradycje piwowarskie?', 17),
      ('Które słowa w nazwie piwa oznaczają mocniejszą wersję stylu?', 18),
      ('Ile mililitrów ma pinta brytyjska?', 19),
      ('W którym roku odbył się pierwszy Oktoberfest w Monachium?', 20),
      ('Ile procent alkoholu ma zwykle belgijski tripel?', 21),
      ('W którym roku w Pilźnie uwarzono pierwsze piwo w stylu pilzner?', 22),
      ('W którym roku powstał browar Weihenstephan, uważany za najstarszy działający browar świata?', 23),
      ('Ułóż etapy warzenia piwa po kolei', 24),
      ('Połącz styl piwa z krajem, z którego pochodzi', 25),
      ('Połącz styl z tym, co go wyróżnia', 26),
      ('Ułóż style od najjaśniejszego do najciemniejszego', 27),
      ('Połącz chmiel z krajem, z którego pochodzi', 28),
      ('Ułóż wydarzenia od najstarszego', 29),
      ('Irlandzki stout wywodzi się historycznie z londyńskich porterów.', 30),
      ('Piwo pszeniczne warzy się wyłącznie z pszenicy.', 31),
      ('Chmiel należy do tej samej rodziny roślin co konopie.', 32),
      ('Lambic fermentuje drożdżami z hodowli dodanymi przez piwowara.', 33),
      ('Belgijski witbier warzy się z dodatkiem kolendry.', 34),
      ('Lagery fermentują w wyższej temperaturze niż ale.', 35),
      ('Koźlak to piwo lekkie, o niskiej zawartości alkoholu.', 36),
      ('Słód to skiełkowane i wysuszone zboże.', 37),
      ('Styl IPA powstał w Niemczech.', 38),
      ('Kölsch to styl piwa z Kolonii.', 39),
      ('Porter pochodzi z Irlandii.', 40),
      ('Drożdże zamieniają cukier w alkohol.', 41),
      ('Grodziskie to piwo wędzone.', 42),
      ('Rauchbier pochodzi z Belgii.', 43)
    ) as m(tresc, nr)
   where z.quiz_id = v_quiz and z.tresc = m.tresc;
  get diagnostics v_ile = row_count;
  if v_ile <> 43 or (select count(*) from public.zadania where quiz_id = v_quiz) <> 43 then
    raise exception 'Nowa kolejność objęła % pytań zamiast 43', v_ile;
  end if;

  update public.quizy set tytul = 'Piwny quiz Bractwa' where id = v_quiz;
end $$;
