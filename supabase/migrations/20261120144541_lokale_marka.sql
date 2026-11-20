-- marka lokalu (20.11, src/lib/marka.ts): rola lokalu działa tylko na adresie swojej marki
alter table public.lokale add column if not exists marka text not null default 'bractwo';
alter table public.lokale drop constraint if exists lokale_marka_check;
alter table public.lokale add constraint lokale_marka_check check (marka in ('bractwo', 'jowes'));
comment on column public.lokale.marka is 'Marka lokalu (src/lib/marki): rola lokalu loguje się tylko na adresie tej marki.';
update public.lokale set marka = 'jowes' where nazwa = 'JOWES' and marka = 'bractwo';
