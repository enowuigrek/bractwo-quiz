-- pełne rozdzielenie marek (20.11): quiz, gra i konto należą do jednej marki (src/lib/marki), panel pod adresem
-- marki widzi tylko jej rzeczy, a konto loguje się tylko pod adresem swojej marki (poza twórcą)
alter table public.quizy add column marka text not null default 'bractwo' constraint quizy_marka_check check (marka in ('bractwo', 'jowes'));
alter table public.sesje add column marka text not null default 'bractwo' constraint sesje_marka_check check (marka in ('bractwo', 'jowes'));
alter table public.konta add column marka text not null default 'bractwo' constraint konta_marka_check check (marka in ('bractwo', 'jowes'));
comment on column public.quizy.marka is 'Marka quizu: quiz lokalu ma markę lokalu (wyzwalacz), quiz bez lokalu markę adresu, pod którym powstał.';
comment on column public.sesje.marka is 'Marka gry: zawsze marka quizu (wyzwalacz).';
comment on column public.konta.marka is 'Marka konta: loguje się tylko pod adresem tej marki (twórca pod każdym).';

-- obecne dane: quizy lokali JOWES, ich gry (także testowe bez lokalu) i konto z adresem jowes.pl
update public.quizy q set marka = l.marka from public.lokale l where l.id = q.lokal_id and q.marka <> l.marka;
update public.sesje s set marka = q.marka from public.quizy q where q.id = s.quiz_id and s.marka <> q.marka;
update public.konta set marka = 'jowes' where email ilike '%@jowes.pl' and marka = 'bractwo';

-- quiz lokalu dostaje markę lokalu, gra markę quizu: wszystkie miejsca zapisu (panel, SQL testów) bez pamiętania
create function wewn.marka_quizu() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.lokal_id is not null then
    new.marka := (select l.marka from public.lokale l where l.id = new.lokal_id);
  end if;
  return new;
end $$;

create function wewn.marka_gry() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.marka := (select q.marka from public.quizy q where q.id = new.quiz_id);
  return new;
end $$;

create trigger quizy_marka before insert or update of lokal_id on public.quizy
  for each row execute function wewn.marka_quizu();
create trigger sesje_marka before insert or update of quiz_id on public.sesje
  for each row execute function wewn.marka_gry();
