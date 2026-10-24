-- Prowizorka na próbę z quizem „Muzyka ponadczasowa” (24.10): własne pytania pijanego finału dla quizu, żeby nie
-- było pytań o piwo, a początek płynnie wychodził z prawdziwego finału (najpierw zdania o muzyce, potem coraz
-- dziwniej). Jeśli quiz gry ma wiersze w `pijane_pytania_quizu`, funkcja bierze tylko je, inaczej wspólne
-- `pijane_pytania`. Panel ich nie pokazuje i nie nadpisuje (zapis panelu czyści tylko wspólną tabelę).
-- Do uporządkowania razem z projektem pijanego finału (POMYSLY.md).

create table public.pijane_pytania_quizu (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizy (id) on delete cascade,
  nr int not null check (nr > 0),
  tresc text not null check (char_length(tresc) between 1 and 200),
  efekt text not null default 'brak'
    check (efekt in ('brak', 'drzenie', 'odwrocone_kolory', 'pion', 'samoklik', 'mgla', 'ucieczka', 'obrot', 'chaos')),
  komentarz_prawda text,
  komentarz_falsz text
);
alter table public.pijane_pytania_quizu enable row level security;
revoke all on public.pijane_pytania_quizu from anon, authenticated;
grant select, insert, update, delete on public.pijane_pytania_quizu to service_role;

insert into public.pijane_pytania_quizu (quiz_id, nr, tresc, efekt)
select q.id, t.nr, t.tresc, t.efekt
  from public.quizy q,
       (values
         (1, 'Freddie Mercury potrafił zaśpiewać cztery oktawy.', 'drzenie'),
         (2, 'Każdy przebój brzmi lepiej przy trzecim refrenie.', 'odwrocone_kolory'),
         (3, 'Podoba ci się dziś {za_barem}?', 'samoklik'),
         (4, 'Czy życie ma sens, jeśli nikt nie pamięta, że się wydarzyło?', 'mgla'),
         (5, 'Ten quiz trwa dłużej, niż powinien.', 'pion'),
         (6, 'Jesteś pewien, że jesteś w {lokal}?', 'ucieczka'),
         (7, 'Gdyby muzyka mogła mówić, prosiłaby o ciszę.', 'obrot'),
         (8, 'Czy gdyby nikt nie zadawał pytań, odpowiedzi nadal miałyby sens?', 'chaos'),
         (9, 'Czy można zgubić coś, czego nigdy się nie miało?', 'chaos'),
         (10, 'Czy jeśli wszystko przemija, to przemijanie też kiedyś przeminie?', 'chaos')
       ) as t(nr, tresc, efekt)
 where q.tytul = 'Muzyka ponadczasowa';

do $$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.pijane_pytania(text)'::regprocedure);
  if position($s$          from public.pijane_pytania p$s$ in v_def) = 0 then
    raise exception 'pijane_pytania: nie znaleziono źródła pytań';
  end if;
  execute replace(v_def,
    $s$          from public.pijane_pytania p$s$,
    $s$          from (
            -- własne pytania quizu (prowizorka, pijane_pytania_quizu), a bez nich wspólne
            select x.id, x.nr, x.tresc, x.efekt, x.komentarz_prawda, x.komentarz_falsz
              from public.pijane_pytania_quizu x
             where x.quiz_id = v_s.quiz_id
            union all
            select g.id, g.nr, g.tresc, g.efekt, g.komentarz_prawda, g.komentarz_falsz
              from public.pijane_pytania g
             where not exists (select 1 from public.pijane_pytania_quizu y where y.quiz_id = v_s.quiz_id)
          ) p$s$);
end $$;
