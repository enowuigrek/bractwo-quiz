-- Pijany finał prościej (28.10, Łukasz): bez osobnego wejścia dla każdego quizu. Jedna wspólna lista w dwóch
-- częściach: „O piwie” (`piwne`) po kolei według `nr`, spokojnie, jak dalszy ciąg finału, potem „Odklejone” losowo.
-- Pięć pytań wejścia piwnego quizu przechodzi na początek „O piwie”, przed dotychczasowe złote. Tabela
-- `pijane_pytania_quizu` zostaje, ale baza już jej nie czyta.
do $$
declare
  d text;
  zmiany text[][] := array[
    [$a$  c_piwnych constant int := 5;
$a$, ''],
    [$a$            -- wejście quizu: po kolei, przed całą resztą
            select x.nr, x.tresc, x.komentarz_prawda, x.komentarz_falsz, 0 as grupa, lpad(x.nr::text, 4, '0') as klucz
              from public.pijane_pytania_quizu x
             where x.quiz_id = v_s.quiz_id
            union all
$a$, ''],
    [$a$            -- wspólna pula: najpierw piwne, potem reszta, w każdej grupie losowo (z id gry: wszyscy mają to samo)
            select g.nr, g.tresc, g.komentarz_prawda, g.komentarz_falsz, case when g.piwne then 1 else 2 end,
                   md5(g.id::text || v_s.id::text)$a$,
     $a$            -- „O piwie” po kolei, potem „Odklejone” losowo (z id gry: wszyscy mają to samo)
            select g.nr, g.tresc, g.komentarz_prawda, g.komentarz_falsz, case when g.piwne then 1 else 2 end as grupa,
                   case when g.piwne then lpad(g.nr::text, 6, '0') else md5(g.id::text || v_s.id::text) end as klucz$a$],
    [$a$     where w.grupa <> 1 or w.lp <= c_piwnych
$a$, '']
  ];
  i int;
begin
  d := pg_get_functiondef('public.pijane_pytania(text)'::regprocedure);
  for i in 1 .. array_length(zmiany, 1) loop
    if position(zmiany[i][1] in d) = 0 then
      raise exception 'Nie ma fragmentu %', i;
    end if;
    d := replace(d, zmiany[i][1], zmiany[i][2]);
  end loop;
  execute d;
end $$;

-- złote za faktami: numery od 200, fakty z wejścia piwnego quizu 101–105
update public.pijane_pytania set nr = nr + 200 where piwne and nr < 200;

insert into public.pijane_pytania (nr, tresc, komentarz_prawda, komentarz_falsz, piwne)
select 100 + w.nr, w.tresc, w.komentarz_prawda, w.komentarz_falsz, true
  from public.pijane_pytania_quizu w
  join public.quizy q on q.id = w.quiz_id
 where q.tytul = 'Piwny quiz Bractwa Piwnego' and q.usunieto is null
   and not exists (select 1 from public.pijane_pytania g where g.tresc = w.tresc);
