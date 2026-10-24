-- Ciekawostki po pytaniach, których dotyczą (24.10, uwagi Łukasza po teście), i więcej pytań z grafiką.
-- Piwny quiz: po porterze „Piwna powódź w Londynie”, po trapistach „Piwo zza klasztornych murów” (przeniesiona
-- z walki o finał), po grodziskim „Polski szampan”, po fermentacji spontanicznej „Piwo z otwartego okna”
-- (koelschip). Dwa pytania z grafiką zamiast tekstowych: zboże (zamiast skrótu IPA) i kufel z Oktoberfestu
-- (zamiast roku pierwszego Oktoberfestu). Muzyka ponadczasowa: Chopin i Woodstock też po swoich pytaniach.
-- Ciekawostka nigdy nie zamyka etapu. Numeracja od nowa (unikalność (quiz_id, nr) odroczona do końca transakcji).
do $$
declare
  v_quiz uuid;
  e1 uuid;
  e2 uuid;
  e3 uuid;
  e5 uuid;
  v_ile int;
begin
  -- Piwny quiz Bractwa Piwnego
  select id into v_quiz from public.quizy where tytul = 'Piwny quiz Bractwa Piwnego';
  if v_quiz is null then
    raise exception 'Nie ma Piwnego quizu';
  end if;
  select id into e1 from public.etapy where quiz_id = v_quiz and nr = 1;
  select id into e2 from public.etapy where quiz_id = v_quiz and nr = 2;
  select id into e5 from public.etapy where quiz_id = v_quiz and nr = 5;

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
     jsonb_build_object('tekst',
       'Lambik nie dostaje drożdży od piwowara. Gorącą brzeczkę wylewa się na noc do płytkiej, szerokiej miedzianej '
       || 'kadzi (koelschip) na strychu browaru, przy otwartych oknach, a dzikie drożdże i bakterie z powietrza same '
       || 'zaczynają fermentację. Dlatego lambik warzy się tylko w chłodne miesiące.'), null);

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
  -- finał (pula serii) przesuwa się o dwa numery dalej
  update public.zadania set nr = nr + 2 where quiz_id = v_quiz and etap_id = e5;

  -- Muzyka ponadczasowa
  select id into v_quiz from public.quizy where tytul = 'Muzyka ponadczasowa';
  if v_quiz is null then
    raise exception 'Nie ma quizu Muzyka ponadczasowa';
  end if;
  select id into e3 from public.etapy where quiz_id = v_quiz and nr = 3;
  update public.zadania z
     set nr = m.nr,
         etap_id = case when m.nr = 23 then e3 else z.etap_id end
    from (values
      ('Gdzie urodził się Fryderyk Chopin?', 9),
      ('Który gatunek narodził się w Nowym Orleanie na początku XX wieku?', 11),
      ('Woodstock 1969', 23),
      ('W którym roku The Beatles wydali swój pierwszy album?', 24),
      ('Ile lat miał Wolfgang Amadeusz Mozart, gdy zmarł?', 25)
    ) as m(tresc, nr)
   where z.quiz_id = v_quiz and z.tresc = m.tresc;
  get diagnostics v_ile = row_count;
  if v_ile <> 5 then
    raise exception 'Muzyka ponadczasowa: przestawiono % zadań zamiast 5', v_ile;
  end if;
end $$;
