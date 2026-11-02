# Degustacja: scenariusz (szkic 02.11)

Trzeci rodzaj wieczoru obok „Wyścigu po piwo” i „Klasycznego pub quizu”. Ten sam układ co w quizie: TV w lokalu, telefony gości z kodem, pilot u prowadzącego, gry na listach w panelu. Zamiast pytań są piwa: goście je oceniają, TV pokazuje, co sala o nich myśli, a na koniec jest ranking piw.

Szkic do omówienia: na końcu są decyzje, które musi podjąć Łukasz, zanim zaczniemy kodować.

## Dwa warianty

- **Jawna:** prowadzący mówi, co nalewa, a TV od razu pokazuje etykietę, browar, styl i moc. Goście oceniają i opisują. Bez punktów dla graczy, wynikiem jest ranking piw. Do premier, kranoprzejęć, wieczorów z browarem.
- **Ślepa:** piwa są pod numerami („Piwo 3”), a goście poza oceną zgadują styl i moc. Odsłona po każdym piwie pokazuje etykietę i kto trafił. Na koniec są dwa rankingi: piw i gości („Najlepszy nos wieczoru”).

## Przygotowanie (panel)

Degustacja to quiz z samymi piwami, w osobnej zakładce „Degustacje” obok „Wyścig po piwo” i „Pub quiz”. Przycisk „Nowa degustacja”, tak samo jak dziś „Nowy pub quiz”.

Dla każdego piwa na liście (kolejność ustawia prowadzący):
- nazwa, browar, styl (z listy stylów, z możliwością wpisania własnego), moc (% alk.), opcjonalnie IBU,
- zdjęcie etykiety albo puszki (to samo pole grafiki co w pytaniach),
- krótki opis dla prowadzącego (widzi go tylko pilot),
- w ślepej: trzy mylące style do wyboru (albo dobrane same z listy stylów podobnych).

W kreatorze gry, jak dziś: lokal, godzina, browar gościnny (logo w nagłówku, co już mamy przy kranoprzejęciu) i przełącznik „ślepa”.

## Przebieg wieczoru

### 1. Poczekalnia
Bez zmian: QR, kod, kapsle gości. TV w nagłówku pokazuje „Degustacja” i logo browaru, jeśli jest.

### 2. Plansza wstępu
- **TV:** lista piw wieczoru. W jawnej z nazwami i etykietami, w ślepej numerowane kieliszki z pytajnikami.
- **Telefon:** „Zaraz zaczynamy”.

### 3. Każde piwo
**a) Nalewanie** (prowadzący przełącza pilotem, gdy piwo trafiło na stoły)
- **TV:** duży numer piwa. W jawnej etykieta, browar, styl i moc; w ślepej sam numer i kieliszek.
- **Telefon:** formularz oceny otwiera się od razu, bez zegara. Degustacji się nie pogania, a prowadzący zamyka ocenianie, kiedy sala skończy.

**b) Ocena (telefon)**
- **Ocena ogólna:** 1–5 gwiazdek z połówkami (decyzja niżej).
- **Aromaty i smaki:** kafelki, do 3 wyborów. Lista: cytrusy, owoce tropikalne, owoce czerwone, kwiaty, zioła i żywica, chleb i herbatniki, karmel, kawa i czekolada, palone, przyprawy, kwaśne, drewno i beczka, dym.
- **Goryczka:** suwak od „łagodne” do „gorzkie” (opcjonalnie).
- **Ślepa:** styl (wybór z 4) i moc (suwak, jak dziś w szacowaniu).
- Przycisk „Gotowe”, po którym ocenę można jeszcze poprawić, dopóki ocenianie trwa.

**Ocena (TV w tym czasie)**
- Licznik „oceniło 12 z 15” i kapsle, które się zapalają. Bez średniej, żeby głośniejsi nie ustawiali sali.
- Chmura aromatów rośnie na żywo. Słowa, które wybiera więcej osób, robią się większe. Ożywia ekran i nie zdradza ocen.

**c) Odsłona** (prowadzący: „Pokaż wyniki”)
- **TV:** średnia ocena dużymi cyframi, rozkład gwiazdek, trzy najczęstsze aromaty. W ślepej najpierw pojawia się etykieta, a potem: ilu trafiło styl i kto był najbliżej mocy.
- **Telefon:** twoja ocena obok średniej sali. W ślepej punkty za to piwo.

**d) Ranking (tylko ślepa, opcjonalnie)**
Tabela gości jak w pub quizie. W jawnej ten krok odpada i po odsłonie jest następne piwo.

### 4. Podsumowanie
- **TV:** podium piw, czyli trzy najwyżej ocenione: etykiety na stopniach podium, średnia i liczba ocen. Potem cała lista piw w kolejności ocen. W ślepej dodatkowo podium gości, a koniec gry pokazuje oba na zmianę, jak dziś podium i tabelę.
- **Telefon:** „Twoja degustacja”, czyli wszystkie piwa z twoimi ocenami i aromatami obok średniej sali, do zrobienia zrzutu. Na dole „Do zobaczenia na kolejnej degustacji. Piwu Cześć!”.

## Pilot

Ten sam układ i zasada stałych przycisków:
- **Ramka stanu:** „Piwo 3 z 6 · oceniło 12/15” i nazwa piwa (prowadzący widzi ją także w ślepej).
- **Główny przycisk** zmienia napis po kolei: „Nalej piwo 3” → „Pokaż wyniki” → „Następne piwo” → „Podsumowanie”.
- **Zwijane karty:** opis piwa dla prowadzącego, oceny na żywo (średnia i rozkład tylko dla niego), gracze.
- Automat i boty jak dziś, do testów (boty losują oceny i aromaty).

## Punkty w ślepej
Liczy serwer, jak wszystko:
- trafiony styl: 1000 pkt,
- moc: do 1000 pkt, im bliżej, tym więcej (ta sama krzywa co w szacowaniu),
- czas nie daje punktów, bo degustacji się nie pogania.

## Po wieczorze (panel)
- Strona gry: ranking piw, rozkład ocen każdego piwa, aromaty i liczba ocen.
- Statystyki piwa wielu degustacji (np. to samo piwo w dwóch lokalach), jeśli piwa trafią do wspólnego katalogu (decyzja niżej).
- Strona lokalu: jego degustacje i najwyżej oceniane piwa.

## Jak to zbudować na tym, co już mamy
- **Piwo to nowy rodzaj zadania `piwo`**, jak dziś `ciekawostka`. Dane: nazwa, browar, styl, moc, IBU, mylące style. Rozwiązanie (styl i moc) baza ukrywa do fazy `wynik`, jak każde rozwiązanie.
- **Fazy jak w pub quizie:** `pytanie` (ocenianie, bez zegara, czyli tryb „bez limitu”, który już istnieje), `wynik` (odsłona), opcjonalnie `ranking`, na koniec `podium` i `tabela`. Nowych faz w bazie nie trzeba albo prawie nie trzeba.
- **Rodzaj wieczoru** wynika z zadań: quiz złożony z samych piw to degustacja, tak jak dziś pub quiz wynika z braku etapów. Nowe funkcje TV, telefonu i pilota dostają osobne widoki dla `piwo` (formularz oceny, chmura, podium piw).
- **Odpowiedź** to jeden wiersz w `odpowiedzi` z ocenami w JSON (gwiazdki, aromaty, goryczka, styl, moc). Średnie i chmurę liczy funkcja w bazie.
- **Wspólne zostaje:** poczekalnia z QR, kapsle, nagłówki z logami, muzyka (spokojniejsza, ciszej, bo prowadzący mówi), lista gier, konta i uprawnienia.
- **Bonus:** pojedyncze piwo można by wstawić do zwykłego pub quizu jako rundę degustacyjną.

## Decyzje dla Łukasza
1. **Skala:** gwiazdki 1–5 z połówkami (jak Untappd) czy 1–10?
2. **Ślepa:** przełącznik dla całego wieczoru czy dla każdego piwa? Dla piwa pozwoliłoby zrobić jedno ślepe na koniec jako zagadkę.
3. **Aromaty:** czy powyższa lista jest dobra i czy ma być goryczka?
4. **Katalog piw:** piwa wpisywane osobno do każdej degustacji (prościej) czy wspólna baza piw Bractwa (statystyki tego samego piwa w różnych lokalach)?
5. **Notatki tekstowe gości:** pole „moja notatka” na telefonie, widoczne tylko dla gościa?
6. **Muzyka:** cicha cały wieczór czy tylko w poczekalni i na podsumowaniu?
7. **Kto może prowadzić:** Bractwo i lokale, jak quizy?
