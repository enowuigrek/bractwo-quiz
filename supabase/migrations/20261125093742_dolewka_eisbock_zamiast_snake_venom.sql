-- „Piwny quiz Bractwa: dolewka”: Snake Venom jest dodatkowo wzmacniany alkoholem, więc zamiast niego eisbock
-- (prawdziwe wymrażanie bez dolewania). Grafika ta sama, plik przemianowany na eisbock.webp.
update public.zadania z
   set tresc = 'Ile procent alkoholu ma zwykle eisbock, czyli koźlak wymrażany?',
       grafika_url = '/grafiki/pytania/eisbock.webp',
       dane = '{"min": 3, "max": 30, "krok": 0.5, "poprawna": 9, "poprawna_do": 14, "jednostka": "%", "tolerancja": 5, "wyjasnienie": "Zwykle 9–14%. Z zamrożonego koźlaka usuwa się lód, a alkohol i smak zostają. Według legendy eisbock powstał przypadkiem, gdy beczki koźlaka zamarzły na mrozie na podwórzu browaru w Kulmbach."}'::jsonb
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null
   and z.tresc like 'Ile procent alkoholu ma Snake Venom%';
