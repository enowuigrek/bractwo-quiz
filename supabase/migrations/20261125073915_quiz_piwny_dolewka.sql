-- „Piwny quiz Bractwa: dolewka” (25.11.2026): drugi piwny wyścig Bractwa, krótszy (7/5/4/4 pytań + finał 20 zdań),
-- bez powtórek faktów z „Piwnego quizu Bractwa Piwnego”. Etapy i czasy jak w pierwszym quizie. Nowy quiz prywatny.
with q as (
  insert into public.quizy (tytul, opis, lokal_id, autor_konto_id, udostepniony, tagi, marka, finalistow)
  select 'Piwny quiz Bractwa: dolewka',
         'Druga runda piwnego wyścigu: style, chmiele, wady piwa i historia warzenia, bez powtórek z pierwszego quizu.',
         null, p.autor_konto_id, false, array['piwo'], 'bractwo', 3
    from public.quizy p
   where p.tytul = 'Piwny quiz Bractwa Piwnego' and p.usunieto is null
     and not exists (select 1 from public.quizy where tytul = 'Piwny quiz Bractwa: dolewka' and usunieto is null)
  returning id
), e as (
  insert into public.etapy (quiz_id, nr, nazwa, opis, mnoznik, czas_s, finalowy, plan_pytan, typ_domyslny, seria, ikona)
  select q.id, v.* from q, (values
    (1, 'Na jedno', 'Jedna dobra odpowiedź, jak to jedno piwo. Im szybciej, tym więcej punktów.', 1, null::int, false, null::int, 'wybor', false, '/grafiki/etapy/na-jedno.webp'),
    (2, 'Jednak więcej', 'Dobrych odpowiedzi może być więcej. Zaznacz wszystkie, za złe tracisz część punktów pytania.', 1.5, null::int, false, null::int, 'wielokrotny', false, '/grafiki/etapy/jednak-wiecej.webp'),
    (3, 'Ile?', 'Podaj liczbę. Trafienie to pełne punkty, a im bliżej, tym więcej.', 2, null::int, false, null::int, 'szacowanie', false, '/grafiki/etapy/ile.webp'),
    (4, 'Jakoś się ułoży', 'Ułóż pary i kolejność. Punkty za każdy dobry kawałek, a do finału wchodzi tylko trójka.', 2, null::int, false, null::int, 'pary', false, '/grafiki/etapy/poskladaj-sie.webp'),
    (5, 'Jeszcze zdążę', 'Punkty z etapów zamieniły się na pozycję startową: lider ma kilka kroków przewagi. Teraz liczy się już tylko wyścig do piwa: dobra odpowiedź to krok naprzód, zła to krok w tył, więc nie klikaj na oślep. Kto pierwszy dobiegnie, wygrywa.', 2, 120, true, 20, 'prawda_falsz', true, '/grafiki/etapy/jeszcze-zdaze.webp')
  ) as v(nr, nazwa, opis, mnoznik, czas_s, finalowy, plan_pytan, typ_domyslny, seria, ikona)
  returning id, nr
)
insert into public.zadania (quiz_id, nr, typ, tresc, czas_s, dane, etap_id)
select q.id, v.nr, v.typ, v.tresc, v.czas_s, v.dane, e.id
  from q, (values
    -- Etap 1: Na jedno
    (1, 1, 'wybor', 'Co oznacza skrót IPA?', 20, '{"poprawna": 2, "odpowiedzi": ["Imperial Pale Ale", "International Premium Ale", "India Pale Ale", "Irish Porter Ale"]}'::jsonb),
    (2, 1, 'wybor', 'Jak nazywa się słodka ciecz z zacierania słodu, z której potem fermentuje piwo?', 20, '{"poprawna": 0, "odpowiedzi": ["Brzeczka", "Młóto", "Syrop chmielowy", "Melasa"]}'::jsonb),
    (3, 1, 'wybor', 'Jaki mocny styl nazywano „płynnym chlebem” i pito w Monachium w Wielkim Poście?', 20, '{"poprawna": 3, "odpowiedzi": ["Hefeweizen", "Märzen", "Dunkel", "Doppelbock"]}'::jsonb),
    (4, 1, 'ciekawostka', 'Post o chlebie i piwie', null, '{"tekst": "Doppelbocka warzyli monachijscy mnisi, którzy w Wielkim Poście nie mogli jeść do syta. Mocne, słodowe piwo dawało im siłę, więc nazywali je płynnym chlebem, a pierwsze nazwano Salvator, czyli Zbawiciel. Do dziś wiele doppelbocków ma nazwę z końcówką -ator."}'::jsonb),
    (5, 1, 'wybor', 'Jak nazywa się dodawanie chmielu do piwa dopiero w czasie albo po fermentacji?', 20, '{"poprawna": 1, "odpowiedzi": ["Chmielenie brzeczki przedniej", "Chmielenie na zimno", "Whirlpool", "Chmielenie w zacierze"]}'::jsonb),
    (6, 1, 'wybor', 'Co piwowar nazywa gęstwą?', 20, '{"poprawna": 2, "odpowiedzi": ["Pianę na piwie", "Resztki słodu po zacieraniu", "Osad drożdży zebrany po fermentacji", "Zagęszczony ekstrakt chmielowy"]}'::jsonb),
    (7, 1, 'wybor', 'Z którego miasta pochodzi altbier?', 20, '{"poprawna": 1, "odpowiedzi": ["Kolonia", "Düsseldorf", "Monachium", "Bamberg"], "wyjasnienie": "Düsseldorf ma altbier, a sąsiednia Kolonia kölscha. Oba miasta od dawna się o to przekomarzają."}'::jsonb),
    (8, 1, 'wybor', 'Jak nazywa się zacieranie, w którym część zacieru gotuje się osobno i wlewa z powrotem?', 20, '{"poprawna": 0, "odpowiedzi": ["Dekokcja", "Infuzja", "Wysładzanie", "Klarowanie"]}'::jsonb),
    -- Etap 2: Jednak więcej
    (9, 2, 'wielokrotny', 'Które z tych piw są ciemne?', 20, '{"poprawna": [0, 3], "odpowiedzi": ["Schwarzbier", "Hefeweizen", "Kölsch", "Dunkel", "Witbier"]}'::jsonb),
    (10, 2, 'wielokrotny', 'Które z tych stylów pochodzą z Wysp Brytyjskich?', 20, '{"poprawna": [0, 1, 3, 5], "odpowiedzi": ["Bitter", "Barley wine", "Dubbel", "Mild", "Doppelbock", "Scotch ale"]}'::jsonb),
    (11, 2, 'wielokrotny', 'Które z tych stylów warzy się z dużym dodatkiem żyta?', 20, '{"poprawna": [0], "odpowiedzi": ["Roggenbier", "Kölsch", "Witbier", "Märzen"], "wyjasnienie": "Roggen to po niemiecku żyto. Witbier warzy się z pszenicą i często z owsem."}'::jsonb),
    (12, 2, 'wielokrotny', 'Które z tych związków w piwie uchodzą za wadę?', 20, '{"poprawna": [0, 1, 2], "odpowiedzi": ["Diacetyl (masło)", "DMS (gotowana kukurydza)", "Aldehyd octowy (zielone jabłko)", "Humulon", "Maltoza"], "wyjasnienie": "Humulon to kwas alfa z chmielu, który daje goryczkę, a maltoza to cukier ze słodu, który zjadają drożdże."}'::jsonb),
    (13, 2, 'ciekawostka', 'Masło w piwie', null, '{"tekst": "Diacetyl robią same drożdże w czasie fermentacji i same potrafią go z powrotem zjeść. Dlatego piwowar pod koniec fermentacji lagera podnosi na dzień czy dwa temperaturę: to przerwa diacetylowa, po której maślany zapach znika."}'::jsonb),
    (14, 2, 'wielokrotny', 'Które z tych odmian chmielu wyhodowano w USA?', 20, '{"poprawna": [0, 2, 4], "odpowiedzi": ["Citra", "Saaz", "Mosaic", "Nelson Sauvin", "Simcoe", "East Kent Goldings"], "wyjasnienie": "Saaz to Czechy (Žatec), Nelson Sauvin Nowa Zelandia, a East Kent Goldings Anglia."}'::jsonb),
    -- Etap 3: Ile?
    (15, 3, 'szacowanie', 'Ile procent alkoholu ma zwykle Berliner Weisse?', 20, '{"min": 0, "max": 12, "krok": 0.1, "poprawna": 3, "jednostka": "%", "tolerancja": 2, "wyjasnienie": "Zwykle około 3%. To lekkie, kwaśne piwo pszeniczne, które w Berlinie pije się czasem z syropem."}'::jsonb),
    (16, 3, 'szacowanie', 'Na ile metrów pnie się chmiel w chmielniku?', 20, '{"min": 1, "max": 20, "krok": 0.5, "poprawna": 6, "poprawna_do": 8, "jednostka": "m", "tolerancja": 3, "wyjasnienie": "Chmiel wspina się po drutach na 6–8 metrów i co roku odrasta z tego samego korzenia."}'::jsonb),
    (17, 3, 'szacowanie', 'W którym roku uwarzono w Pilźnie pierwszego pilsa?', 20, '{"min": 1750, "max": 2000, "krok": 1, "poprawna": 1842, "jednostka": null, "tolerancja": 40, "wyjasnienie": "W 1842 roku. Uwarzył go bawarski piwowar Josef Groll w nowym mieszczańskim browarze."}'::jsonb),
    (18, 3, 'ciekawostka', 'Bunt w Pilźnie', null, '{"tekst": "Zanim powstał pils, piwo w Pilźnie było tak złe, że w 1838 roku mieszczanie wylali 36 beczek na rynek przed ratuszem. Zrzucili się na nowy browar i sprowadzili piwowara z Bawarii. Jasny lager z miękkiej pilzneńskiej wody i czeskiego chmielu podbił potem cały świat."}'::jsonb),
    (19, 3, 'szacowanie', 'Ile procent alkoholu ma Snake Venom ze szkockiego browaru Brewmeister, jedno z najmocniejszych piw świata?', 25, '{"min": 5, "max": 80, "krok": 0.5, "poprawna": 67.5, "jednostka": "%", "tolerancja": 15, "wyjasnienie": "67,5%. Tak mocne piwo powstaje przez wymrażanie: z zamrożonego piwa usuwa się lód, a alkohol zostaje."}'::jsonb),
    -- Etap 4: Jakoś się ułoży
    (20, 4, 'pary', 'Połącz skrót z tym, co mierzy albo oznacza', 30, '{"lewe": ["ABV", "EBC", "°Blg", "BJCP"], "prawe": ["Ekstrakt brzeczki", "Zawartość alkoholu", "Wytyczne stylów piwa", "Kolor piwa"], "poprawna": [1, 3, 0, 2]}'::jsonb),
    (21, 4, 'kolejnosc', 'Ułóż style od najsłabszego do najmocniejszego', 30, '{"elementy": ["Pils", "Imperial stout", "Mild", "Doppelbock"], "poprawna": [2, 0, 3, 1]}'::jsonb),
    (22, 4, 'pary', 'Połącz chmiel z jego aromatem', 30, '{"lewe": ["Citra", "Saaz", "Nelson Sauvin", "East Kent Goldings"], "prawe": ["Białe wino i agrest", "Cytrusy i owoce tropikalne", "Ziemisty i kwiatowy", "Ziołowy i korzenny"], "poprawna": [1, 3, 0, 2]}'::jsonb),
    (23, 4, 'kolejnosc', 'Ułóż od najdawniejszego', 30, '{"elementy": ["Pierwsze piwo w puszce", "Bawarskie prawo czystości", "Czysta kultura drożdży lagerowych (Emil Hansen)", "Bęben do palenia słodu (Daniel Wheeler)"], "poprawna": [1, 3, 2, 0], "wyjasnienie": "Prawo czystości 1516, bęben Wheelera 1817, drożdże Hansena 1883, puszka 1935."}'::jsonb),
    -- Etap 5: Jeszcze zdążę (seria prawda/fałsz)
    (24, 5, 'prawda_falsz', 'Woda to ponad 90% piwa.', 20, '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (25, 5, 'prawda_falsz', 'Mętne piwo jest zawsze zepsute.', 20, '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (26, 5, 'prawda_falsz', 'American Pale Ale wywodzi się z Czech.', 20, '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (27, 5, 'prawda_falsz', 'Barley wine to wino, a nie piwo.', 20, '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (28, 5, 'prawda_falsz', 'Weizenbock to mocne piwo pszeniczne.', 20, '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (29, 5, 'prawda_falsz', 'Piwo pszeniczne jest bezglutenowe.', 20, '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (30, 5, 'prawda_falsz', 'Bardzo zimne piwo pokazuje mniej aromatu niż lekko ocieplone.', 20, '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (31, 5, 'prawda_falsz', 'Framboise to belgijskie piwo z malinami.', 20, '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (32, 5, 'prawda_falsz', 'New England IPA jest zwykle klarowna jak pils.', 20, '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (33, 5, 'prawda_falsz', 'Płatki owsiane dają piwu gładsze i pełniejsze ciało.', 20, '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (34, 5, 'prawda_falsz', 'Klasyczny pils pachnie wyraźnie bananem.', 20, '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (35, 5, 'prawda_falsz', 'Słód pilzneński to jasny słód jęczmienny.', 20, '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (36, 5, 'prawda_falsz', 'Belgijski dubbel jest zwykle jaśniejszy niż tripel.', 20, '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (37, 5, 'prawda_falsz', 'Märzen nazywa się tak, bo tradycyjnie warzono go w marcu.', 20, '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (38, 5, 'prawda_falsz', 'Pastry stout warzy się bez dodatków, z samego słodu i chmielu.', 20, '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (39, 5, 'prawda_falsz', 'Porter bałtycki narodził się w Stanach Zjednoczonych.', 20, '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (40, 5, 'prawda_falsz', 'Pianę piwa podtrzymują głównie białka ze słodu.', 20, '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (41, 5, 'prawda_falsz', 'Saison warzono dawniej dla sezonowych robotników na farmach w Walonii.', 20, '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (42, 5, 'prawda_falsz', 'Cold IPA to zwykła IPA podawana z lodem.', 20, '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb),
    (43, 5, 'prawda_falsz', 'Brut IPA jest bardzo wytrawna, bo piwowar dodaje enzym, który rozkłada cukry.', 20, '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb)
  ) as v(nr, etap_nr, typ, tresc, czas_s, dane)
  join e on e.nr = v.etap_nr;
