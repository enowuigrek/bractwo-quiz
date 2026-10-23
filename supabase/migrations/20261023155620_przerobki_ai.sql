-- Licznik przeróbek zdjęć przez OpenAI. Selfie przerabiamy przed dołączeniem do gry (gracz jeszcze nie
-- istnieje), więc limit na grę liczymy tutaj. Tylko serwer (klucz serwisowy) czyta i zapisuje.

create table public.przerobki_ai (
  id uuid primary key default gen_random_uuid(),
  sesja_id uuid not null references public.sesje (id) on delete cascade,
  rodzaj text not null check (rodzaj in ('awatar')),
  utworzono timestamptz not null default now()
);

create index przerobki_ai_sesja on public.przerobki_ai (sesja_id, rodzaj);

alter table public.przerobki_ai enable row level security;
revoke all on public.przerobki_ai from anon, authenticated;
grant select, insert, update, delete on public.przerobki_ai to service_role;
