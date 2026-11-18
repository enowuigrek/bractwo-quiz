-- Nagrody gry mogą obejmować miejsca za podium (nagrody pocieszenia z nagród domyślnych quizu, 18.11):
-- do 10 pozycji zamiast 3.
alter table public.sesje drop constraint if exists sesje_nagrody_check;
alter table public.sesje add constraint sesje_nagrody_check check (
  nagrody is null
  or (jsonb_typeof(nagrody) = 'array' and jsonb_array_length(nagrody) between 1 and 10)
);
