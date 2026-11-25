-- „Piwny quiz Bractwa: dolewka”: teksty bez dwukropków (Łukasz, 25.11): wyjaśnienia przy IPA i tulipanie, ciekawostka o diacetylu.
update public.zadania z
   set dane = jsonb_set(z.dane, array[v.klucz], to_jsonb(v.tekst))
  from public.quizy q, (values
    ('Co oznacza skrót IPA?', 'wyjasnienie', 'To skrót od India Pale Ale, czyli jasnego ale warzonego w Anglii na eksport do Indii. „Indian” to częsty błąd, bo nazwa mówi o kraju, a nie o mieszkańcach.'),
    ('Jak nazywa się to szkło?', 'wyjasnienie', 'Tulipan to brzuchate szkło na nóżce z wywiniętym brzegiem. Trzyma pianę i zbiera aromat, dlatego pije się z niego mocne piwa belgijskie.'),
    ('Masło w piwie', 'tekst', 'Diacetyl robią same drożdże w czasie fermentacji i same potrafią go z powrotem zjeść. Dlatego piwowar pod koniec fermentacji lagera podnosi na dzień czy dwa temperaturę. To przerwa diacetylowa, po której maślany zapach znika. Wyjątkiem są czeskie lagery, w nich odrobina diacetylu jest dopuszczalna i należy do ich charakteru.')
  ) as v(tresc, klucz, tekst)
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null and z.tresc = v.tresc;
