-- Po przesunięciu krieka IBU i jęczmień stoją obok siebie i oba miały dobrą pod C: jęczmień pod D.
update public.zadania z
   set dane = z.dane || '{"poprawna": 3, "odpowiedzi": ["Pszenica", "Żyto", "Owies", "Jęczmień"]}'::jsonb
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and q.usunieto is null
   and z.tresc = 'Co to? Warzy się z tego większość piw.';
