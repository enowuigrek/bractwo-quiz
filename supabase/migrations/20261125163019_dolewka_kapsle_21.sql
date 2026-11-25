-- „Piwny quiz Bractwa: dolewka”: nowa grafika kapsli z ok. 21 ząbkami (pierwsza miała ok. 25), pod nową nazwą pliku.
update public.zadania z set grafika_url = '/grafiki/pytania/kapsle-21.webp'
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null
   and z.tresc = 'Ile ząbków ma kapsel?';
