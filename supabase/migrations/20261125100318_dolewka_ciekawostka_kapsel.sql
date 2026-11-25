-- „Piwny quiz Bractwa: dolewka” (Łukasz, 25.11): ciekawostka o kapslu zaraz po pytaniu o ząbki. Żeby ciekawostka nie
-- zamykała etapu „Ile?”, kolejność to Berliner, kapsel, ciekawostka, pils, ciekawostka o Pilźnie, chmiel (najtrudniejsze).
-- Dalsze pytania przesuwają się o jeden. Grafika ciekawostki kapsel-warsztat.webp dojdzie osobno.
update public.zadania z set nr = z.nr + 1000
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null and z.nr >= 18;

update public.zadania z set nr = v.nr
  from public.quizy q, (values
    ('Ile ząbków ma kapsel?', 19),
    ('W którym roku uwarzono w Pilźnie pierwszego pilsa?', 21),
    ('Bunt w Pilźnie', 22),
    ('Na ile metrów pnie się chmiel w chmielniku?', 23)
  ) as v(tresc, nr)
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null and z.tresc = v.tresc;

update public.zadania z set nr = 18
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null
   and z.tresc = 'Ile procent alkoholu ma zwykle Berliner Weisse?';

update public.zadania z set nr = z.nr - 1000 + 1
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null and z.nr >= 1023;

update public.zadania z
   set dane = jsonb_set(z.dane, '{wyjasnienie}', to_jsonb('21 ząbków. Tyle ma dziś każdy standardowy kapsel.'::text))
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null
   and z.tresc = 'Ile ząbków ma kapsel?';

insert into public.zadania (quiz_id, nr, typ, tresc, czas_s, dane, etap_id)
select q.id, 20, 'ciekawostka', 'Korona na butelce', null,
       '{"tekst": "Kapsel wymyślił w 1892 roku William Painter z Baltimore i nazwał go koroną, bo z ząbkami tak właśnie wygląda. Pierwsze kapsle miały 24 ząbki, a 21 przyjęło się później jako standard. W firmie Paintera pracował jako sprzedawca King Gillette. Painter poradził mu wymyślić coś, co się wyrzuca po użyciu, i tak powstała jednorazowa żyletka."}'::jsonb,
       e.id
  from public.quizy q join public.etapy e on e.quiz_id = q.id and e.nr = 3
 where q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null
   and not exists (select 1 from public.zadania x where x.quiz_id = q.id and x.nr = 20);
