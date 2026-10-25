-- Ciekawostka „Piwo z otwartego okna” wprost o fermentacji spontanicznej, o którą było pytanie chwilę wcześniej,
-- z tymi samymi stylami co w pytaniu (lambic, gueuze, kriek), żeby każdy połączył jedno z drugim (25.10, Łukasz).
update public.zadania
   set dane = jsonb_set(dane, '{tekst}', to_jsonb(
     'Tak powstają piwa fermentacji spontanicznej: lambic oraz robione z niego gueuze i kriek. Piwowar nie dodaje '
     || 'drożdży. Gorącą brzeczkę wylewa się na noc do płytkiej, szerokiej miedzianej kadzi (koelschip) na strychu '
     || 'browaru, przy otwartych oknach, a dzikie drożdże i bakterie z powietrza same zaczynają fermentację. Dlatego '
     || 'warzy się je tylko w chłodne miesiące.'::text))
 where typ = 'ciekawostka' and tresc = 'Piwo z otwartego okna';
