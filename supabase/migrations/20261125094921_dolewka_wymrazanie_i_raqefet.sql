-- „Piwny quiz Bractwa: dolewka” (Łukasz, 25.11): wymrażanie przechodzi do etapu „Na jedno” jako pytanie „Jak powstaje
-- eisbock?” z ciekawostką (grafika eisbock.webp), po pytaniu o gęstwę, więc dalsze pytania przesuwają się o dwa.
-- Ostatnie pytanie „Ile?” to teraz najstarsze znane piwo (jaskinia Raqefet), grafika raqefet.webp dojdzie osobno.
update public.zadania z set nr = z.nr + 1000
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null and z.nr >= 7;

update public.zadania z set nr = z.nr - 998
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null and z.nr >= 1000;

insert into public.zadania (quiz_id, nr, typ, tresc, czas_s, dane, grafika_url, etap_id)
select q.id, v.nr, v.typ, v.tresc, v.czas_s, v.dane, v.grafika_url, e.id
  from public.quizy q
  join public.etapy e on e.quiz_id = q.id and e.nr = 1,
  (values
    (7, 'wybor', 'Jak powstaje eisbock?', 20,
     '{"poprawna": 0, "odpowiedzi": ["Wymraża się z piwa część wody", "Wrzuca się lód do kadzi", "Leżakuje całą zimę w lodowni", "Schładza się go ciekłym azotem"]}'::jsonb, null),
    (8, 'ciekawostka', 'Piwo z mrozu', null,
     '{"tekst": "Eisbock to koźlak, z którego wymrożono część wody. Piwowar schładza piwo, aż zacznie zamarzać, i wybiera lód, a w płynie zostaje więcej alkoholu i smaku, zwykle 9–14%. Według legendy pierwszy eisbock powstał przypadkiem, gdy beczki koźlaka zamarzły na mrozie na podwórzu browaru w Kulmbach."}'::jsonb,
     '/grafiki/pytania/eisbock.webp')
  ) as v(nr, typ, tresc, czas_s, dane, grafika_url)
 where q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null
   and not exists (select 1 from public.zadania x where x.quiz_id = q.id and x.nr = v.nr);

update public.zadania z
   set tresc = 'Ile lat temu, według archeologów, uwarzono najstarsze znane piwo?',
       grafika_url = null,
       dane = '{"min": 1000, "max": 40000, "krok": 500, "poprawna": 13000, "jednostka": "lat", "tolerancja": 6000, "wyjasnienie": "Około 13 tysięcy lat temu. Ślady piwa z dzikich zbóż znaleziono w kamiennych moździerzach w jaskini Raqefet w dzisiejszym Izraelu. Warzyli je łowcy-zbieracze, zanim ludzie zaczęli uprawiać zboże."}'::jsonb
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa: dolewka' and q.usunieto is null
   and z.tresc like 'Ile procent alkoholu ma zwykle eisbock%';
