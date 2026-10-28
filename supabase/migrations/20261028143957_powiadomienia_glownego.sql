-- Powiadomienia dla głównego admina w panelu (28.10): np. lokal zwolnił ekran, kończąc grę Bractwa przed startem.
-- Tylko serwer (klucz serwisowy) czyta i pisze; anon nie ma dostępu.
create table public.powiadomienia (
  id uuid primary key default gen_random_uuid(),
  utworzono timestamptz not null default now(),
  tresc text not null check (char_length(tresc) <= 300),
  przeczytane timestamptz
);
alter table public.powiadomienia enable row level security;
grant select, insert, update, delete on public.powiadomienia to service_role;
