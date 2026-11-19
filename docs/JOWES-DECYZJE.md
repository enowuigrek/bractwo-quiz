# JOWES a Wyścig po piwo: co się zmieniło i co do decyzji

Spis zmian z 18.11.2026 (quiz firmowy JOWES na Forum PS 19.11), żeby punkt po punkcie zdecydować, co z tego zostaje
w quizie Bractwa, co staje się opcją w ustawieniach, a co zostaje tylko dla marki JOWES.

Przy każdym punkcie: **jak jest teraz** i **propozycja** (moja, do Twojej decyzji). Kolumna „Decyzja” jest do wypełnienia.

Skróty: **Bractwo** = adres quiz.bractwopiwne.pl (motyw Bractwa), **JOWES** = adres jowes-quiz.vercel.app (marka JOWES).

---

## 1. Zmiany silnika, które już działają też w Bractwie

To weszło do wspólnego kodu, więc najbliższa gra w Piwiarni też to ma. Do sprawdzenia, czy wszystko Ci pasuje.

| # | Co | Jak jest teraz (oba motywy) | Propozycja | Decyzja |
|---|---|---|---|---|
| 1.1 | **Liczba finalistów** | Ustawienie quizu (ołówek przy tytule, 2–8). Bractwo 3, JOWES 5. Gra, progi odpadania, plansze, telefon i pilot biorą ją z quizu. | Zostawić jako ustawienie. Dopisać do kreatora quizu (dziś tylko w edycji). | |
| 1.2 | **Kroki do mety w finale** | Ustawienie quizu (4–20). Bractwo 12, JOWES 10. | Zostawić. Przemyśleć zależność od finalistów: przy 5 osobach 10 kroków skraca finał, przy 3 osobach 12 było dobrze. | |
| 1.3 | **Nagrody domyślne quizu** | Quiz może mieć swoje nagrody (do 10 miejsc, też za miejsca poza podium). Kreator Bractwa dalej daje wybór nagród przy grze. JOWES: 3× grant, 2× nagroda pocieszenia. | Zostawić. W Bractwie: nagrody z kreatora nadpisują domyślne quizu (tak jest). Rozważyć edycję nagród quizu w panelu (dziś tylko migracją). | |
| 1.4 | **Wyjaśnienie po odpowiedzi** | Pole „Wyjaśnienie” w edytorze pytania. Na TV pokazuje się na ekranie odpowiedzi, na telefonie po wyniku. Do telefonu trafia dopiero w fazie wyniku. | Zostawić. W Bractwie to dobre miejsce na ciekawostkę o stylu bez osobnej planszy. | |
| 1.5 | **Do 8 odpowiedzi (litery do J)**, dłuższe odpowiedzi i plansze | Edytor przyjmuje do 8 odpowiedzi, odpowiedź do 200 znaków, wyjaśnienie do 600, plansza do 1500. | Zostawić. Przy 7–8 odpowiedziach TV robi się ciasny, więc w Bractwie trzymać się 4. | |
| 1.6 | **Plansze z formatowaniem** | `**pogrubienie**`, akapit od „> ” w ramce, linie od „- ” jako kafelki. Działa na TV i telefonie. | Zostawić. Dopisać ściągę formatowania przy polu planszy w edytorze (krótko, bez instrukcji „kliknij”). | |
| 1.7 | **Odpowiedź po końcu czasu** | Niezatwierdzone pary, kolejność, „kilka dobrych” i szacowanie wysyłają się same pół sekundy przed końcem. Pary i kolejność liczą się częściowo. | **Zmiana zasad także w Bractwie.** Zdecydować: zostawić (mniej frustracji) czy tylko w JOWES. Ja bym zostawił. | |
| 1.8 | **Limit graczy 70** (było 20) | Kreator domyślnie 70, baza domyślnie 70, boty do 70 („Dodaj 20 botów”). | Zostawić. W lokalu i tak przychodzi kilkanaście osób. | |
| 1.9 | **Ranking w dużej grze** | Powyżej 20 graczy TV po pytaniu pokazuje czołówkę 15 i „i jeszcze N graczy · swoje miejsce widzisz na telefonie”. Do 20 bez zmian (strony po 10). | Zostawić. Próg 20 i wielkość czołówki mogą być stałymi, nie ustawieniem. | |
| 1.10 | **Ekran odpowiedzi przy dużej grupie** | Powyżej 36 graczy: najszybsi dobrzy i liczby zamiast wszystkich nicków. Tabela końcowa na strony po 30. | Zostawić. | |
| 1.11 | **Licznik graczy w poczekalni** | Bez „/ limit”, sama liczba. | Zostawić. | |
| 1.12 | **Muzyka w pilocie** | Przełącznik wycisza samą muzykę, efekty grają dalej. | Zostawić. | |
| 1.13 | **Realtime** | Odpowiedzi i okrzyki idą tylko do TV i pilota (temat `sesja:KOD:tv`), telefony dostają zmiany stanu. | Zostawić. Mniej ruchu, szybsze telefony. | |
| 1.14 | **Fonty długich treści na TV** | Pytanie, odpowiedzi, plansza i tytuł w poczekalni mają mniejszy font powyżej progów długości. | Zastąpić automatycznym dopasowaniem (punkt 3.1). | |

## 2. Tylko w motywie JOWES (Bractwo bez zmian)

Każdy punkt to kandydat na **opcję marki albo quizu**: co JOWES wyłączył albo zmienił.

### Mechanika i zasady

| # | Co | Bractwo | JOWES | Propozycja | Decyzja |
|---|---|---|---|---|---|
| 2.1 | **Nazwy etapów** | Nazwy z szablonu („Na jedno”, „Jednak więcej”…). | Tylko numery („Etap 1”…), w panelu bez pola nazwy. | Ustawienie quizu: „nazwy etapów: pokazuj / tylko numery”. Nazwy w Bractwie zostają, bo budują klimat. | |
| 2.2 | **Pijany finał** | Jest, domyślnie włączony w kreatorze. | Wyłączony (nie ma go w kreatorze, serwer go odrzuca). | Opcja marki („dostępne tryby”). W Bractwie bez zmian. | |
| 2.3 | **Kranoprzejęcie** (gościnny browar) | Jest w kreatorze. | Ukryte. | Opcja marki. | |
| 2.3a | **Boty w pilocie** | Tylko twórca. | Każde zalogowane konto (Zbyszko testuje sam). | Opcja roli albo marki. Uwaga na boty w prawdziwej grze. | |
| 2.4 | **Nagrody w kreatorze i pilocie** | Wybór nagród przy grze, karta nagród w pilocie. | Brak, gra bierze nagrody z quizu. | Opcja quizu: „nagrody stałe z quizu” zamiast wpisywania przy każdej grze. Może się przydać i w Bractwie przy cyklicznych quizach. | |
| 2.5 | **„Gracie o: …”** przy szklance | Jest. | Nie ma (nie ma szklanki). | Wynika ze szklanki (2.7). | |
| 2.5a | **Pytania w finale na TV** (prośba Zbyszka) | Brak, w tym miejscu szklanka. | Przy każdej drodze chmurka z pytaniem, nad którym gracz teraz siedzi (sama treść, bez odpowiedzi). | W Bractwie można by ją dać pod drogami albo obok szklanki. Do sprawdzenia na TV. | |
| 2.6 | **„Piwu Cześć!”** na końcu | Jest. | Nie ma. | Pożegnanie jako tekst marki. | |

### Wygląd

| # | Co | Bractwo | JOWES | Propozycja | Decyzja |
|---|---|---|---|---|---|
| 2.7 | **Szklanka, lada, nalewanie** w wyścigu | Szklanka na mecie nalewa się z pytaniami, tory po ladzie. | Bez szklanki, tory na całą szerokość, tło z logo lokalu. | Element marki („meta wyścigu”: szklanka albo nic, w przyszłości inna grafika, np. puchar). | |
| 2.8 | **Tło baru z nastrojami** | Jest. | Jasne tło z dużym logo JOWES. | Marka. | |
| 2.9 | **Kolory i czcionka** | Ciemny, złoty, Open Sans. | Jasny, pomarańczowy #e58e00, Nunito (jak jowes.pl). | Marka (kolory i czcionka w bazie). | |
| 2.10 | **Awatary** | Kapsle z ząbkami. | Koła jak logo JOWES. | Marka („kształt awatara”). | |
| 2.11 | **Logo** | Bractwo w rogu nagłówków, Bractwo + lokal w poczekalni. | JOWES zamiast Bractwa, logo lokalu tylko w tle (bez podwójnego logo). | Marka. | |
| 2.12 | **Ikony etapów** | Z piwem. | Bez piwa (`IKONY_NEUTRALNE`). | Marka (zestaw ikon). | |
| 2.13 | **Przykładowe pytania** w animacji etapu | Porter bałtycki itd. | „Wieloryb jest ssakiem” itd. | Marka. Albo przykłady z pierwszych pytań quizu (bez zdradzania odpowiedzi). | |
| 2.14 | **Okrzyki kibiców** | „…, piwo czeka!” | „…, meta czeka!” | Słownik tekstów marki. | |
| 2.15 | **Podium** | Złoto, srebro, brąz. | Ciemniejsze srebro i brąz (na jasnym tle). | Kolory marki. | |
| 2.16 | **Favicon, miniatura linku, tytuł strony** | Bractwo Quiz. | Koło JOWES, jasna miniatura „Quiz na żywo”, tytuł „Quiz”. | Marka. | |
| 2.17 | **Efekty dźwiękowe** | Wszystkie, z nalewaniem po pytaniu. | Te same bez nalewania. | Marka (zestaw dźwięków). Muzyka ta sama. | |
| 2.18 | **Grafika „na pamiątkę”** | Ciemna, z logo Bractwa i „Piwu Cześć!”. | Jasna, z samym logo JOWES (na telefonie zamiast kibicowania). | Marka. | |

### Teksty

| # | Co | Bractwo | JOWES | Propozycja | Decyzja |
|---|---|---|---|---|---|
| 2.19 | **Nazwy rodzajów** | „Wyścig po piwo”, „Pub quiz”. | „Wyścig”, „Quiz klasyczny”. | Słownik marki. | |
| 2.20 | **Panel** | „Mój lokal”. | „Moja organizacja”. | Słownik marki. | |
| 2.21 | **„Do piwa” w tekstach** | „Kto pierwszy do piwa”, „wyścig do piwa”. | „Do mety”. Opisy etapów z bazy podmieniane regexem. | Słownik marki zamiast ok. 44 rozgałęzień w kodzie. Opis etapu osobno dla marki. | |
| 2.22 | **Przykłady w polach panelu** | „np. Dzień Porteru”, „np. Portery i stouty”. | „np. Forum PS”. | Słownik marki. | |

## 3. Łatki do zastąpienia czymś mądrzejszym

| # | Co | Jak jest | Propozycja |
|---|---|---|---|
| 3.1 | **Dopasowanie fontu** | Progi długości (np. pytanie powyżej N znaków → klasa `dlugi`), dobrane pod pytania JOWES. Inny quiz z inną długością może się nie zmieścić albo wyjść za mały. | Automatyczne dopasowanie: ekran mierzy, czy treść się mieści, i zmniejsza font krokami do minimum (jak już robi plansza etapu na TV). Jedna funkcja dla pytania, odpowiedzi, planszy i tytułu. Trzeba sprawdzić na Samsungu i w prostym ekranie (Chrome 69). |
| 3.2 | **Motyw z adresu strony** | Lista hostów w zmiennej Vercela, logo JOWES wpisane w kod. | Marka w bazie: organizacja → domena, logo, kolory, czcionka, słownik, wyłączone elementy. Bractwo jako jedna z marek. |
| 3.3 | **Domyślne liczby** | „3 finalistów” i „12 kroków” wciąż w kilku napisach (tworzenie quizu, edytor, strona zasad). | Jedna stała i napisy z quizu (lista w `POMYSLY.md`, „Porządki po JOWES”). |
| 3.4 | **Treść quizów JOWES** | Wgrywana migracjami ze skryptów. | Import pytań z pliku (`.md` jak eksport) w panelu, żeby firma mogła wkleić swój quiz sama. |

## 4. Pytania, które warto przemyśleć przy okazji

- **Czy finał zależy od liczby graczy?** 3 finalistów z 15 osób to co piąta osoba, z 50 osób to 6%. Może liczba finalistów i progi odpadania powinny rosnąć z grupą (np. domyślnie, z możliwością zmiany).
- **Czy wyścig ma mieć zmienną metę?** Szklanka w Bractwie, nic w JOWES. Dla innych firm może być puchar, logo albo produkt firmy. Wtedy „meta” to grafika marki.
- **Długość gry.** JOWES ma 38 pytań i 4 plansze. Warto mieć w kreatorze szacowany czas gry z ustawień (pytania × czasy + plansze), żeby prowadzący wiedział, ile to potrwa.
- **Kto edytuje quiz w firmie.** Zbyszko dostał rolę lokalu JOWES. Dla firm przydałaby się rola „organizacja” z prostszym panelem (bez lokali, ekranów i Instagramu).
- **Ekran bez lokalu.** JOWES gra na jednym ekranie na wydarzeniu, a nie w lokalu z ekranem na stałe. Może „wydarzenie” zamiast „lokalu” dla firm.
