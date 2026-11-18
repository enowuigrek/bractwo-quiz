-- Plansze quizów JOWES (klasyczny i wyścig): pogrubienia (`**…**`) nagłówków, liczb i najważniejszych faktów oraz
-- uwagi i pułapki w ramce (akapit od „> ”); TV pokazuje je od 18.11 (tv.tsx, ZPogrubieniem i .tv-ramka).
update public.zadania z
   set dane = jsonb_set(z.dane, '{tekst}', to_jsonb(v.tekst))
  from public.quizy q, (values
    ('Gastronomia z misją – gdzie zjeść i co robią', '**Pieczone Kopytko** (Fundacja Talbota) · Częstochowa, ul. Powstańców Warszawy 147
Tradycyjna kuchnia polska, specjalność: **ręcznie robione pieczone kopytka**. Pomaga osobom wykluczonym wrócić do pracy.

**Niebo w Mieście** · Częstochowa, ul. Targowa 1
Restauracja i kawiarnia z **kuchnią włoską w zabytkowej kamienicy**. Imprezy okolicznościowe i dowóz.

> **Pułapka z pytania:** Alternatywa 21 (ul. Przemysłowa 14/16) to klubokawiarnia prowadzona przez **ZAZ, a nie przez PS**. Art of Dining status PS **dopiero uzyska** – trzymamy kciuki!'),
    ('Odpłatna czy gospodarcza? Ściąga', '**Działalność odpłatna pożytku publicznego**
• Tylko zadania pożytku publicznego wpisane do statutu.
• Cena najwyżej na poziomie kosztów bezpośrednich – **bez zysku**.
• Cały przychód idzie na działalność pożytku publicznego.
• **Nie wymaga** wpisu do rejestru przedsiębiorców.

**Działalność gospodarcza**
• **Może przynosić zysk** – w NGO idzie on na cele statutowe.
• **Wymaga wpisu** do rejestru przedsiębiorców KRS.

> **Uwaga:** gdy cena w odpłatnej przekroczy koszty bezpośrednie, z mocy prawa staje się ona **gospodarczą** (art. 9 ustawy o działalności pożytku publicznego i o wolontariacie).

Przykład: warsztat kosztuje 50 zł od osoby. Bilet za **50 zł = odpłatna**, za **80 zł = gospodarcza**.'),
    ('Pożyczki dla PES – ściąga', '**Pożyczka rozwojowa ARR Częstochowa**
• Do **5 mln zł**, do 100% inwestycji (brutto).
• Oprocentowanie **2%** stałe (de minimis).
• Spłata do 84 miesięcy, karencja do **12 miesięcy**.
• Decyzja do 14 dni roboczych od złożenia kompletu.

**Preferencyjna pożyczka TISE**
• „Na start” (1. rok): max 2 × 100 tys. zł, spłata do 5 lat.
• „Na rozwój”: do **2 mln zł**, spłata do 7 lat (do **10 lat** powyżej 400 tys. zł).
• Oprocentowanie **0,25%** stałe, bez prowizji i opłat.
• Karencja do 6 miesięcy, **weksel obowiązkowo**.

> Nabór na pożyczkę rozwojową ARR trwa **od 6.11.2026** – pula **20,5 mln zł**.'),
    ('Skąd się bierze 87 068 zł?', '43 814 zł – utworzenie miejsca pracy (wyposażenie, sprzęt, adaptacja, środki obrotowe)
+ 43 254 zł – utrzymanie: pełny etat przez 12 miesięcy (wynagrodzenie, składki, czynsz, media)
= **87 068 zł na jedno pełnoetatowe miejsce pracy**

• Obie stawki bierze się **tylko łącznie**.
• Trwałość: 12 miesięcy utrzymania + 6 miesięcy po finansowaniu = **18 miesięcy**.
• Niepełny etat: ¾ etatu – 32 441 zł, ½ etatu – 21 627 zł.
• Jeden PS może w naborze dostać wsparcie na **maks. 5 miejsc pracy**.
• Dodatkowo: refundacja Indywidualnego Planu Reintegracji do **10 800 zł**.

> Kwoty to stawki jednostkowe po indeksacji – źródło: jowes.pl/dotacje2026.'),
    ('Kto może utworzyć CIS?', '• **Organizacje pozarządowe** – np. fundacje i stowarzyszenia.
• **Podmioty kościelne.**
• **Spółdzielnie socjalne** zakładane przez osoby prawne.

> **Uwaga:** utworzenie CIS wymaga **decyzji wojewody** o nadaniu statusu Centrum Integracji Społecznej.')
  ) as v(tresc, tekst)
 where z.quiz_id = q.id
   and q.tytul like 'Jak dobrze znasz JOWES i siebie nawzajem?%'
   and q.usunieto is null
   and z.typ = 'ciekawostka'
   and z.tresc = v.tresc;
