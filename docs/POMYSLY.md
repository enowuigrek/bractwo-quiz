# Bractwo Quiz: pomysły na później

Rzeczy spoza MVP. Dopisujemy na bieżąco i wybieramy, co robimy po pierwszym evencie.

## Etapy

Etapy z planszą, mnożnikiem, finałem trójki jako serią i utrudnieniami w drugiej połowie finału są od 23.10 (PLAN.md). Na później:

- Własny ranking albo zwycięzca etapu (np. nagroda za najlepszy etap).
- Kreator, który sam proponuje podział na etapy według typów pytań.
- Utrudnienia do wyboru w panelu (które, od którego pytania), więcej efektów (np. odwrócony tekst, litery w rozsypce) i utrudnienia także poza finałem.

## Typy zadań

- Szacowanie liczby, prawda / fałsz, podpowiedzi i odsłaniana grafika są od 23.10. Degustacja na ślepo jest szablonem etapu; na później: pytanie o próbkę z literą próbki na TV.
- **Odpowiedź wpisywana:** gracz pisze tekst, a prowadzący zatwierdza go na pilocie (np. „Jaki to chmiel?”). Raczej na końcu listy: literówki na telefonie w barze i dużo klikania dla prowadzącego.
- **Ankieta bez punktów:** „Które piwo smakowało wam najbardziej?”. Wyniki pokazujemy na TV jako wykres.

## Mechaniki

- **Pewniak** (odłożony 23.10: bez minusowych punktów na razie): raz na etap (albo tylko w ostatnim) gracz przed odpowiedzią klika „Jestem pewien”. Trafi: ×2, nie trafi: traci tyle, ile mógł zyskać (wynik nie spada poniżej zera). Zwrot akcji pod koniec z wyboru gracza, a nie kara za samo granie.
- **Va banque na ostatnie pytanie:** każdy stawia część swoich punktów (np. 0–50%).
- **Passa:** bonus za kilka poprawnych odpowiedzi z rzędu, z licznikiem przy nicku. (Nie mylić z etapem „seria”, który już jest.)
- **Pełne drużyny:** kilka telefonów w jednej drużynie, wynik liczony jako średnia, żeby większa drużyna nie miała przewagi. (W MVP drużyna = jeden telefon.)
- **Ponowne użycie quizu:** ten sam zestaw pytań w kilku lokalach i porównanie wyników między miastami.
- **Historia i statystyki:** najtrudniejsze pytania, średni czas odpowiedzi, frekwencja.
- **Eksport wyników** do CSV. (Grafika podium do social mediów jest od 23.10.)

## Animacje i ekran TV

- **Selfie w stylu Bractwa (AI):** było 23.10 (przed dołączeniem gracz wybierał zwykłe albo przeróbkę z OpenAI, limit 40 na grę), ale na produkcji przeróbka się nie wyświetlała i funkcja wypadła. Przy powrocie najpierw sprawdzić w logach Vercela błąd OpenAI (`OpenAI (awatar):`), potem rozważyć przeróbkę w tle po dołączeniu. Tabela `przerobki_ai` czeka w bazie, kod jest w historii gita (commit fdcfbcd).

- **Więcej wyglądów wyścigu** (teraz jest „Wyścig po piwo” ze szklanką na mecie): np. beczki toczące się po ladzie, kufle przesuwane po barze. Wybór w ustawieniach rozgrywki, a przy dużej liczbie graczy tylko tabela.

- Na podium anioł i diabeł z nagłówka Szabli mogą „wręczać” miejsca (spójność z design systemem). Samo podium jest od dnia 5.
- Efekt „piany” przy wejściu nowego gracza do poczekalni (złoty blask na liderze rankingu już jest).
- Odliczanie jako napełniający się kufel zamiast paska.
- Dźwięki (start, koniec czasu, werble po finale, fanfara przy podium) z wyciszeniem na pilocie. Teraz TV jest cicha, a werble to sam obraz.
- **Pijany finał, pytania per quiz (do uporządkowania):** 24.10 na próbę z „Muzyką ponadczasową” jest prowizorka: tabela `pijane_pytania_quizu` (migracja `20261024193848`), którą funkcja `pijane_pytania` bierze zamiast wspólnej listy, gdy quiz gry ma tam wiersze. Panel jej nie pokazuje (wpisane migracją). Przy projekcie pijanego finału: wybór puli w panelu (wspólna albo własna quizu) i edycja obu.
- **Pijany finał, „wyniki ankiety”:** zliczanie odpowiedzi z dogrywki i zabawne napisy na TV (np. „83% uważa, że szklanka jest pełna”). Od 23.10 TV pokazuje w dogrywce tylko chaos z awatarami, a odpowiedzi nigdzie nie idą.
- **Kilka klipów wybuchu (pomysł Łukasza z 24.10):** więcej wersji `pekniecie.mp4` i losowanie jednej na grę (z kodu gry, żeby TV po przeładowaniu dostał ten sam). Przy każdym klipie sprawdzić `WYBUCH_S` (osobny dla klipu).
- **Pijany finał, pękająca szklanka (wideo AI, pomysł Łukasza z 24.10; zrobione 24.10, opis w PLAN.md):** pod koniec dogrywki, gdy nagłówek jest już nieostry, a awatary latają, szklanka na TV pęka i piwo rozlewa się po ekranie, a potem jest wygaszenie i werble jak teraz. Wykonalne, ok. pół dnia z próbami. Plan:
  1. **Wideo:** Figma Weave (MCP Figmy w Claude Code: `weave_find_model`, `weave_run_model`; modele wideo np. Veo 3) z obrazka startowego. Kadr startowy: zrzut pełnej szklanki z TV (scena 1920×1080, `.drogi-finalu-szklanka`, ok. 250 px szerokości) na czystej czerni, w tym samym rozmiarze i miejscu. Opis: szklanka pęka, piwo wylewa się i zalewa ekran; koniec prawie czarny, żeby płynnie przejść w błysk werbli. Bez napisów, bez marek. Każde uruchomienie kosztuje kredyty Weave: koszt pokazać Łukaszowi i uruchamiać po jego zgodzie.
  2. **Plik:** zwykłe MP4 (H.264, 1920×1080, bez dźwięku, kilka sekund, możliwie lekkie) w `public/wideo/`. Samsung w lokalu odtwarza takie sprzętowo (wideo czuwania już tak działa).
  3. **Podmiana na TV** (`ekran/_ekran/pijany.tsx`): `<video muted playsInline preload="auto">` zatrzymane na pierwszej klatce, nałożone na szklankę (cała scena albo prostokąt wokół szklanki). Czarne tło klipu stapia się z tłem TV przez `mix-blend-mode: screen`. W chwili startu chowamy naszą szklankę (`SzklankaPiwa`) i zostaje wideo. Model rzadko trzyma pierwszą klatkę idealnie, więc przeskok maskujemy tym, co już jest: rozmyciem (`--poziom`), kołysaniem i lotem awatarów; przed podmianą można na chwilę uspokoić kołysanie szklanki. Gdy plik się nie wczyta albo `play()` się nie uda, zostaje obecna szklanka (nic się nie psuje).
  4. **Moment startu:** dziś koniec jest nieprzewidywalny (`zakoncz_pijany` od pierwszego gracza, który skończy pytania, albo `pilot_akcja('werble')`). Trzeba, żeby oba nie dawały od razu `werble`, tylko ustawiały `faza_do = teraz + długość wideo` (faza zostaje `pijany`). TV odpala wideo, gdy do `faza_do` zostaje tyle, ile trwa klip (przy zwykłym końcu po 90 s też), a po czasie `dokoncz_pytanie` daje werble jak teraz. Telefony w tych sekundach mogą już pokazać werble (gracz, który skończył, i tak je widzi).
  5. **Test:** gra testowa bez lokalu, TV w 1920×1080; sprawdzić podmianę (czy nie widać szwu), start przy końcu od gracza, od pilota i po czasie, oraz brak pliku (szklanka zostaje).

## Organizacyjne

- Szablony quizów z gotowymi pytaniami (np. „Dzień Porteru”), które kopiuje się przed eventem. (Szablony z samymi etapami i liczbą pytań są od 23.10: „Klasyczny pub quiz” i „Bez etapów”. „Krótki” i „Degustacja” zniknęły z kreatora 23.10 i mogą wrócić, gdy będą potrzebne.)
- Biblioteka pytań wspólna dla wszystkich quizów, z tagami (style, historia, chmiele).
- Tryb próbny („na sucho”), który nie zapisuje wyników.
- **Zmiana nicku** przez gracza przed startem quizu.
- **Cofnięcie akcji na pilocie** („wstecz”), gdy prowadzący kliknie za wcześnie.
- **Prawdziwy limit prób logowania** do panelu. W MVP jest tylko opóźnienie po złym haśle.
- **Konta i uprawnienia:** osobne loginy (admin, kilku prowadzących, obsługa lokalu) zamiast dwóch haseł. Od 23.10 są role główny i obsługa (`src/lib/admin.ts`), a quizy i gry mają znacznik `tylko_glowny`: konta podmienią źródło roli i właściciela.
- **Selfie bez lampy błyskowej:** własny podgląd z przedniej kamery (`getUserMedia`) zamiast systemowego aparatu, którego błysku strona nie ustawi.
- **Wycinanie nagrody z tła bez API** (zamiast przeróbki OpenAI, wyłączonej 25.10): model w przeglądarce, np. `@imgly/background-removal` (ONNX, kilkadziesiąt MB pobierane raz, kilka sekund na zdjęcie na komputerze, wolniej na telefonie). Darmowe i bez klucza, ale ciężkie; sens tylko, jeśli zdjęcia nagród bez tła mają wyraźnie lepiej wyglądać na TV.
- **Boty: opcje** (od 25.10 są boty do testów w pilocie): poziom trudności, usuwanie botów jednym przyciskiem, boty w pijanym finale i kibicujące.
- **Wybór ikony etapu w panelu** (od 24.10 jest `etapy.ikona`, wpisywana migracją): lista gotowych ikon z `public/grafiki/etapy/` przy etapie w edytorze quizu.
- **Kopiowanie quizu** jednym przyciskiem w panelu (np. żeby przerobić zeszłoroczny Dzień Porteru).
- **Podgląd wybranej grafiki** przed zapisem i przycinanie logo do koła w panelu.
- **Przeciąganie pytań** zamiast strzałek ↑ ↓ przy długich quizach.
- **Podgląd pytania tak, jak zobaczy je TV** prosto z edytora.
- **Własne plansze na ekranie lokalu**, dodawane i zmieniane w panelu: grafiki, zapowiedzi wydarzeń (np. Dzień Porteru), ciekawostki piwne.
- **„Dłuższy czas” dla wybranych pytań** (np. ×2 przy grafice albo długiej treści), jeśli jeden czas na całą grę okaże się za mało elastyczny.
