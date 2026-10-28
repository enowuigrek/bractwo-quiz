-- Pytanie 33 (28.10): „odmiany IPA” było mylące (American IPA to szeroka rodzina, NEIPA to jej odmiana).
-- Zamiast tego style od najstarszego: grodziskie (XIV w.), porter (XVIII w.), pils (1842), New England IPA (XXI w.).
update public.zadania z
   set tresc = 'Ułóż style od najstarszego',
       dane = '{"elementy": ["Pils", "New England IPA", "Grodziskie", "Porter"], "poprawna": [2, 3, 0, 1]}'::jsonb
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and q.usunieto is null
   and z.nr = 33 and z.tresc = 'Ułóż odmiany IPA od najstarszej';
