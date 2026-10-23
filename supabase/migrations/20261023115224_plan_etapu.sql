-- Szablony quizu: etap pamięta, ile pytań ma mieć (panel pokazuje „2 z 6” i miejsca na brakujące)
-- i jaki rodzaj pytania podsunąć przy dodawaniu (z szablonu etapu, np. Błyskawica → prawda / fałsz).

alter table public.etapy
  add column plan_pytan integer check (plan_pytan between 1 and 50),
  add column typ_domyslny text check (
    typ_domyslny in ('wybor', 'prawda_falsz', 'wielokrotny', 'kolejnosc', 'pary', 'szacowanie')
  );
