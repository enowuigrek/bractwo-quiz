-- Piwny quiz (28.10, po przeglądzie Łukasza):
-- 1. „Jaki to styl?” (kriek) później w etapie 1, po szkle weizen: dla nie-piwowarów trudniejsze niż reszta początku.
-- 2. Polskie tradycje i kwaśne style: szósta, myląca odpowiedź (koźlak brzmi po polsku, ale to niemiecki bock;
--    witbier ze skórką pomarańczy kojarzy się z kwaśnym, a nim nie jest).
-- 3. Zamiast osi czasu z prawem czystości (było już w etapie 1): odmiany IPA od najstarszej.
do $$
declare
  v_quiz uuid;
  n int;
begin
  select id into v_quiz from public.quizy where tytul = 'Piwny quiz Bractwa Piwnego' and usunieto is null;
  if v_quiz is null then
    raise exception 'Nie ma piwnego quizu';
  end if;

  -- 1. kriek z 5 na 10, pytania 6–10 o jeden wcześniej
  update public.zadania set nr = 1005 where quiz_id = v_quiz and nr = 5 and tresc = 'Jaki to styl?';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Kriek: % wierszy', n; end if;
  for i in 6 .. 10 loop
    update public.zadania set nr = i - 1 where quiz_id = v_quiz and nr = i;
  end loop;
  update public.zadania set nr = 10 where quiz_id = v_quiz and nr = 1005;

  -- 2. szósta odpowiedź
  update public.zadania
     set dane = jsonb_build_object('odpowiedzi',
                  '["Koźlak", "Grodziskie", "Kölsch", "Porter bałtycki", "Saison", "Piwo jopejskie"]'::jsonb,
                  'poprawna', '[1, 3, 5]'::jsonb)
   where quiz_id = v_quiz and tresc = 'Które z tych piw to polskie tradycje piwowarskie?';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Polskie tradycje: % wierszy', n; end if;

  update public.zadania
     set dane = jsonb_build_object('odpowiedzi',
                  '["Berliner Weisse", "Koźlak", "Gose", "Witbier", "Flanders red", "Porter"]'::jsonb,
                  'poprawna', '[0, 2, 4]'::jsonb)
   where quiz_id = v_quiz and tresc = 'Które z tych stylów są zwykle kwaśne?';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Kwaśne: % wierszy', n; end if;

  -- 3. odmiany IPA: English (XIX w.), American (lata 70.–80. XX w.), New England (XXI w.), Cold IPA (2018)
  update public.zadania
     set tresc = 'Ułóż odmiany IPA od najstarszej',
         dane = jsonb_build_object('elementy',
                  '["Cold IPA", "American IPA", "English IPA", "New England IPA"]'::jsonb,
                  'poprawna', '[2, 1, 3, 0]'::jsonb)
   where quiz_id = v_quiz and nr = 33 and tresc = 'Ułóż wydarzenia od najstarszego';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Oś czasu: % wierszy', n; end if;
end $$;
