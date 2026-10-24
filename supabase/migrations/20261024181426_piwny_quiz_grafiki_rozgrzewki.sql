-- Piwny quiz Bractwa Piwnego: trzy pytania rozgrzewki z grafiką (public/grafiki/pytania, scripts/grafiki.mjs).
-- Goryczka → zdjęcie chmielu (odsłaniane, z rozmycia), gaz z fermentacji → „Jaki to styl?” (kriek), szkło do
-- pszenicznego → „Jak nazywa się to szkło?” (weizenglas).
update public.zadania z
   set tresc = 'To dzięki temu piwo jest gorzkie. Co to?',
       grafika_url = '/grafiki/pytania/chmiel.webp',
       dane = '{"odpowiedzi": ["Słód", "Chmiel", "Drożdże", "Jęczmień"], "poprawna": 1, "odslaniaj": true}'
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego'
   and z.tresc = 'Który składnik piwa odpowiada głównie za goryczkę?';

update public.zadania z
   set tresc = 'Jaki to styl?',
       grafika_url = '/grafiki/pytania/kriek.webp',
       dane = '{"odpowiedzi": ["Stout", "IPA", "Kriek", "Pilzner"], "poprawna": 2}'
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego'
   and z.tresc = 'Jaki gaz, obok alkoholu, powstaje podczas fermentacji?';

update public.zadania z
   set tresc = 'Jak nazywa się to szkło?',
       grafika_url = '/grafiki/pytania/weizen.webp',
       dane = '{"odpowiedzi": ["Tulipan", "Weizenglas", "Nonic pint", "Snifter"], "poprawna": 1}'
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego'
   and z.tresc = 'W jakim szkle tradycyjnie podaje się niemieckie piwo pszeniczne?';
