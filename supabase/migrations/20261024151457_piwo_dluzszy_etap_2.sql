-- Quiz „Piwo - quiz testowy”: etap 2 („Kilka dobrych”, wielokrotny wybór) z 2 do 8 pytań.
-- Dalsze pytania przesuwają się o 6 (unikalność (quiz_id, nr) jest odroczona, więc jedno update wystarcza).
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
  select id into v_etap from public.etapy where quiz_id = v_quiz and nr = 2;
  select czas_s into v_czas from public.zadania where quiz_id = v_quiz and nr = 11;

  update public.zadania set nr = nr + 6 where quiz_id = v_quiz and nr > 12;

  insert into public.zadania (quiz_id, etap_id, nr, typ, tresc, dane, czas_s) values
    (v_quiz, v_etap, 13, 'wielokrotny', 'Które z tych stylów pochodzą z Belgii?',
     '{"odpowiedzi": ["Kölsch", "Witbier", "Porter", "Saison", "Lambic"], "poprawna": [1, 3, 4]}', v_czas),
    (v_quiz, v_etap, 14, 'wielokrotny', 'Które z tych stylów są zwykle kwaśne?',
     '{"odpowiedzi": ["Koźlak", "Berliner Weisse", "Gose", "Porter", "Flanders red"], "poprawna": [1, 2, 4]}', v_czas),
    (v_quiz, v_etap, 15, 'wielokrotny', 'Które z tych piw powstają z fermentacji spontanicznej?',
     '{"odpowiedzi": ["IPA", "Lambic", "Gueuze", "Pilzner", "Kriek"], "poprawna": [1, 2, 4]}', v_czas),
    (v_quiz, v_etap, 16, 'wielokrotny', 'Które miasta dały nazwę własnemu stylowi piwa?',
     '{"odpowiedzi": ["Madryt", "Pilzno", "Kolonia", "Oslo", "Grodzisk Wielkopolski"], "poprawna": [1, 2, 4]}', v_czas),
    (v_quiz, v_etap, 17, 'wielokrotny', 'Które z tych piw to polskie tradycje piwowarskie?',
     '{"odpowiedzi": ["Kölsch", "Piwo jopejskie", "Saison", "Porter bałtycki", "Koźlak"], "poprawna": [1, 3]}', v_czas),
    (v_quiz, v_etap, 18, 'wielokrotny', 'Które słowa w nazwie piwa oznaczają mocniejszą wersję stylu?',
     '{"odpowiedzi": ["Session", "Imperial", "Light", "Double", "Doppel- (doppelbock)"], "poprawna": [1, 3, 4]}', v_czas);
end $$;
