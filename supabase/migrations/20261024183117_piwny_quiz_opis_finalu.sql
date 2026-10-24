-- Piwny quiz Bractwa Piwnego: opis finału po zmianie na wyścig z przewagą.
update public.etapy e
   set opis = 'Trzej najlepsi ścigają się do piwa: każda dobra odpowiedź to krok, a lider ma kilka kroków przewagi. Kto pierwszy dobiegnie, wygrywa.'
  from public.quizy q
 where q.id = e.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and e.finalowy;
