-- Ciekawostka „Polski szampan”: dawne dzieje grodziskiego (24.10, prośba Łukasza). Rok 1301 to data z tradycji
-- (źródła nie wskazują dokumentu), statut piwowarski z 1601 roku jest udokumentowany: burmistrz z radą próbował
-- każdą beczkę i dopiero wtedy dostawała pieczęć.
update public.zadania
   set dane = jsonb_set(dane, '{tekst}', to_jsonb(
     'Grodziskie warzy się w całości ze słodu pszenicznego wędzonego dymem dębowym. Według tradycji warzono je już '
     || 'około 1301 roku, a od 1601 roku każdą beczkę próbował burmistrz z radą i dopiero wtedy dostawała pieczęć. '
     || 'Nazywano je polskim szampanem. W 1993 roku browar zamknięto, ale styl przetrwał dzięki piwowarom domowym, a dziś znów warzy się je w Grodzisku.'::text))
 where typ = 'ciekawostka' and tresc = 'Polski szampan';
