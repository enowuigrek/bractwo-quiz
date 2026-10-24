-- Piwny quiz Bractwa Piwnego: finał jako wyścig ma pulę 30 pytań prawda/fałsz (14 + 16 nowych, w każdej grze
-- w innej kolejności, wspólnej dla finalistów) i 180 s zamiast 120 s (dłuższy niż pijany finał, 60 s).
do $$
declare
  v_quiz uuid;
  v_final uuid;
  v_nr int;
begin
  select id into v_quiz from public.quizy where tytul = 'Piwny quiz Bractwa Piwnego';
  if v_quiz is null then
    raise exception 'Nie ma quizu „Piwny quiz Bractwa Piwnego”';
  end if;
  select id into v_final from public.etapy where quiz_id = v_quiz and finalowy;
  update public.etapy set czas_s = 180 where id = v_final;
  select max(nr) into v_nr from public.zadania where quiz_id = v_quiz;

  insert into public.zadania (quiz_id, etap_id, nr, typ, tresc, dane, czas_s)
  select v_quiz, v_final, v_nr + t.i, 'prawda_falsz', t.tresc,
         jsonb_build_object('poprawna', t.poprawna, 'odpowiedzi', jsonb_build_array('Prawda', 'Fałsz')), 20
    from (values
      (1, 'Porter bałtycki fermentuje się zwykle drożdżami dolnej fermentacji.', 0),
      (2, 'Saison pochodzi z Holandii.', 1),
      (3, 'Skala IBU mierzy kolor piwa.', 1),
      (4, 'Chmiel dodany na początku gotowania daje głównie goryczkę, a pod koniec głównie aromat.', 0),
      (5, 'Kölsch podaje się tradycyjnie w wąskich szklankach zwanych Stange.', 0),
      (6, 'Imperial stout warzono kiedyś na eksport na dwór carski w Rosji.', 0),
      (7, 'Stout zawdzięcza czarną barwę palonemu jęczmieniowi.', 0),
      (8, 'W Polsce piwo bezalkoholowe może mieć najwyżej 0,5% alkoholu.', 0),
      (9, 'Lambic po kilku dniach fermentacji od razu trafia do butelek.', 1),
      (10, 'Słód karmelowy rozjaśnia kolor piwa.', 1),
      (11, 'Pilzner pochodzi z Bawarii.', 1),
      (12, 'Drożdże piwne to grzyby.', 0),
      (13, 'Bananowy aromat hefeweizena pochodzi z dodatku owoców.', 1),
      (14, 'Gose warzy się z dodatkiem soli.', 0),
      (15, 'Piwo można warzyć tylko z jęczmienia.', 1),
      (16, 'Doppelbock to mocniejsza wersja koźlaka.', 0)
    ) as t(i, tresc, poprawna);
end $$;
