-- Odbudowa „Piwnego quizu Bractwa Piwnego” (26.10): Łukasz usunął go w panelu przy porządkowaniu quizów.
-- Źródła: pełny zrzut pytań etapów 1–4 z 24.10 21:09 (zapis rozmowy), finał ze zrzutu z 24.10 18:03 z poprawkami
-- migracji `piwny_quiz_bractwa` i `piwny_quiz_pula_finalu`, etapy w stanie z 26.10 rano, a potem ponownie
-- wszystkie późniejsze poprawki danych z migracji (tylko dla tego quizu): ciekawostki po pytaniach, jęczmień,
-- historia grodziskiego, pinta, pils, tripel, goryczka, Reinheitsgebot, koelschip i pijane wejście.
-- Grafiki pytań leżą w public/grafiki, więc nic nie przepadło w magazynie.
do $$
declare
  v_quiz uuid;
  e1 uuid;
  e2 uuid;
  e3 uuid;
  e4 uuid;
  e5 uuid;
  v_ile int;
begin
  if exists (select 1 from public.quizy where tytul = 'Piwny quiz Bractwa Piwnego') then
    raise exception 'Piwny quiz już jest';
  end if;
  insert into public.quizy (tytul, opis, tylko_glowny, utworzono)
  values ('Piwny quiz Bractwa Piwnego',
          'Testowy quiz przygotowany przez Claude''a (22.10) do sprawdzenia całej rozgrywki. Można usunąć.',
          false, '2026-10-22 18:00:00+00')
  returning id into v_quiz;

  insert into public.etapy (quiz_id, nr, nazwa, opis, mnoznik, czas_s, finalowy, seria, plan_pytan, typ_domyslny, ikona)
  values (v_quiz, 1, 'Na jedno', 'Jedna dobra odpowiedź, jak to jedno piwo. Im szybciej, tym więcej punktów.',
          1, null, false, false, null, 'wybor', '/grafiki/etapy/na-jedno.webp')
  returning id into e1;
  insert into public.etapy (quiz_id, nr, nazwa, opis, mnoznik, czas_s, finalowy, seria, plan_pytan, typ_domyslny, ikona)
  values (v_quiz, 2, 'Jednak więcej',
          'Dobrych odpowiedzi może być więcej. Zaznacz wszystkie, za złe tracisz część punktów pytania.',
          1.5, null, false, false, null, 'wielokrotny', '/grafiki/etapy/jednak-wiecej.webp')
  returning id into e2;
  insert into public.etapy (quiz_id, nr, nazwa, opis, mnoznik, czas_s, finalowy, seria, plan_pytan, typ_domyslny, ikona)
  values (v_quiz, 3, 'Ile?', 'Podaj liczbę. Trafienie to pełne punkty, a im bliżej, tym więcej.',
          1.5, null, false, false, null, 'szacowanie', '/grafiki/etapy/ile.webp')
  returning id into e3;
  insert into public.etapy (quiz_id, nr, nazwa, opis, mnoznik, czas_s, finalowy, seria, plan_pytan, typ_domyslny, ikona)
  values (v_quiz, 4, 'Jakoś się ułoży',
          'Ułóż pary i kolejność. Punkty za każdy dobry kawałek, a do finału wchodzi tylko trójka.',
          2, null, false, false, null, 'pary', '/grafiki/etapy/poskladaj-sie.webp')
  returning id into e4;
  insert into public.etapy (quiz_id, nr, nazwa, opis, mnoznik, czas_s, finalowy, seria, plan_pytan, typ_domyslny, ikona)
  values (v_quiz, 5, 'Jeszcze zdążę',
          'Trzej najlepsi ścigają się do piwa: dobra odpowiedź to krok naprzód, zła to krok w tył, więc nie klikaj na oślep. Lider ma kilka kroków przewagi. Kto pierwszy dobiegnie, wygrywa.',
          2, 180, true, true, 14, 'prawda_falsz', '/grafiki/etapy/jeszcze-zdaze.webp')
  returning id into e5;

  -- stan z 24.10 21:09
  insert into public.zadania (quiz_id, etap_id, nr, typ, tresc, grafika_url, dane, czas_s) values
    (v_quiz, e1, 1, $t$wybor$t$, $t$Z jakiego kraju pochodzi styl pilzner?$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Niemcy", "Czechy", "Austria", "Belgia"]}$j$::jsonb, 20),
    (v_quiz, e1, 2, $t$wybor$t$, $t$To dzięki temu piwo jest gorzkie. Co to?$t$, $t$/grafiki/pytania/chmiel.webp$t$, $j${"poprawna": 1, "odslaniaj": true, "odpowiedzi": ["Słód", "Chmiel", "Drożdże", "Jęczmień"]}$j$::jsonb, 20),
    (v_quiz, e1, 3, $t$wybor$t$, $t$Co oznacza skrót IPA?$t$, null, $j${"poprawna": 1, "odpowiedzi": ["International Pale Ale", "India Pale Ale", "Imperial Pils Ale", "Irish Pale Ale"]}$j$::jsonb, 20),
    (v_quiz, e1, 4, $t$wybor$t$, $t$Jaki to styl?$t$, $t$/grafiki/pytania/kriek.webp$t$, $j${"poprawna": 2, "odpowiedzi": ["Stout", "IPA", "Kriek", "Pilzner"]}$j$::jsonb, 20),
    (v_quiz, e1, 5, $t$wybor$t$, $t$W którym mieście narodził się porter?$t$, null, $j${"poprawna": 2, "odpowiedzi": ["Dublin", "Monachium", "Londyn", "Praga"]}$j$::jsonb, 20),
    (v_quiz, e1, 6, $t$wybor$t$, $t$Jak nazywa się to szkło?$t$, $t$/grafiki/pytania/weizen.webp$t$, $j${"poprawna": 1, "odpowiedzi": ["Tulipan", "Weizenglas", "Nonic pint", "Snifter"]}$j$::jsonb, 20),
    (v_quiz, e1, 7, $t$wybor$t$, $t$Co mierzy skala IBU?$t$, null, $j${"poprawna": 2, "odpowiedzi": ["Kolor piwa", "Zawartość alkoholu", "Goryczkę", "Nasycenie dwutlenkiem węgla"]}$j$::jsonb, 20),
    (v_quiz, e1, 8, $t$wybor$t$, $t$Kto warzy belgijskie piwa trapistów?$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Browary rodzinne z Antwerpii", "Mnisi trapiści", "Bractwo Piwne", "Szkoły piwowarskie", "Browar królewski w Brukseli", "Górnicy z Walonii"]}$j$::jsonb, 20),
    (v_quiz, e1, 9, $t$wybor$t$, $t$Co wymieniało jako składniki piwa bawarskie prawo czystości?$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Wodę, jęczmień i chmiel", "Wodę, słód, chmiel i drożdże", "Wodę, pszenicę i chmiel", "Wodę, jęczmień i cukier"]}$j$::jsonb, 20),
    (v_quiz, e1, 10, $t$ciekawostka$t$, $t$Polski szampan$t$, $t$/grafiki/pytania/grodzisk.webp$t$, $j${"tekst": "Grodziskie warzy się w całości ze słodu pszenicznego wędzonego dymem dębowym. Przez stulecia trafiało do wielu krajów i nazywano je polskim szampanem. W 1993 roku browar w Grodzisku zamknięto, ale styl przetrwał dzięki piwowarom domowym i od kilku lat znów się go tam warzy."}$j$::jsonb, null),
    (v_quiz, e1, 11, $t$wybor$t$, $t$Z jakiego słodu warzy się polskie piwo grodziskie?$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Jęczmiennego wędzonego bukiem", "Pszenicznego wędzonego dębem", "Żytniego", "Owsianego"]}$j$::jsonb, 20),
    (v_quiz, e2, 12, $t$wielokrotny$t$, $t$Które z tych stylów pochodzą z Belgii?$t$, null, $j${"poprawna": [1, 3, 4], "odpowiedzi": ["Kölsch", "Witbier", "Porter", "Saison", "Lambic"]}$j$::jsonb, 20),
    (v_quiz, e2, 13, $t$wielokrotny$t$, $t$Które z tych odmian chmielu to polskie chmiele?$t$, null, $j${"poprawna": [0, 1], "odpowiedzi": ["Marynka", "Lubelski", "Cascade", "Saaz"]}$j$::jsonb, 20),
    (v_quiz, e2, 14, $t$wielokrotny$t$, $t$Które z tych stylów to piwa górnej fermentacji?$t$, null, $j${"poprawna": [0, 2], "odpowiedzi": ["Stout", "Pilzner", "Hefeweizen", "Märzen"]}$j$::jsonb, 20),
    (v_quiz, e2, 15, $t$wielokrotny$t$, $t$Które z tych stylów są zwykle kwaśne?$t$, null, $j${"poprawna": [1, 2, 4], "odpowiedzi": ["Koźlak", "Berliner Weisse", "Gose", "Porter", "Flanders red"]}$j$::jsonb, 20),
    (v_quiz, e2, 16, $t$wielokrotny$t$, $t$Które miasta dały nazwę własnemu stylowi piwa?$t$, null, $j${"poprawna": [1, 2, 4], "odpowiedzi": ["Madryt", "Pilzno", "Kolonia", "Oslo", "Grodzisk Wielkopolski"]}$j$::jsonb, 20),
    (v_quiz, e2, 17, $t$wielokrotny$t$, $t$Które z tych piw powstają z fermentacji spontanicznej?$t$, null, $j${"poprawna": [1, 2, 4], "odpowiedzi": ["IPA", "Lambic", "Gueuze", "Pilzner", "Kriek"]}$j$::jsonb, 20),
    (v_quiz, e2, 18, $t$wielokrotny$t$, $t$Które z tych piw to polskie tradycje piwowarskie?$t$, null, $j${"poprawna": [0, 2, 4], "odpowiedzi": ["Grodziskie", "Kölsch", "Piwo jopejskie", "Saison", "Porter bałtycki"]}$j$::jsonb, 20),
    (v_quiz, e2, 19, $t$wielokrotny$t$, $t$Które słowa w nazwie piwa oznaczają mocniejszą wersję stylu?$t$, null, $j${"poprawna": [1, 3, 4], "odpowiedzi": ["Session", "Imperial", "Light", "Double", "Doppel"]}$j$::jsonb, 20),
    (v_quiz, e3, 20, $t$szacowanie$t$, $t$Ile mililitrów ma pinta brytyjska?$t$, null, $j${"max": 1000, "min": 300, "krok": 1, "poprawna": 568, "jednostka": "ml", "tolerancja": 150}$j$::jsonb, 20),
    (v_quiz, e3, 21, $t$szacowanie$t$, $t$W którym roku odbył się pierwszy Oktoberfest w Monachium?$t$, null, $j${"max": 1950, "min": 1700, "krok": 1, "poprawna": 1810, "jednostka": null, "tolerancja": 40}$j$::jsonb, 20),
    (v_quiz, e3, 22, $t$szacowanie$t$, $t$Ile procent alkoholu ma zwykle belgijski tripel?$t$, null, $j${"max": 15, "min": 3, "krok": 0.5, "poprawna": 8.5, "jednostka": "%", "tolerancja": 2}$j$::jsonb, 20),
    (v_quiz, e3, 23, $t$szacowanie$t$, $t$W którym roku w Pilźnie uwarzono pierwsze piwo w stylu pilzner?$t$, null, $j${"max": 2000, "min": 1700, "krok": 1, "poprawna": 1842, "jednostka": null, "tolerancja": 50}$j$::jsonb, 20),
    (v_quiz, e3, 24, $t$szacowanie$t$, $t$W którym roku powstał browar Weihenstephan, uważany za najstarszy działający browar świata?$t$, null, $j${"max": 1600, "min": 800, "krok": 1, "poprawna": 1040, "jednostka": null, "tolerancja": 120}$j$::jsonb, 20),
    (v_quiz, e4, 25, $t$ciekawostka$t$, $t$Piwo zza klasztornych murów$t$, $t$/grafiki/pytania/opactwo.webp$t$, $j${"tekst": "Piwem trapistów może się nazywać tylko piwo uwarzone w klasztorze trapistów, pod okiem mnichów, a zysk idzie na utrzymanie wspólnoty i cele dobroczynne. Takich klasztorów jest na świecie zaledwie kilkanaście."}$j$::jsonb, null),
    (v_quiz, e4, 26, $t$kolejnosc$t$, $t$Ułóż etapy warzenia piwa po kolei$t$, null, $j${"elementy": ["Fermentacja", "Zacieranie", "Leżakowanie", "Gotowanie z chmielem"], "poprawna": [1, 3, 0, 2]}$j$::jsonb, 30),
    (v_quiz, e4, 27, $t$pary$t$, $t$Połącz styl piwa z krajem, z którego pochodzi$t$, null, $j${"lewe": ["Pilzner", "Stout", "Weizen", "Saison"], "prawe": ["Belgia", "Czechy", "Niemcy", "Anglia"], "poprawna": [1, 3, 2, 0]}$j$::jsonb, 30),
    (v_quiz, e4, 28, $t$pary$t$, $t$Połącz styl z tym, co go wyróżnia$t$, null, $j${"lewe": ["Witbier", "Gose", "Rauchbier", "Kriek"], "prawe": ["Sól", "Wiśnie", "Kolendra i skórka pomarańczy", "Wędzony słód"], "poprawna": [2, 0, 3, 1]}$j$::jsonb, 30),
    (v_quiz, e4, 29, $t$kolejnosc$t$, $t$Ułóż style od najjaśniejszego do najciemniejszego$t$, null, $j${"elementy": ["Stout", "Pilzner", "Brown ale", "Märzen"], "poprawna": [1, 3, 2, 0]}$j$::jsonb, 30),
    (v_quiz, e4, 30, $t$pary$t$, $t$Połącz chmiel z krajem, z którego pochodzi$t$, null, $j${"lewe": ["Saaz", "Cascade", "Marynka", "Hallertauer Mittelfrüh"], "prawe": ["Niemcy", "Polska", "Czechy", "USA"], "poprawna": [2, 3, 1, 0]}$j$::jsonb, 30),
    (v_quiz, e4, 31, $t$kolejnosc$t$, $t$Ułóż wydarzenia od najstarszego$t$, null, $j${"elementy": ["Pierwszy pilzner w Pilźnie", "Atak Chmielu, początek polskiej rewolucji piwnej", "Bawarskie prawo czystości", "Badania Pasteura nad fermentacją piwa"], "poprawna": [2, 0, 3, 1]}$j$::jsonb, 30),
    (v_quiz, e5, 32, 'prawda_falsz', $t$Irlandzki stout wywodzi się historycznie z londyńskich porterów.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 33, 'prawda_falsz', $t$Piwo pszeniczne warzy się wyłącznie z pszenicy.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 34, 'prawda_falsz', $t$Chmiel należy do tej samej rodziny roślin co konopie.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 35, 'prawda_falsz', $t$Lambic fermentuje drożdżami z hodowli dodanymi przez piwowara.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 36, 'prawda_falsz', $t$Belgijski witbier warzy się z dodatkiem kolendry.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 37, 'prawda_falsz', $t$Lagery fermentują w wyższej temperaturze niż ale.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 38, 'prawda_falsz', $t$Koźlak to piwo lekkie, o niskiej zawartości alkoholu.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 39, 'prawda_falsz', $t$Słód to skiełkowane i wysuszone zboże.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 40, 'prawda_falsz', $t$Styl IPA powstał w Niemczech.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 41, 'prawda_falsz', $t$Kölsch to styl piwa z Kolonii.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 42, 'prawda_falsz', $t$Porter pochodzi z Irlandii.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 43, 'prawda_falsz', $t$Drożdże zamieniają cukier w alkohol.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 44, 'prawda_falsz', $t$Grodziskie to piwo wędzone.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 45, 'prawda_falsz', $t$Rauchbier pochodzi z Belgii.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 46, 'prawda_falsz', $t$Porter bałtycki fermentuje się zwykle drożdżami dolnej fermentacji.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 47, 'prawda_falsz', $t$Saison pochodzi z Holandii.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 48, 'prawda_falsz', $t$Skala IBU mierzy kolor piwa.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 49, 'prawda_falsz', $t$Chmiel dodany na początku gotowania daje głównie goryczkę, a pod koniec głównie aromat.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 50, 'prawda_falsz', $t$Kölsch podaje się tradycyjnie w wąskich szklankach zwanych Stange.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 51, 'prawda_falsz', $t$Imperial stout warzono kiedyś na eksport na dwór carski w Rosji.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 52, 'prawda_falsz', $t$Stout zawdzięcza czarną barwę palonemu jęczmieniowi.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 53, 'prawda_falsz', $t$W Polsce piwo bezalkoholowe może mieć najwyżej 0,5% alkoholu.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 54, 'prawda_falsz', $t$Lambic po kilku dniach fermentacji od razu trafia do butelek.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 55, 'prawda_falsz', $t$Słód karmelowy rozjaśnia kolor piwa.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 56, 'prawda_falsz', $t$Pilzner pochodzi z Bawarii.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 57, 'prawda_falsz', $t$Drożdże piwne to grzyby.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 58, 'prawda_falsz', $t$Bananowy aromat hefeweizena pochodzi z dodatku owoców.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 59, 'prawda_falsz', $t$Gose warzy się z dodatkiem soli.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 60, 'prawda_falsz', $t$Piwo można warzyć tylko z jęczmienia.$t$, null, $j${"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20),
    (v_quiz, e5, 61, 'prawda_falsz', $t$Doppelbock to mocniejsza wersja koźlaka.$t$, null, $j${"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}$j$::jsonb, 20);

  -- 20261024191331_ciekawostki_po_pytaniach (część Piwnego quizu)
  update public.zadania
     set tresc = 'Z tego zboża warzy się większość piw. Co to?',
         grafika_url = '/grafiki/pytania/jeczmien.webp',
         dane = '{"odpowiedzi": ["Pszenica", "Żyto", "Jęczmień", "Owies"], "poprawna": 2}'
   where quiz_id = v_quiz and tresc = 'Co oznacza skrót IPA?';
  update public.zadania
     set tresc = 'Na Oktoberfeście piwo pije się z takich kufli. Ile litrów mieści taki kufel?',
         grafika_url = '/grafiki/pytania/mass.webp',
         dane = '{"min": 0.25, "max": 3, "krok": 0.25, "poprawna": 1, "jednostka": "l", "tolerancja": 0.5}'
   where quiz_id = v_quiz and tresc = 'W którym roku odbył się pierwszy Oktoberfest w Monachium?';
  update public.zadania
     set etap_id = e1
   where quiz_id = v_quiz and tresc = 'Piwo zza klasztornych murów';
  insert into public.zadania (quiz_id, etap_id, nr, typ, tresc, grafika_url, dane, czas_s) values
    (v_quiz, e1, 1001, 'ciekawostka', 'Piwna powódź w Londynie', '/grafiki/pytania/powodz.webp',
     jsonb_build_object('tekst',
       'W październiku 1814 roku w londyńskim browarze Meux pękła ogromna kadź z porterem. Fala ponad miliona '
       || 'litrów piwa zburzyła mur browaru i zalała okoliczne uliczki. Zginęło osiem osób.'), null),
    (v_quiz, e2, 1002, 'ciekawostka', 'Piwo z otwartego okna', '/grafiki/pytania/koelschip.webp',
     jsonb_build_object('tekst', 'tymczasowy'), null);
  update public.zadania z
     set nr = m.nr
    from (values
      ('Z jakiego kraju pochodzi styl pilzner?', 1),
      ('To dzięki temu piwo jest gorzkie. Co to?', 2),
      ('W którym mieście narodził się porter?', 3),
      ('Piwna powódź w Londynie', 4),
      ('Jaki to styl?', 5),
      ('Co mierzy skala IBU?', 6),
      ('Z tego zboża warzy się większość piw. Co to?', 7),
      ('Kto warzy belgijskie piwa trapistów?', 8),
      ('Piwo zza klasztornych murów', 9),
      ('Jak nazywa się to szkło?', 10),
      ('Z jakiego słodu warzy się polskie piwo grodziskie?', 11),
      ('Polski szampan', 12),
      ('Co wymieniało jako składniki piwa bawarskie prawo czystości?', 13),
      ('Które z tych stylów pochodzą z Belgii?', 14),
      ('Które z tych odmian chmielu to polskie chmiele?', 15),
      ('Które z tych stylów to piwa górnej fermentacji?', 16),
      ('Które z tych stylów są zwykle kwaśne?', 17),
      ('Które miasta dały nazwę własnemu stylowi piwa?', 18),
      ('Które z tych piw powstają z fermentacji spontanicznej?', 19),
      ('Piwo z otwartego okna', 20),
      ('Które z tych piw to polskie tradycje piwowarskie?', 21),
      ('Które słowa w nazwie piwa oznaczają mocniejszą wersję stylu?', 22),
      ('Na Oktoberfeście piwo pije się z takich kufli. Ile litrów mieści taki kufel?', 23),
      ('Ile mililitrów ma pinta brytyjska?', 24),
      ('Ile procent alkoholu ma zwykle belgijski tripel?', 25),
      ('W którym roku w Pilźnie uwarzono pierwsze piwo w stylu pilzner?', 26),
      ('W którym roku powstał browar Weihenstephan, uważany za najstarszy działający browar świata?', 27),
      ('Ułóż etapy warzenia piwa po kolei', 28),
      ('Połącz styl piwa z krajem, z którego pochodzi', 29),
      ('Połącz styl z tym, co go wyróżnia', 30),
      ('Ułóż style od najjaśniejszego do najciemniejszego', 31),
      ('Połącz chmiel z krajem, z którego pochodzi', 32),
      ('Ułóż wydarzenia od najstarszego', 33)
    ) as m(tresc, nr)
   where z.quiz_id = v_quiz and z.etap_id <> e5 and z.tresc = m.tresc;
  get diagnostics v_ile = row_count;
  if v_ile <> 33 or (select count(*) from public.zadania where quiz_id = v_quiz and etap_id <> e5) <> 33 then
    raise exception 'Piwny quiz: nowa kolejność objęła % zadań zamiast 33', v_ile;
  end if;
  update public.zadania set nr = nr + 2 where quiz_id = v_quiz and etap_id = e5;

  -- 20261024194846_pytanie_jeczmien_tresc
  update public.zadania set tresc = 'Co to? Warzy się z tego większość piw.'
   where quiz_id = v_quiz and tresc = 'Z tego zboża warzy się większość piw. Co to?';
  -- 20261024195206_ciekawostka_grodziskie_historia
  update public.zadania
     set dane = jsonb_set(dane, '{tekst}', to_jsonb(
       'Grodziskie warzy się w całości ze słodu pszenicznego wędzonego dymem dębowym. Według tradycji warzono je już '
       || 'około 1301 roku, a od 1601 roku każdą beczkę próbował burmistrz z radą i dopiero wtedy dostawała pieczęć. '
       || 'Nazywano je polskim szampanem. W 1993 roku browar zamknięto, ale styl przetrwał dzięki piwowarom domowym, a dziś znów warzy się je w Grodzisku.'::text))
   where quiz_id = v_quiz and typ = 'ciekawostka' and tresc = 'Polski szampan';
  -- 20261024195440_pytanie_pinta_grafika
  update public.zadania set grafika_url = '/grafiki/pytania/pinta.webp'
   where quiz_id = v_quiz and tresc = 'Ile mililitrów ma pinta brytyjska?';
  -- 20261024195554_pils_zamiast_pilzner
  update public.zadania
     set tresc = regexp_replace(regexp_replace(tresc, '\mPilzner\M', 'Pils', 'g'), '\mpilzner\M', 'pils', 'g'),
         dane = regexp_replace(regexp_replace(dane::text, '\mPilzner\M', 'Pils', 'g'), '\mpilzner\M', 'pils', 'g')::jsonb
   where quiz_id = v_quiz and (tresc ~* '\mpilzner\M' or dane::text ~* '\mpilzner\M');
  -- 20261025060552_pytanie_tripel_zdjecie
  update public.zadania set grafika_url = '/grafiki/pytania/tripel.webp'
   where quiz_id = v_quiz and tresc = 'Ile procent alkoholu ma zwykle belgijski tripel?';
  -- 20261025071434_pytanie_chmiel_goryczka
  update public.zadania set tresc = 'To dzięki temu piwo ma goryczkę. Co to?'
   where quiz_id = v_quiz and tresc = 'To dzięki temu piwo jest gorzkie. Co to?';
  -- 20261025072222_reinheitsgebot_w_pytaniach
  update public.zadania
     set tresc = 'Co wymieniało jako składniki piwa bawarskie prawo czystości (Reinheitsgebot)?'
   where quiz_id = v_quiz and tresc = 'Co wymieniało jako składniki piwa bawarskie prawo czystości?';
  update public.zadania
     set dane = jsonb_set(dane, '{elementy}',
                  (select jsonb_agg(case when e #>> '{}' = 'Bawarskie prawo czystości'
                                         then to_jsonb('Bawarskie prawo czystości (Reinheitsgebot)'::text) else e end
                                    order by i)
                     from jsonb_array_elements(dane -> 'elementy') with ordinality as x(e, i)))
   where quiz_id = v_quiz and typ = 'kolejnosc' and dane -> 'elementy' ? 'Bawarskie prawo czystości';
  -- 20261025072926_ciekawostka_koelschip_fermentacja_spontaniczna
  update public.zadania
     set dane = jsonb_set(dane, '{tekst}', to_jsonb(
       'Tak powstają piwa fermentacji spontanicznej: lambic oraz robione z niego gueuze i kriek. Piwowar nie dodaje '
       || 'drożdży. Gorącą brzeczkę wylewa się na noc do płytkiej, szerokiej miedzianej kadzi (koelschip) na strychu '
       || 'browaru, przy otwartych oknach, a dzikie drożdże i bakterie z powietrza same zaczynają fermentację. Dlatego '
       || 'warzy się je tylko w chłodne miesiące.'::text))
   where quiz_id = v_quiz and typ = 'ciekawostka' and tresc = 'Piwo z otwartego okna';

  -- 20261025075719_pijane_pytania_nowa_lista: wejście pijanego finału
  insert into public.pijane_pytania_quizu (quiz_id, nr, tresc, efekt, komentarz_prawda, komentarz_falsz) values
    (v_quiz, 1, 'Piana na piwie chroni je przed utlenianiem.', 'brak', 'Zgadza się.', 'A jednak chroni.'),
    (v_quiz, 2, 'Ciemne piwo jest zawsze mocniejsze od jasnego.', 'drzenie', 'Nie zawsze. Ale ładnie brzmi.', 'Brawo, kolor nie mówi o mocy.'),
    (v_quiz, 3, 'Piana na trzy palce to piwo o trzy palce lepsze.', 'odwrocone_kolory', 'Matematyka się zgadza.', 'Barman się obraził.');

  if (select count(*) from public.zadania where quiz_id = v_quiz) <> 63 then
    raise exception 'Piwny quiz: % zadań zamiast 63', (select count(*) from public.zadania where quiz_id = v_quiz);
  end if;
end $$;
