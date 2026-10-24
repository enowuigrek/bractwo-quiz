# Bractwo Quiz: test z telefonami i lista przed eventem

## Przed eventem (dzień wcześniej)

1. Na `/api/keepalive` (adres aplikacji + `/api/keepalive`) ma być `"ok": true` i `"realtime": "SUBSCRIBED"`. Jeśli jest ustawiony `CRON_SECRET`, bez nagłówka dostaniesz 401. Wtedy sprawdź w Vercelu: Project → Settings → Cron Jobs → Run.
2. W panelu: quiz ma wszystkie pytania, poprawne odpowiedzi są zaznaczone, a grafiki się wczytują.
3. W panelu: uruchom grę (miasto → lokal → quiz, okazja, czas na odpowiedź, nagrody). Bonus za szybkość jest zawsze, drużyn już nie ma. Widoczność i „Pijany finał” są tylko po zalogowaniu hasłem głównym; gra głównego jest domyślnie „tylko dla mnie”, więc obsługa nie zobaczy jej w panelu (pilot i TV działają normalnie).
4. Jeśli telewizor ma otwarty ekran od wczoraj, a w międzyczasie było wdrożenie: ekran sam się przeładuje w ciągu minuty (poza pytaniem, serią i pijanym finałem). Dla pewności odśwież go raz ręcznie.

## Na miejscu (30 min przed)

1. Telewizor: przeglądarka na pełnym ekranie (F11), ekran lokalu z zakładek (`/ekran/<adres-lokalu>`, adres w panelu: ⚙ → lokal). Bez gry lecą plansze, a po uruchomieniu gry ekran sam przechodzi do poczekalni. Ekran sam prosi telewizor o niewygaszanie (Wake Lock i zapętlone, prawie czarne wideo na całym ekranie). Jeśli mimo to obraz gaśnie albo ciemnieje, to ustawienia telewizora. W lokalu stoi Samsung OLED (Tizen, przeglądarka Samsung Internet): Ustawienia → Wszystkie ustawienia → Ogólne i prywatność → Menedżer systemu → Czas autoochrony (wyłącz albo ustaw najdłuższy) oraz Ogólne i prywatność → Ochrona panelu OLED / Panel Care → Dostosuj jasność logo (wyłącz). Po otwarciu strony dotknij raz pilota TV. Nazwy pozycji różnią się trochę między rocznikami.
2. Telefon prowadzącego: zeskanuj QR pilota z ekranu gry w panelu. Pilot zapamięta się po odświeżeniu.
3. Sprawdź Wi‑Fi lokalu albo zasięg LTE w sali. Każdy telefon potrzebuje internetu.
4. Ty dołączasz jako pierwszy gracz i sprawdzasz, że nick pojawia się na TV.

## Scenariusz testu (kilka telefonów, ok. 15 min)

Do szybkiego testu podstaw: quiz z 3–4 pytaniami (jedno z grafiką, jedno z 6 odpowiedziami), czas 10 s, a drugą grę „bez limitu”. Do pełnego testu: „Piwny quiz Bractwa Piwnego” albo „Muzyka ponadczasowa” (etapy, ciekawostki, odpadanie i finał), tabela niżej.

| # | Co zrobić | Czego oczekiwać |
|---|---|---|
| 1 | Gracze skanują QR z TV, wpisują nicki | Nicki wskakują na TV w ciągu ~1 s. Ten sam nick drugi raz jest odrzucony. |
| 2 | Jeden gracz odświeża stronę | Wraca do gry z tym samym nickiem, bez wpisywania. |
| 3 | Pilot: Start quizu | W quizie z etapami najpierw plansza wstępu (droga etapów: Na jedno → … → Jeszcze zdążę), potem plansza etapu (zasady, telefon z animacją). Po „Start etapu” TV i telefony odliczają 3‑2‑1 i odsłaniają pytanie w tym samym momencie. |
| 4 | Gracze odpowiadają w różnym tempie | Na TV rośnie „Odpowiedziało x/y”. Telefon pokazuje „Odpowiedź zapisana (3,4 s)”. |
| 5 | Wszyscy odpowiadają | Zegar kończy się od razu, TV pokazuje „Czas minął!”. |
| 6 | Pilot: Pokaż wynik | TV: poprawna na zielono, słupki, najszybszy. Telefon: „Dobrze! +… pkt” albo „Niestety źle”, miejsce. |
| 7 | Jeden gracz nie odpowiada, a jeden blokuje ekran telefonu w trakcie pytania | Po odblokowaniu telefon dogania grę. Bez odpowiedzi jest „Brak odpowiedzi”. |
| 8 | Pilot: Pokaż wynik, zanim minie czas | Pyta o potwierdzenie i kończy pytanie. |
| 9 | Pilot: Pokaż odpowiedzi graczy, potem Pokaż ranking | TV: zielona ramka z dobrymi od najszybszego, czerwona ze złymi, przy każdym odpowiedź i czas, na dole bez odpowiedzi. Potem ranking: przetasowanie, „+zdobyte”, strzałki. Telefon: miejsce i zmiana. |
| 10 | Ostatnie pytanie → Pokaż podium → Pokaż pełną tabelę → Zakończ grę | Podium wjeżdża 3 → 2 → 1. Tabela: wszyscy gracze z punktami. Na końcu podziękowanie. |
| 11 | Wyłącz na chwilę Wi‑Fi na TV | W rogu „Brak połączenia, ponawiam…”, a po powrocie sieci TV dogania grę sam. |
| 12 | Gra uruchomiona z czasem „bez limitu” | Nigdzie nie ma zegara ani napisu „bez limitu”. Po ostatniej odpowiedzi: „Wszyscy odpowiedzieli”. „Pokaż wynik”, zanim wszyscy odpowiedzą, pyta o potwierdzenie. Dobra odpowiedź od razu ≈ 1000 pkt, po 15 s ≈ 750, po 30 s 500 (pary, kolejność i wielokrotny: po 60 s). |
| 13 | Ranking po pytaniu | Wyścig po piwo: awatary jadą po torach, szklanka dolewa się po każdym pytaniu (na TV i na telefonie). Przy ponad 12 graczach tory ma pierwsza dziesiątka, reszta stoi w pasku małych awatarów pod torami (z kreską odpadania, gdy wypada wśród nich). Po ostatnim pytaniu etapu złoty pasek „Koniec etapu N · nazwa”. |
| 14 | Etap przed finałem | Plansza „Walka o finał: 3 najlepszych”, telefon „Do 3. miejsca brakuje Ci X pkt”, w wyścigu kreska pod 3. torem. |
| 15 | Finał (wyścig) | Plansza finału z finalistami i nagrodą. Start: „Start za 3” w nagłówku, drogi widać. Finaliści klikają koła ✓/✗ we własnym tempie, na TV jadą do szklanki (bez numerów pytań). Reszta kibicuje: na telefonie wybór finalisty i hasła z jego awatarem (jeden okrzyk na 3 s), na TV dymki nad drogą finalisty i licznik 📣 pod nickiem. Finaliści na podium: „Kibicowało Ci X osób”. Od połowy pytań utrudnienia bez żadnej zapowiedzi (ani na planszy, ani w nagłówku): drżenie, zamiana przycisków, mgła, dryf, zanikanie, uciekające przyciski, kołysanie. Demo na planszy finału ma te same okrągłe przyciski co telefon. |
| 16 | Ktoś odpowie dobrze na wszystko (gra bez „Pijanego finału”) | Seria kończy się od razu: TV gaśnie z błyskiem, telefony robią się czarne, po chwili „Werble…” z kropkami i „Wynik za chwilę.” Pilot: „Pokaż podium”. |
| 17 | Podium i nagroda | Podium wjeżdża 3 → 2 → 1 ze zdjęciem nagrody. Telefon zwycięzcy: karta nagrody, „Potwierdź odbiór”, potem pieczątka „Odebrana”. |
| 18 | Gra z „Pijanym finałem” (kreator, najlepiej z imieniem osoby za barem), ktoś dobiega do piwa | W finale po każdej odpowiedzi krótki błysk na zielono albo czerwono, przycisk pulsuje albo się trzęsie (od połowy dłużej); na TV awatar podskakuje albo się trzęsie. Pod koniec serii awatary na TV drżą. Potem nigdzie nie ma napisu „Pijany finał”: TV dalej ma nagłówek finału, awatary cofają się, drogi spadają, awatary latają. Telefony (wszyscy, też kibice): „Seria · pytanie 15/14” i dalej, ekran faluje, po każdej odpowiedzi coraz dłuższa reakcja (losowy kolor, drżenie, przelatujący komentarz), więc nie da się tego przeklikać. Dogrywka trwa 60 s: 5,5 s przed końcem wszystkie telefony gasną z błyskiem i urywa się muzyka, po chwili ciszy na TV wybucha szklanka (z dźwiękiem, gdy gra muzyka), potem werble na TV i telefonach. |
| 19 | Muzyka (domyślnie włączona; pilot: Wyłącz/Włącz) | Na TV gra muzyka; jeśli przeglądarka nie pozwala, na dole prośba „Naciśnij OK na pilocie telewizora” i po OK muzyka rusza. Zmienia się przy poczekalni, etapach, finale i podium, w werblach cisza. W pijanym finale zwalnia i się zacina, staje przed wybuchem, a wybuch słychać. |
| 20 | Gra z co najmniej 9 graczami (odpadanie) | Pilot w poczekalni: karta „Odpadanie przed finałem” z progami (przy 9–15: po 3. etapie zostaje 6), − / + zmienia od razu. W rankingu 3. etapu kreska „▲ 6 najlepszych gra dalej ▲” i na telefonach „Do 6. miejsca brakuje…”. Na planszy 4. etapu odpadnięci mają „Odpadasz po 3. etapie”, znikają z wyścigu, a walka o finał liczy już tylko grających. |
| 21 | Ciekawostka (np. po pytaniu o porter) | Pilot: „Pokaż ciekawostkę”. TV: duża grafika z tytułem i tekstem, telefon to samo mniejsze, bez odliczania i odpowiedzi. Pilot ma jeden przycisk dalej. |

Do zanotowania po teście (dzień 7):
- czy bonus za szybkość jest sprawiedliwy (z limitem i bez),
- czy czasy pytań, 3 s odliczania i 180 s na finał (wyścig na 12 kroków) pasują,
- czy utrudnienia w finale nie są za mocne (albo za słabe),
- czy na iPhonie przy werblach paski przeglądarki zostają czarne,
- pijany finał: jak ludzie reagują, czy ktoś zauważył, że seria leci dalej, czy 60 s to nie za długo i czy latające awatary idą płynnie na Samsungu,
- czy telewizor dalej się wygasza (wideo czuwania 720p z dźwiękiem, ustawienia Samsunga wyżej),
- muzyka: czy nie za głośna przy rozmowach i czy psucie w pijanym finale słychać na głośnikach TV,
- czy coś na TV jest za małe z końca sali,
- błędy i dziwne zachowania: kiedy, na jakim telefonie i w jakiej przeglądarce.

Po teście usuń grę w panelu (Gry → zakończona gra → Usuń).
