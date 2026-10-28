-- „Które miasta dały nazwę własnemu stylowi piwa?” (28.10): szósta, myląca odpowiedź Gdańsk (kojarzy się z porterem
-- bałtyckim i piwem jopejskim, ale żaden styl nie nosi jego nazwy). Dobre: Pilzno, Kolonia, Grodzisk Wielkopolski.
update public.zadania z
   set dane = z.dane || '{"odpowiedzi": ["Pilzno", "Gdańsk", "Kolonia", "Madryt", "Oslo", "Grodzisk Wielkopolski"], "poprawna": [0, 2, 5]}'::jsonb
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and q.usunieto is null
   and z.tresc = 'Które miasta dały nazwę własnemu stylowi piwa?';
