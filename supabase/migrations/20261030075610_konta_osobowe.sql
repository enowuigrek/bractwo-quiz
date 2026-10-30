-- Konta osobowe w panelu (30.10): konto = osoba, logowanie e-mailem i hasłem (skrót scrypt liczony w Next).
-- Role nadaje twórca (Łukasz): twórca, Bractwo albo lokal; konto może mieć kilka i przełącza się „działam jako”.
-- Tylko serwer (klucz serwisowy) czyta i pisze; anon nie ma dostępu.
create table public.konta (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email) and char_length(email) <= 200),
  nazwa text not null check (char_length(nazwa) between 1 and 60),
  skrot text,
  -- jednorazowy link do ustawienia hasła (skrót sha256 tokenu i ważność)
  link_skrot text,
  link_do timestamptz,
  zablokowane boolean not null default false,
  utworzono timestamptz not null default now(),
  ostatnie_logowanie timestamptz
);
create unique index konta_email on public.konta(email);
alter table public.konta enable row level security;
revoke all on public.konta from anon, authenticated;
grant select, insert, update, delete on public.konta to service_role;

create table public.konta_role (
  id uuid primary key default gen_random_uuid(),
  konto_id uuid not null references public.konta(id) on delete cascade,
  rola text not null check (rola in ('tworca', 'bractwo', 'lokal')),
  lokal_id uuid references public.lokale(id) on delete cascade,
  check ((rola = 'lokal') = (lokal_id is not null))
);
create unique index konta_role_unikalne on public.konta_role(konto_id, rola, coalesce(lokal_id, '00000000-0000-0000-0000-000000000000'::uuid));
alter table public.konta_role enable row level security;
revoke all on public.konta_role from anon, authenticated;
grant select, insert, update, delete on public.konta_role to service_role;

-- Lokal testowy (Kwadrat, domowy browar Łukasza): widzi go tylko twórca.
alter table public.lokale add column testowy boolean not null default false;
update public.lokale set testowy = true where adres_ekranu = 'kwadrat';

-- Autor-osoba: kto uruchomił grę, założył quiz, napisał notatkę. Bez kluczy obcych do `konta` przy notatce, żeby
-- złączenia `konta(...)` z `sesje` były jednoznaczne (jak `notatka_lokal_id`).
alter table public.sesje add column autor_konto_id uuid references public.konta(id) on delete set null;
alter table public.sesje add column notatka_konto_id uuid;
alter table public.quizy add column autor_konto_id uuid references public.konta(id) on delete set null;

-- Konto twórcy na start (hasło ustawia się w panelu; do tego czasu wejście hasłem głównym z .env).
insert into public.konta (email, nazwa) values ('l.nowak@bractwopiwne.pl', 'Łukasz');
insert into public.konta_role (konto_id, rola)
select id, 'tworca' from public.konta where email = 'l.nowak@bractwopiwne.pl';
