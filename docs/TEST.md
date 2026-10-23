# Bractwo Quiz: test z telefonami i lista przed eventem

## Przed eventem (dzień wcześniej)

1. Na `/api/keepalive` (adres aplikacji + `/api/keepalive`) ma być `"ok": true` i `"realtime": "SUBSCRIBED"`. Jeśli jest ustawiony `CRON_SECRET`, bez nagłówka dostaniesz 401. Wtedy sprawdź w Vercelu: Project → Settings → Cron Jobs → Run.
2. W panelu: quiz ma wszystkie pytania, poprawne odpowiedzi są zaznaczone, a grafiki się wczytują.
3. W panelu: uruchom grę (miasto → lokal → quiz, okazja, tryb, bonus za szybkość).

## Na miejscu (30 min przed)

1. Telewizor: przeglądarka na pełnym ekranie (F11), ekran lokalu z zakładek (`/ekran/<adres-lokalu>`, adres w panelu: ⚙ → lokal). Bez gry lecą plansze, a po uruchomieniu gry ekran sam przechodzi do poczekalni. Wyłącz wygaszacz i usypianie ekranu.
2. Telefon prowadzącego: zeskanuj QR pilota z ekranu gry w panelu. Pilot zapamięta się po odświeżeniu.
3. Sprawdź Wi‑Fi lokalu albo zasięg LTE w sali. Każdy telefon potrzebuje internetu.
4. Ty dołączasz jako pierwszy gracz i sprawdzasz, że nick pojawia się na TV.

## Scenariusz testu (kilka telefonów, ok. 15 min)

Ustaw quiz z 3–4 pytaniami: jedno z grafiką, jedno z 6 odpowiedziami. Czas na odpowiedź wybierasz przy uruchamianiu gry (do testu krótki, 10 s; drugą grę puść „bez limitu”).

| # | Co zrobić | Czego oczekiwać |
|---|---|---|
| 1 | Gracze skanują QR z TV, wpisują nicki | Nicki wskakują na TV w ciągu ~1 s. Ten sam nick drugi raz jest odrzucony. |
| 2 | Jeden gracz odświeża stronę | Wraca do gry z tym samym nickiem, bez wpisywania. |
| 3 | Pilot: Start quizu | TV i telefony odliczają 3‑2‑1 i odsłaniają pytanie w tym samym momencie. |
| 4 | Gracze odpowiadają w różnym tempie | Na TV rośnie „Odpowiedziało x/y”. Telefon pokazuje „Odpowiedź zapisana (3,4 s)”. |
| 5 | Wszyscy odpowiadają | Zegar kończy się od razu, TV pokazuje „Czas minął!”. |
| 6 | Pilot: Pokaż wynik | TV: poprawna na zielono, słupki, najszybszy. Telefon: „Dobrze! +… pkt” albo „Niestety źle”, miejsce. |
| 7 | Jeden gracz nie odpowiada, a jeden blokuje ekran telefonu w trakcie pytania | Po odblokowaniu telefon dogania grę. Bez odpowiedzi jest „Brak odpowiedzi”. |
| 8 | Pilot: Pokaż wynik, zanim minie czas | Pyta o potwierdzenie i kończy pytanie. |
| 9 | Pilot: Pokaż odpowiedzi graczy, potem Pokaż ranking | TV: zielona ramka z dobrymi od najszybszego, czerwona ze złymi, przy każdym odpowiedź i czas, na dole bez odpowiedzi. Potem ranking: przetasowanie, „+zdobyte”, strzałki. Telefon: miejsce i zmiana. |
| 10 | Ostatnie pytanie → Pokaż podium → Pokaż pełną tabelę → Zakończ grę | Podium wjeżdża 3 → 2 → 1. Tabela: wszyscy gracze z punktami. Na końcu podziękowanie. |
| 11 | Wyłącz na chwilę Wi‑Fi na TV | W rogu „Brak połączenia, ponawiam…”, a po powrocie sieci TV dogania grę sam. |
| 12 | Gra uruchomiona z czasem „bez limitu” | TV, telefon i pilot pokazują „Bez limitu”, bez paska czasu. Po ostatniej odpowiedzi: „Wszyscy odpowiedzieli”. „Pokaż wynik”, zanim wszyscy odpowiedzą, pyta o potwierdzenie. Poprawna = 1000 pkt. |

Do zanotowania po teście (dzień 7):
- czy bonus za szybkość jest sprawiedliwy (przełącznik przy uruchamianiu gry),
- czy czasy pytań i 5 s odliczania pasują,
- czy coś na TV jest za małe z końca sali,
- błędy i dziwne zachowania: kiedy, na jakim telefonie i w jakiej przeglądarce.

Po teście usuń grę w panelu (Gry → zakończona gra → Usuń).
