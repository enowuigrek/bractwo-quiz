-- Etap „Ile?” (28.10): zamiast roku pierwszego pilsa ekstrakt czeskiego pilsa w widełkach (zdjęcie pilsa zostaje),
-- pinta brytyjska na koniec etapu (klamra z kuflem). Przed wynikiem `dane` szacowania z widełkami ma znacznik
-- `przedzial: true` (bez liczb), żeby telefon i TV mogły napisać „Celuj w widełki”.
do $$
declare
  d text;
  zmiany text[][] := array[
    ['public.stan_sesji(text)',
     $a$else v_z.dane - 'poprawna' - 'poprawna_do' - 'podpowiedzi' end$a$,
     $a$else v_z.dane - 'poprawna' - 'poprawna_do' - 'podpowiedzi'
                || case when v_z.dane ? 'poprawna_do' then '{"przedzial": true}'::jsonb else '{}'::jsonb end end$a$],
    ['public.seria_pytania(text)',
     $a$z.dane - 'poprawna' - 'poprawna_do' - 'podpowiedzi'$a$,
     $a$z.dane - 'poprawna' - 'poprawna_do' - 'podpowiedzi'
                 || case when z.dane ? 'poprawna_do' then '{"przedzial": true}'::jsonb else '{}'::jsonb end$a$]
  ];
  i int;
begin
  for i in 1 .. array_length(zmiany, 1) loop
    d := pg_get_functiondef(zmiany[i][1]::regprocedure);
    if position(zmiany[i][2] in d) = 0 then
      raise exception 'Nie ma fragmentu w %', zmiany[i][1];
    end if;
    execute replace(d, zmiany[i][2], zmiany[i][3]);
  end loop;
end $$;

update public.zadania z
   set tresc = 'Ile stopni ekstraktu (°Blg) ma klasyczny czeski pils?',
       dane = '{"min": 6, "max": 24, "krok": 0.5, "poprawna": 11, "poprawna_do": 12.5, "tolerancja": 3, "jednostka": "°Blg"}'::jsonb
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and z.typ = 'szacowanie'
   and z.tresc = 'W którym roku w Pilźnie uwarzono pierwsze piwo w stylu pils?';

-- nowa kolejność: kufel 23, tripel 24, pils 25, Weihenstephan 26, pinta 27
update public.zadania z set nr = 1027
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and z.nr = 25 and z.tresc like '%pinta%';
update public.zadania z set nr = 25
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and z.nr = 26 and z.tresc like '%pils%';
update public.zadania z set nr = 26
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and z.nr = 27 and z.tresc like '%Weihenstephan%';
update public.zadania z set nr = 27
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and z.nr = 1027;
