-- „Piwny quiz Bractwa: dolewka”: grafiki od Łukasza (Gemini, prompty dol-… w scripts/grafiki.mjs) i nowe pytanie
-- „Jak nazywa się to szkło?” (tulipan) jako 7. w etapie „Na jedno”, więc dalsze pytania przesuwają się o jeden.
update public.zadania z set nr = z.nr + 1000
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null and z.nr >= 7;

update public.zadania z set nr = z.nr - 999
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null and z.nr >= 1000;

insert into public.zadania (quiz_id, nr, typ, tresc, czas_s, dane, grafika_url, etap_id)
select q.id, 7, 'wybor', 'Jak nazywa się to szkło?', 20,
       '{"poprawna": 3, "odpowiedzi": ["Pokal", "Oset", "Teku", "Tulipan"], "wyjasnienie": "Tulipan: brzuchate szkło na nóżce z wywiniętym brzegiem. Trzyma pianę i zbiera aromat, dlatego pije się z niego mocne piwa belgijskie."}'::jsonb,
       '/grafiki/pytania/szklo-tulipan.webp', e.id
  from public.quizy q join public.etapy e on e.quiz_id = q.id and e.nr = 1
 where q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null
   and not exists (select 1 from public.zadania x where x.quiz_id = q.id and x.nr = 7);

update public.zadania z set grafika_url = '/grafiki/pytania/' || g.plik
  from public.quizy q, (values
    (2, 'brzeczka.webp'),
    (4, 'doppelbock.webp'),
    (5, 'chmielenie-na-zimno.webp'),
    (8, 'altbier.webp'),
    (9, 'dekokcja.webp'),
    (14, 'diacetyl.webp'),
    (15, 'chmielnik-usa.webp'),
    (16, 'berliner.webp'),
    (17, 'chmielnik.webp'),
    (18, 'pils-piwnice.webp'),
    (19, 'pilzno.webp'),
    (20, 'snake-venom.webp')
  ) as g(nr, plik)
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null and z.nr = g.nr;
