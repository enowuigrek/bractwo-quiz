-- „O piwie” krótsze (28.10): 5 faktów i 3 najlepsze żarty (szklanka do połowy, płaci ktoś inny, ostatnie piwo),
-- reszta złotych przechodzi do „Odklejonych” (losowo). Żubr (koncern) usunięty jednorazowym skryptem.
update public.pijane_pytania
   set piwne = false
 where piwne and tresc in (
   'Pamiętasz, ile dziś było piw?',
   'Twoje piwo patrzy na ciebie z wyrzutem.',
   'Piana to piwo, które się wstydzi.',
   'Ziemia kręci się szybciej po trzecim piwie.'
 );
