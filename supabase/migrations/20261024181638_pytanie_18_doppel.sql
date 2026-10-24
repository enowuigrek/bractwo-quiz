-- Pytanie 18 (słowa oznaczające mocniejszą wersję stylu): „Doppel” bez podpowiedzi w nawiasie.
update public.zadania z
   set dane = jsonb_set(z.dane, '{odpowiedzi}', '["Session", "Imperial", "Light", "Double", "Doppel"]'::jsonb)
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego'
   and z.tresc = 'Które słowa w nazwie piwa oznaczają mocniejszą wersję stylu?';
