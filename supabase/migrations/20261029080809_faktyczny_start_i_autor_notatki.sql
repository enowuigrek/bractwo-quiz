-- 29.10: faktyczny start gry (gra AZKJ była ustawiona na 19:00, a ruszyła ok. 19:50) zapisuje wyzwalacz przy pierwszym
-- wyjściu z poczekalni, czy kliknął prowadzący, czy automat. Do notatek: kto pisał (lokal albo Bractwo) i kiedy.
alter table public.sesje
  add column wystartowano timestamptz,
  add column notatka_lokal_id uuid references public.lokale (id) on delete set null,
  add column notatka_zmieniono timestamptz;

create or replace function wewn.zapisz_start_gry() returns trigger
language plpgsql set search_path to '' as $function$
begin
  if new.wystartowano is null and old.faza = 'poczekalnia' and new.faza not in ('poczekalnia', 'koniec') then
    new.wystartowano := clock_timestamp();
  end if;
  return new;
end;
$function$;

create trigger sesje_start_gry before update of faza on public.sesje
  for each row execute function wewn.zapisz_start_gry();

-- notatka do gry AZKJ wpisana w panelu głównym przed tą zmianą: autor Bractwo (notatka_lokal_id null)
update public.sesje set notatka_zmieniono = now() where notatka is not null and notatka_zmieniono is null;
