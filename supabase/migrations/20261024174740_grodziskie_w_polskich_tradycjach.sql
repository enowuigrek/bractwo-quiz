-- Piwny quiz Bractwa Piwnego, pytanie o polskie tradycje piwowarskie: grodziskie musi być wśród odpowiedzi
-- (dla Łukasza najważniejsze). Zamiast koźlaka (zła odpowiedź) wchodzi grodziskie jako trzecia dobra.
update public.zadania z
   set dane = '{"odpowiedzi": ["Grodziskie", "Kölsch", "Piwo jopejskie", "Saison", "Porter bałtycki"], "poprawna": [0, 2, 4]}'
  from public.quizy q
 where q.id = z.quiz_id
   and q.tytul = 'Piwny quiz Bractwa Piwnego'
   and z.tresc = 'Które z tych piw to polskie tradycje piwowarskie?';
