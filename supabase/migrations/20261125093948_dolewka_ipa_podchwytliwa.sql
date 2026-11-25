-- „Piwny quiz Bractwa: dolewka”: w pytaniu o IPA zamiast „Irish Porter Ale” podchwytliwe „Indian Pale Ale”.
update public.zadania z
   set dane = '{"poprawna": 2, "odpowiedzi": ["Imperial Pale Ale", "International Premium Ale", "India Pale Ale", "Indian Pale Ale"], "wyjasnienie": "India Pale Ale: jasne ale warzone w Anglii na eksport do Indii. „Indian” to częsty błąd, bo nazwa mówi o kraju, a nie o mieszkańcach."}'::jsonb
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null
   and z.tresc = 'Co oznacza skrót IPA?';
