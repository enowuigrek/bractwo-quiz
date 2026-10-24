-- Nazwy etapów jako wieczór w barze (24.10, pomysł Łukasza): przychodzisz „na jedno”, robi się „jednak więcej”,
-- potem „ile?”, trzeba się „poskładać”, a na koniec „jeszcze zdążę”. Każda nazwa pasuje też do mechaniki etapu
-- (jedna dobra, kilka dobrych, liczba, składanie par i kolejności, wyścig do piwa). Piwny quiz i Muzyka ponadczasowa.
do $$
declare
  v_n int;
begin
  update public.etapy e
     set nazwa = m.nazwa, opis = coalesce(m.opis, e.opis)
    from public.quizy q,
         (values
           (1, 'Na jedno', 'Jedna dobra odpowiedź, jak to jedno piwo. Im szybciej, tym więcej punktów.'),
           (2, 'Jednak więcej', 'Dobrych odpowiedzi może być więcej. Zaznacz wszystkie, za złe tracisz część punktów pytania.'),
           (3, 'Ile?', null),
           (4, 'Poskładaj się', 'Poskładaj pary i kolejność. Punkty za każdy dobry kawałek, a do finału wchodzi tylko trójka.'),
           (5, 'Jeszcze zdążę', null)
         ) as m(nr, nazwa, opis)
   where q.id = e.quiz_id
     and q.tytul in ('Piwny quiz Bractwa Piwnego', 'Muzyka ponadczasowa')
     and e.nr = m.nr;
  get diagnostics v_n = row_count;
  if v_n <> 10 then
    raise exception 'Zmieniono % etapów zamiast 10', v_n;
  end if;
end $$;
