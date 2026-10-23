-- Piwo w dopełniaczu to „porteru”, nie „portera” (porter jako człowiek). Pytanie w finale quizu o piwie.
update public.zadania
   set tresc = replace(tresc, 'wersję portera', 'wersję porteru')
 where tresc = 'Słowo „stout” pierwotnie określało mocniejszą wersję portera.';
