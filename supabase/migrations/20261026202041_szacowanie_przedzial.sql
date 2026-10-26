-- Szacowanie z przedziałem (26.10): opcjonalne `dane.poprawna_do`. Dobre są liczby od `poprawna` do `poprawna_do`
-- (pełne punkty), a dalej punkty maleją od najbliższego brzegu, aż do zera w odległości `tolerancja`.
-- `poprawna_do` jest ukrywane przed wynikiem jak `poprawna`.
do $$
declare
  d text;
  zmiany text[][] := array[
    ['wewn.ocena(text,jsonb,jsonb)',
     $a$v_d := abs(v_x - (p_zadanie ->> 'poprawna')::numeric);$a$,
     $a$v_d := greatest(0, (p_zadanie ->> 'poprawna')::numeric - v_x,
                   v_x - coalesce((p_zadanie ->> 'poprawna_do')::numeric, (p_zadanie ->> 'poprawna')::numeric));$a$],
    ['wewn.odpowiedz_bota(zadania,numeric)',
     $a$v_x := (p_z.dane ->> 'poprawna')::numeric$a$,
     $a$v_x := ((p_z.dane ->> 'poprawna')::numeric
            + coalesce((p_z.dane ->> 'poprawna_do')::numeric, (p_z.dane ->> 'poprawna')::numeric)) / 2$a$],
    ['public.stan_sesji(text)',
     $a$else v_z.dane - 'poprawna' - 'podpowiedzi' end$a$,
     $a$else v_z.dane - 'poprawna' - 'poprawna_do' - 'podpowiedzi' end$a$],
    ['public.seria_pytania(text)',
     $a$z.dane - 'poprawna' - 'podpowiedzi'$a$,
     $a$z.dane - 'poprawna' - 'poprawna_do' - 'podpowiedzi'$a$],
    ['public.pilot_stan(text,text)',
     $a$'poprawna', v_z.dane -> 'poprawna',$a$,
     $a$'poprawna', v_z.dane -> 'poprawna',
    'poprawna_do', v_z.dane -> 'poprawna_do',$a$]
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

-- Tripel: przedział 7,5–9,5% zamiast 8,5, suwak co 0,1, i pytanie przed pintą (łatwiej trafić)
update public.zadania z
   set dane = z.dane || '{"min": 4, "max": 18, "krok": 0.1, "poprawna": 7.5, "poprawna_do": 9.5, "tolerancja": 2}'::jsonb
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and z.typ = 'szacowanie' and z.tresc like '%tripel%';

update public.zadania z set nr = 1025
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and z.nr = 25 and z.tresc like '%tripel%';
update public.zadania z set nr = 25
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and z.nr = 24 and z.tresc like '%pinta%';
update public.zadania z set nr = 24
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego' and z.nr = 1025;
