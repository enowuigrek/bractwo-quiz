-- „W którym mieście narodził się porter?” (28.10): pułapka Gdańsk (porter bałtycki) zamiast Monachium; Londyn pod D.
update public.zadania z
   set dane = z.dane || '{"odpowiedzi": ["Dublin", "Gdańsk", "Praga", "Londyn"], "poprawna": 3}'::jsonb
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and q.usunieto is null
   and z.tresc = 'W którym mieście narodził się porter?';
