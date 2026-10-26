-- Etap „Ile?” (26.10): grafika do każdego pytania. Pierwszy pils i Weihenstephan (scripts/grafiki.mjs: pyt-pils, pyt-weihenstephan).
update public.zadania z set grafika_url = '/grafiki/pytania/pils.webp'
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and z.typ = 'szacowanie'
   and z.tresc like '%pierwsze piwo w stylu pils%' and z.grafika_url is null;

update public.zadania z set grafika_url = '/grafiki/pytania/weihenstephan.webp'
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and z.typ = 'szacowanie'
   and z.tresc like '%Weihenstephan%' and z.grafika_url is null;
