-- Wejście pijanego finału piwnego quizu (28.10): pięć pytań, od prawdziwego faktu do coraz dziwniejszych.
-- Ciemne piwo zostaje (z puli finału wylatuje jego dubel), piana „chroni przed utlenianiem” i „na trzy palce” wylatują.
-- Piąte wraca do ciekawostki o kalsarikännit, która w pijanym finale stoi teraz po czwartym pytaniu.
update public.pijane_pytania_quizu w
   set tresc = v.tresc, komentarz_prawda = v.kp, komentarz_falsz = v.kf
  from public.quizy q,
       (values
         (1, 'Piwo to trzeci najczęściej pity napój na świecie, po wodzie i herbacie.',
             'Woda i herbata mają po prostu lepszy PR.', 'A jednak: woda, herbata, piwo.'),
         (2, 'Ciemne piwo jest zawsze mocniejsze od jasnego.',
             'Nie zawsze. Ale ładnie brzmi.', 'Brawo, kolor nie mówi o mocy.'),
         (3, 'Kufel ma ucho, żeby piwo nie grzało się od dłoni.',
             'Ucho to klimatyzacja kufla.', 'To po co ucho? Na kolczyk?')
       ) as v(nr, tresc, kp, kf)
 where w.quiz_id = q.id and q.tytul = 'Piwny quiz Bractwa Piwnego' and q.usunieto is null and w.nr = v.nr;

insert into public.pijane_pytania_quizu (quiz_id, nr, tresc, komentarz_prawda, komentarz_falsz)
select q.id, v.nr, v.tresc, v.kp, v.kf
  from public.quizy q,
       (values
         (4, 'Najlepsze piwo to to, które stoi teraz przed tobą.', 'Słusznie. Pij.', 'To po co je zamawiałeś?'),
         (5, 'Piwo pite w samych gaciach smakuje tak samo jak w pubie.', 'Finowie się nie zgodzą.',
             'Finowie przybijają piątkę.')
       ) as v(nr, tresc, kp, kf)
 where q.tytul = 'Piwny quiz Bractwa Piwnego' and q.usunieto is null
   and not exists (select 1 from public.pijane_pytania_quizu w where w.quiz_id = q.id and w.nr = v.nr);
