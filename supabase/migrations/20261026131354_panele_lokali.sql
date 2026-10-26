-- Panele lokali (26.10): każdy lokal loguje się własnym hasłem pod /admin/<adres_ekranu>.
-- Hasło (skrót scrypt liczony w Next) w osobnej tabeli, do której ma dostęp tylko klucz serwisowy.
create table public.lokale_hasla (
  lokal_id uuid primary key references public.lokale(id) on delete cascade,
  skrot text not null,
  zmieniono timestamptz not null default now()
);
alter table public.lokale_hasla enable row level security;
revoke all on public.lokale_hasla from anon, authenticated;
grant select, insert, update, delete on public.lokale_hasla to service_role;

-- Autor quizu: lokal, który go założył (null: Bractwo, czyli główny admin). Lokal widzi swoje quizy
-- i quizy Bractwa bez `tylko_glowny` (tylko do grania, bez zmian).
alter table public.quizy add column lokal_id uuid references public.lokale(id) on delete set null;
create index quizy_lokal_id on public.quizy(lokal_id);
