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
- **Pijany finał, „wyniki ankiety”:** zliczanie odpowiedzi z dogrywki i zabawne napisy na TV (np. „83% uważa, że szklanka jest pełna”). Od 23.10 TV pokazuje w dogrywce tylko chaos z awatarami, a odpowiedzi nigdzie nie idą.

## Organizacyjne

- Szablony quizów z gotowymi pytaniami (np. „Dzień Porteru”), które kopiuje się przed eventem. (Szablony z samymi etapami i liczbą pytań są od 23.10: „Klasyczny pub quiz” i „Bez etapów”. „Krótki” i „Degustacja” zniknęły z kreatora 23.10 i mogą wrócić, gdy będą potrzebne.)
- Biblioteka pytań wspólna dla wszystkich quizów, z tagami (style, historia, chmiele).
- Tryb próbny („na sucho”), który nie zapisuje wyników.
- **Zmiana nicku** przez gracza przed startem quizu.
- **Cofnięcie akcji na pilocie** („wstecz”), gdy prowadzący kliknie za wcześnie.
- **Prawdziwy limit prób logowania** do panelu. W MVP jest tylko opóźnienie po złym haśle.
- **Kopiowanie quizu** jednym przyciskiem w panelu (np. żeby przerobić zeszłoroczny Dzień Porteru).
- **Podgląd wybranej grafiki** przed zapisem i przycinanie logo do koła w panelu.
- **Przeciąganie pytań** zamiast strzałek ↑ ↓ przy długich quizach.
- **Podgląd pytania tak, jak zobaczy je TV** prosto z edytora.
- **Własne plansze na ekranie lokalu**, dodawane i zmieniane w panelu: grafiki, zapowiedzi wydarzeń (np. Dzień Porteru), ciekawostki piwne.
- **„Dłuższy czas” dla wybranych pytań** (np. ×2 przy grafice albo długiej treści), jeśli jeden czas na całą grę okaże się za mało elastyczny.
