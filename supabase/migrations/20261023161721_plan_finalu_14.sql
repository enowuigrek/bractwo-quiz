-- Po przeniesieniu pytań prawda/fałsz finały Piwa, Seriali i Filmów mają po 14 pytań.
update public.etapy e
   set plan_pytan = 14
  from public.quizy q
 where e.quiz_id = q.id
   and e.finalowy
   and e.plan_pytan = 10
   and q.tytul in ('Seriale · quiz testowy', 'Filmy · quiz testowy', 'Piwo - quiz testowy');
