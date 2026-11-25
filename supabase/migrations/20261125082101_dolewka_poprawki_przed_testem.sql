-- „Piwny quiz Bractwa: dolewka”, poprawki Łukasza przed testem (25.11): brzęczka (ptak) wśród odpowiedzi o brzeczkę,
-- wady bez dopisków w nawiasach, diacetyl w czeskich lagerach, chmiele z USA wymieszane, Berliner Weisse w widełkach,
-- kolejność ze słodami zamiast historii z prawem czystości (było w pierwszym quizie), a w finale zdanie o zakwaszaniu
-- zamiast słodu pilzneńskiego (słody są teraz w kolejności).
update public.zadania z set dane = v.dane, tresc = coalesce(v.nowa_tresc, z.tresc)
  from public.quizy q, (values
    ('Jak nazywa się słodka ciecz z zacierania słodu, z której potem fermentuje piwo?', null,
     '{"poprawna": 0, "odpowiedzi": ["Brzeczka", "Młóto", "Brzęczka", "Melasa"], "wyjasnienie": "Brzeczka to słodka ciecz z zacierania. Brzęczka to ptak z rodziny świerszczaków."}'::jsonb),
    ('Które z tych związków w piwie uchodzą za wadę?', null,
     '{"poprawna": [0, 1, 2], "odpowiedzi": ["Diacetyl", "DMS", "Aldehyd octowy", "Humulon", "Maltoza"], "wyjasnienie": "Diacetyl pachnie masłem, DMS gotowaną kukurydzą, a aldehyd octowy zielonym jabłkiem. Humulon to kwas alfa z chmielu, który daje goryczkę, a maltoza to cukier ze słodu, który zjadają drożdże."}'::jsonb),
    ('Masło w piwie', null,
     '{"tekst": "Diacetyl robią same drożdże w czasie fermentacji i same potrafią go z powrotem zjeść. Dlatego piwowar pod koniec fermentacji lagera podnosi na dzień czy dwa temperaturę: to przerwa diacetylowa, po której maślany zapach znika. Wyjątkiem są czeskie lagery: w nich odrobina diacetylu jest dopuszczalna i należy do ich charakteru."}'::jsonb),
    ('Które z tych odmian chmielu wyhodowano w USA?', null,
     '{"poprawna": [1, 2, 5], "odpowiedzi": ["Saaz", "Citra", "Mosaic", "Nelson Sauvin", "East Kent Goldings", "Simcoe"], "wyjasnienie": "Saaz to Czechy (Žatec), Nelson Sauvin Nowa Zelandia, a East Kent Goldings Anglia."}'::jsonb),
    ('Ile procent alkoholu ma zwykle Berliner Weisse?', null,
     '{"min": 0, "max": 12, "krok": 0.1, "poprawna": 2.8, "poprawna_do": 3.8, "jednostka": "%", "tolerancja": 2, "wyjasnienie": "Zwykle 2,8–3,8%. To lekkie, kwaśne piwo pszeniczne, które w Berlinie pije się czasem z syropem."}'::jsonb),
    ('Ułóż od najdawniejszego', 'Ułóż słody od najjaśniejszego do najciemniejszego',
     '{"elementy": ["Czekoladowy", "Pilzneński", "Karmelowy", "Monachijski"], "poprawna": [1, 3, 2, 0], "wyjasnienie": "Pilzneński ma ok. 3 EBC, monachijski ok. 20, karmelowy ok. 120, a czekoladowy ok. 1000."}'::jsonb),
    ('Słód pilzneński to jasny słód jęczmienny.', 'Kwaśne piwa zakwasza się najczęściej bakteriami kwasu mlekowego.',
     '{"poprawna": 0, "odpowiedzi": ["Prawda", "Fałsz"]}'::jsonb)
  ) as v(tresc, nowa_tresc, dane)
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null and z.tresc = v.tresc;
