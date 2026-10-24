-- Quiz „Piwo - quiz testowy”: etap 4 („Połącz i ułóż”, walka o finał) z 2 do 6 pytań, na zmianę kolejność i pary.
-- Finał przesuwa się o 4 (unikalność (quiz_id, nr) jest odroczona).
do $$
declare
  v_quiz uuid;
  v_etap uuid;
  v_czas int;
begin
  select id into v_quiz from public.quizy where tytul = 'Piwo - quiz testowy';
  if v_quiz is null then
    raise exception 'Nie ma quizu „Piwo - quiz testowy”';
  end if;
  select id into v_etap from public.etapy where quiz_id = v_quiz and nr = 4;
  select czas_s into v_czas from public.zadania where quiz_id = v_quiz and nr = 22;

  update public.zadania set nr = nr + 4 where quiz_id = v_quiz and nr > 23;

  insert into public.zadania (quiz_id, etap_id, nr, typ, tresc, dane, czas_s) values
    (v_quiz, v_etap, 24, 'kolejnosc', 'Ułóż wydarzenia od najstarszego',
     '{"elementy": ["Pierwszy pilzner w Pilźnie", "Atak Chmielu, początek polskiej rewolucji piwnej", "Bawarskie prawo czystości", "Badania Pasteura nad fermentacją piwa"], "poprawna": [2, 0, 3, 1]}', v_czas),
    (v_quiz, v_etap, 25, 'pary', 'Połącz styl z tym, co go wyróżnia',
     '{"lewe": ["Witbier", "Gose", "Rauchbier", "Kriek"], "prawe": ["Sól", "Wiśnie", "Kolendra i skórka pomarańczy", "Wędzony słód"], "poprawna": [2, 0, 3, 1]}', v_czas),
    (v_quiz, v_etap, 26, 'kolejnosc', 'Ułóż style od najjaśniejszego do najciemniejszego',
     '{"elementy": ["Stout", "Pilzner", "Brown ale", "Märzen"], "poprawna": [1, 3, 2, 0]}', v_czas),
    (v_quiz, v_etap, 27, 'pary', 'Połącz chmiel z krajem, z którego pochodzi',
     '{"lewe": ["Saaz", "Cascade", "Marynka", "Hallertauer Mittelfrüh"], "prawe": ["Niemcy", "Polska", "Czechy", "USA"], "poprawna": [2, 3, 1, 0]}', v_czas);
end $$;
