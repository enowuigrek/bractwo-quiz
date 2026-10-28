-- Zdanie o lagerze (28.10): „lagern” to po niemiecku składować, leżakować; „przechowywanie” brzmiało obco.
-- Tego dnia jednorazowym skryptem (MCP nie usuwa) wyleciały też z puli finału: dwa zdania o Oktoberfeście (za dużo
-- Oktoberfestu w quizie), prohibicja w USA (nie o piwie) i cask ale z pompy (niezrozumiałe).
update public.zadania z
   set tresc = 'Nazwa „lager” pochodzi od niemieckiego „lagern”, czyli leżakować.'
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and q.usunieto is null
   and z.tresc = 'Słowo „lager” pochodzi od niemieckiego słowa oznaczającego przechowywanie.';
