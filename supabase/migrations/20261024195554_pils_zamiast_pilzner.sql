-- „Pils” zamiast „pilzner” w nazwie stylu (24.10, Łukasz: „pilzner” kojarzy się z jednym piwem, Pilsner Urquell).
-- Miasto Pilzno zostaje. Tylko całe słowa (\m…\M), w treści i w odpowiedziach.
update public.zadania
   set tresc = regexp_replace(regexp_replace(tresc, '\mPilzner\M', 'Pils', 'g'), '\mpilzner\M', 'pils', 'g'),
       dane = regexp_replace(regexp_replace(dane::text, '\mPilzner\M', 'Pils', 'g'), '\mpilzner\M', 'pils', 'g')::jsonb
 where tresc ~* '\mpilzner\M' or dane::text ~* '\mpilzner\M';
