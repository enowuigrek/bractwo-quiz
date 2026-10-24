-- Piwny quiz Bractwa Piwnego: dwie ciekawostki. „Polski szampan” tuż przed pytaniem o grodziskie (koniec
-- rozgrzewki) i „Piwo zza klasztornych murów” na początku walki o finał (po planszy etapu).
do $$
declare
  v_quiz uuid;
  v_etap1 uuid;
  v_etap4 uuid;
  v_grodziskie int;
  v_walka int;
begin
  select id into v_quiz from public.quizy where tytul = 'Piwny quiz Bractwa Piwnego';
  if v_quiz is null then
    raise exception 'Nie ma quizu „Piwny quiz Bractwa Piwnego”';
  end if;
  select id into v_etap1 from public.etapy where quiz_id = v_quiz and nr = 1;
  select id into v_etap4 from public.etapy where quiz_id = v_quiz and nr = 4;
  select nr into v_grodziskie from public.zadania
   where quiz_id = v_quiz and tresc = 'Z jakiego słodu warzy się polskie piwo grodziskie?';

  update public.zadania set nr = nr + 1 where quiz_id = v_quiz and nr >= v_grodziskie;
  insert into public.zadania (quiz_id, etap_id, nr, typ, tresc, grafika_url, dane, czas_s) values
    (v_quiz, v_etap1, v_grodziskie, 'ciekawostka', 'Polski szampan', '/grafiki/pytania/grodzisk.webp',
     jsonb_build_object('tekst',
       'Grodziskie warzy się w całości ze słodu pszenicznego wędzonego dymem dębowym. Przez stulecia trafiało do '
       || 'wielu krajów i nazywano je polskim szampanem. W 1993 roku browar w Grodzisku zamknięto, ale styl przetrwał '
       || 'dzięki piwowarom domowym i od kilku lat znów się go tam warzy.'), null);

  select min(nr) into v_walka from public.zadania where quiz_id = v_quiz and etap_id = v_etap4;
  update public.zadania set nr = nr + 1 where quiz_id = v_quiz and nr >= v_walka;
  insert into public.zadania (quiz_id, etap_id, nr, typ, tresc, grafika_url, dane, czas_s) values
    (v_quiz, v_etap4, v_walka, 'ciekawostka', 'Piwo zza klasztornych murów', '/grafiki/pytania/opactwo.webp',
     jsonb_build_object('tekst',
       'Piwem trapistów może się nazywać tylko piwo uwarzone w klasztorze trapistów, pod okiem mnichów, a zysk idzie '
       || 'na utrzymanie wspólnoty i cele dobroczynne. Takich klasztorów jest na świecie zaledwie kilkanaście.'), null);
end $$;
