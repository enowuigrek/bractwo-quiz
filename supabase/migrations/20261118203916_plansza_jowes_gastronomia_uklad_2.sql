-- Plansza „Gastronomia z misją” w quizie JOWES (wyścig), drugi raz (18.11): edycja w panelu zwinęła nowe linie (zapis
-- zamieniał je na spacje, poprawione w quizy/akcje.ts). Aktualna treść Zbyszka („restauracja w stylu włoskim”) w
-- układzie jak inne plansze: lokal w osobnym akapicie, nazwa pogrubiona z adresem, najważniejsze fakty pogrubione.
update public.zadania z
   set dane = jsonb_set(z.dane, '{tekst}', to_jsonb($t$**Pieczone Kopytko** (Fundacja Talbota) · Częstochowa, ul. Powstańców Warszawy 147
Domowe obiady i polskie klasyki: **ręcznie robione pieczone kopytka** i pierogi. Restauracja powstała dzięki **dotacji JOWES na 5 miejsc pracy**, a Fundacja Talbota prowadzi też CIS.

**Niebo w Mieście** (Niebo w Mieście Częstochowa sp. z o.o.) · Częstochowa, ul. Mirowska 4
Restauracja w **stylu włoskim**, owoce morza, własne ciasta i torty bezowe. Przytulna piwnica, ogród i taras. Organizują imprezy okolicznościowe i mają ofertę dla firm i grup.

**Klubokawiarnia Alternatywa 21** (Spółdzielnia Socjalna „Jasne, że alternatywa 21”) · Częstochowa, ul. Przemysłowa 14/16 (wejście od ul. Mielczarskiego 20)
Lunche, domowe obiady, **kuchnia wegańska**, ciasta i pyszna kawa, do tego catering. Spółdzielnię założyły w 2016 r. Miasto Częstochowa i Fundacja „Oczami Brata”. Prowadzi też kawiarnię na Starym Rynku i **ZAZ, w którym pracuje 30 osób**.

**Fundacja Art of Dining** (restauracja Garden) · Częstochowa, al. NMP 28 (w podwórku)
„Smak, który łączy ludzi”: **ukryty ogród w centrum miasta**. Fundacja zajmie się cateringiem i wydarzeniami: kolacje degustacyjne, warsztaty kulinarne, koncerty.$t$::text))
  from public.quizy q, public.lokale l
 where z.quiz_id = q.id
   and l.id = q.lokal_id
   and l.adres_ekranu = 'jowes'
   and q.tytul = 'Quiz JOWES'
   and q.usunieto is null
   and z.typ = 'ciekawostka'
   and z.tresc = 'Gastronomia z misją – gdzie zjeść i co robią';
