-- „Piwny quiz Bractwa: dolewka”: grafiki do pytania o ząbki kapsla i ciekawostki „Korona na butelce” (od Łukasza, Gemini).
update public.zadania z set grafika_url = '/grafiki/pytania/' || v.plik
  from public.quizy q, (values
    ('Ile ząbków ma kapsel?', 'kapsle.webp'),
    ('Korona na butelce', 'kapsel-warsztat.webp')
  ) as v(tresc, plik)
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null and z.tresc = v.tresc;
