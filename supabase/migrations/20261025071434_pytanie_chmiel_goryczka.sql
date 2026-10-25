-- Pytanie z grafiką chmielu: „ma goryczkę” zamiast „jest gorzkie” (25.10, Łukasz)
update public.zadania
   set tresc = 'To dzięki temu piwo ma goryczkę. Co to?'
 where tresc = 'To dzięki temu piwo jest gorzkie. Co to?';
