-- Niemiecka nazwa bawarskiego prawa czystości w pytaniach (25.10, Łukasz). Odpowiedź „Wodę, jęczmień i chmiel” zostaje:
-- tekst z 1516 roku wymienia dosłownie „Gersten, Hopfen und Wasser” (jęczmień, nie słód; drożdży jeszcze nie znano).
-- Bez roku w treści, bo walka o finał każe ułożyć to wydarzenie w czasie.
update public.zadania
   set tresc = 'Co wymieniało jako składniki piwa bawarskie prawo czystości (Reinheitsgebot)?'
 where tresc = 'Co wymieniało jako składniki piwa bawarskie prawo czystości?';

update public.zadania
   set dane = jsonb_set(dane, '{elementy}',
                (select jsonb_agg(case when e #>> '{}' = 'Bawarskie prawo czystości'
                                       then to_jsonb('Bawarskie prawo czystości (Reinheitsgebot)'::text) else e end
                                  order by i)
                   from jsonb_array_elements(dane -> 'elementy') with ordinality as x(e, i)))
 where typ = 'kolejnosc' and dane -> 'elementy' ? 'Bawarskie prawo czystości';
