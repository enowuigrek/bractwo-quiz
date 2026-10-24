-- Muzyka ponadczasowa: więcej współczesnej muzyki (24.10, prośba Łukasza): R&B, hip-hop (też polski) i pop
-- zamiast części pytań o Beatlesów i klasykę. Układ etapów, liczby dobrych w „Kilka dobrych” (1–4) i poprawne
-- poza środkiem suwaka bez zmian. Finał nadal 15 × prawda i 15 × fałsz.
do $$
declare
  v_quiz uuid;
  v_n int;
begin
  select id into v_quiz from public.quizy where tytul = 'Muzyka ponadczasowa';
  if v_quiz is null then
    raise exception 'Nie ma quizu Muzyka ponadczasowa';
  end if;

  update public.zadania z
     set tresc = m.nowa, dane = m.dane::jsonb
    from (values
      -- rozgrzewka
      ('Z jakiego miasta pochodzi zespół The Beatles?',
       'Która wokalistka nagrała album „21” z przebojem „Rolling in the Deep”?',
       '{"odpowiedzi": ["Adele", "Amy Winehouse", "Duffy", "Lana Del Rey"], "poprawna": 0}'),
      ('Który kompozytor stracił słuch, a mimo to napisał IX Symfonię?',
       'W jakim zespole zaczynała karierę Beyoncé?',
       '{"odpowiedzi": ["Spice Girls", "TLC", "Destiny''s Child", "En Vogue"], "poprawna": 2}'),
      -- kilka dobrych
      ('Którzy z tych muzyków grali w The Beatles?',
       'Które z tych przebojów nagrała Rihanna?',
       '{"odpowiedzi": ["„Umbrella”", "„Halo”", "„Diamonds”", "„Toxic”", "„Bad Romance”"], "poprawna": [0, 2]}'),
      ('Które z tych utworów nagrał zespół Queen?',
       'Którzy z tych artystów to raperzy?',
       '{"odpowiedzi": ["Kendrick Lamar", "Bruno Mars", "Drake", "Eminem", "Usher"], "poprawna": [0, 2, 3]}'),
      ('Którzy z tych kompozytorów tworzyli w epoce baroku?',
       'Którzy z tych artystów to polscy raperzy?',
       '{"odpowiedzi": ["Taco Hemingway", "Dawid Podsiadło", "Quebonafide", "Sanah", "Kękę"], "poprawna": [0, 2, 4]}'),
      -- strzał liczbowy
      ('W którym roku zmarł Fryderyk Chopin?',
       'Ile lat miała Billie Eilish, gdy wydała przebój „Bad Guy”?',
       '{"min": 10, "max": 40, "krok": 1, "poprawna": 17, "jednostka": "lat", "tolerancja": 3}'),
      ('W którym roku The Beatles wydali swój pierwszy album?',
       'W którym roku Britney Spears wydała debiutancki album „…Baby One More Time”?',
       '{"min": 1960, "max": 2010, "krok": 1, "poprawna": 1999, "jednostka": null, "tolerancja": 4}'),
      -- połącz i ułóż
      ('Połącz zespół z krajem, z którego pochodzi',
       'Połącz przebój z wykonawcą',
       '{"lewe": ["„Crazy in Love”", "„Hotline Bling”", "„Uptown Funk”", "„Blinding Lights”"], "prawe": ["The Weeknd", "Beyoncé", "Drake", "Mark Ronson i Bruno Mars"], "poprawna": [1, 2, 3, 0]}'),
      ('Ułóż gatunki od najstarszego',
       'Ułóż gatunki od najstarszego',
       '{"elementy": ["Grunge", "Blues", "Trap", "Rock and roll"], "poprawna": [1, 3, 0, 2]}'),
      -- finał: prawda
      ('Skrzypce mają cztery struny.', 'Billie Eilish nagrywała pierwsze piosenki z bratem w jego sypialni.',
       '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'),
      ('Kontrabas jest większy od wiolonczeli.', 'Drake pochodzi z Kanady.',
       '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'),
      ('Johann Sebastian Bach miał dwadzieścioro dzieci.', 'Rihanna pochodzi z Barbadosu.',
       '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'),
      -- finał: fałsz
      ('Gitara klasyczna ma metalowe struny.', 'Eminem pochodzi z Nowego Jorku.',
       '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'),
      ('Pianino i fortepian to dokładnie to samo.', '„Bad Guy” to piosenka Ariany Grande.',
       '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'),
      ('Operę „Carmen” napisał Giuseppe Verdi.', 'Dua Lipa pochodzi ze Stanów Zjednoczonych.',
       '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'),
      -- finał: zdania, które powtarzały pytania z etapów albo ciekawostkę (Nobel Dylana, śmierć Chopina,
      -- „Bohemian Rhapsody”, reggae, „Cztery pory roku”)
      ('Bob Dylan dostał Pokojową Nagrodę Nobla.', 'Taylor Swift zaczynała karierę jako raperka.',
       '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'),
      ('Fryderyk Chopin zmarł w Warszawie.', 'Ed Sheeran pochodzi z Irlandii.',
       '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'),
      ('„Bohemian Rhapsody” nagrał zespół The Who.', '„Single Ladies” to piosenka Rihanny.',
       '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'),
      ('Reggae narodziło się w Brazylii.', 'Kanye West pochodzi z Londynu.',
       '{"poprawna": 1, "odpowiedzi": ["Prawda", "Fałsz"]}'),
      ('„Cztery pory roku” skomponował Antonio Vivaldi.', 'Beyoncé i Jay-Z są małżeństwem.',
       '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}')
    ) as m(stara, nowa, dane)
   where z.quiz_id = v_quiz and z.tresc = m.stara;
  get diagnostics v_n = row_count;
  if v_n <> 20 then
    raise exception 'Zmieniono % pytań zamiast 20', v_n;
  end if;
end $$;
