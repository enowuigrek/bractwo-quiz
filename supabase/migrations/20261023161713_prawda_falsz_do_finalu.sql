-- Pojedyncze pytania prawda/fałsz (etap „Błyskawica” w Serialach i Filmach, cztery w Rozgrzewce Piwa)
-- przechodzą do finału serią: tam prawda/fałsz gra się we własnym tempie. Puste etapy usuwa się w panelu.
update public.zadania z
   set etap_id = f.id,
       nr = z.nr + 100
  from public.etapy e, public.etapy f, public.quizy q
 where z.etap_id = e.id
   and e.quiz_id = q.id
   and f.quiz_id = q.id
   and f.finalowy
   and z.typ = 'prawda_falsz'
   and not e.seria
   and (
     (q.tytul in ('Seriale · quiz testowy', 'Filmy · quiz testowy') and e.nazwa = 'Błyskawica')
     or (q.tytul = 'Piwo - quiz testowy' and e.nazwa = 'Rozgrzewka')
   );

select public.admin_uporzadkuj_quiz(q.id)
  from public.quizy q
 where q.tytul in ('Seriale · quiz testowy', 'Filmy · quiz testowy', 'Piwo - quiz testowy');
