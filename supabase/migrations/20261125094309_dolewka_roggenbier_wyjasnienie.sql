-- „Piwny quiz Bractwa: dolewka”: wyjaśnienie przy roggenbierze tylko o życie, bez witbiera.
update public.zadania z
   set dane = jsonb_set(z.dane, '{wyjasnienie}', to_jsonb('Roggen to po niemiecku żyto. Roggenbier warzy się co najmniej w połowie ze słodu żytniego, stąd jego korzenny smak.'::text))
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null
   and z.tresc = 'Które z tych stylów warzy się z dużym dodatkiem żyta?';
