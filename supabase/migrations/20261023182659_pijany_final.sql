-- Tryb „Pijany finał” (przełącznik w kreatorze gry). Po prawdziwym finale (serii) wynik jest już ustalony,
-- ale zamiast werbli przychodzi faza `pijany`: kilka pytań prawda/fałsz, które nic nie liczą, z coraz
-- większym chaosem na telefonach i TV. Po czasie albo przyciskiem pilota przychodzą werble i podium.
-- Pytania są wspólne dla wszystkich gier i edytowalne w panelu (tabela `pijane_pytania`).

alter table public.sesje
  add column pijany_final boolean not null default false,
  add column za_barem text check (za_barem is null or char_length(za_barem) between 1 and 40);

alter table public.sesje drop constraint sesje_faza_check;
alter table public.sesje add constraint sesje_faza_check check (
  faza in ('poczekalnia', 'etap', 'seria', 'pijany', 'werble', 'pytanie', 'wynik', 'odpowiedzi', 'ranking',
           'podium', 'tabela', 'koniec')
);

create table public.pijane_pytania (
  id uuid primary key default gen_random_uuid(),
  nr int not null check (nr > 0),
  tresc text not null check (char_length(tresc) between 1 and 200),
  efekt text not null default 'brak'
    check (efekt in ('brak', 'drzenie', 'odwrocone_kolory', 'pion', 'samoklik', 'mgla', 'ucieczka', 'obrot', 'chaos')),
  utworzono timestamptz not null default now()
);
alter table public.pijane_pytania enable row level security;
revoke all on public.pijane_pytania from anon, authenticated;
grant select, insert, update, delete on public.pijane_pytania to service_role;

-- {za_barem}: kto dziś stoi za barem (pole w kreatorze; bez niego pytanie odpada), {lokal}: nazwa lokalu
insert into public.pijane_pytania (nr, tresc, efekt) values
  (1, 'Szklanka piwa jest zawsze do połowy pełna.', 'drzenie'),
  (2, 'Piwo smakuje lepiej, gdy płaci ktoś inny.', 'odwrocone_kolory'),
  (3, 'Ten quiz trwa dłużej, niż powinien.', 'pion'),
  (4, 'Podoba ci się dziś {za_barem}?', 'samoklik'),
  (5, 'Czy na pewno to ty trzymasz ten telefon?', 'mgla'),
  (6, 'Jesteś pewien, że jesteś w {lokal}?', 'ucieczka'),
  (7, 'Gdyby piwo mogło mówić, prosiłoby o litość.', 'obrot'),
  (8, 'To pytanie nie istnieje.', 'chaos');

-- Pytania dla telefonów w fazie `pijany` (bez punktów, nic nie jest tajne), z podstawionymi wstawkami.
create or replace function public.pijane_pytania(p_kod text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_lokal text;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null or v_s.faza <> 'pijany' then
    return '[]'::jsonb;
  end if;
  select nazwa into v_lokal from public.lokale where id = v_s.lokal_id;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'nr', p.nr,
             'tresc', replace(replace(p.tresc, '{za_barem}', coalesce(v_s.za_barem, '')),
                              '{lokal}', coalesce(v_lokal, 'tym barze')),
             'efekt', p.efekt
           ) order by p.nr)
      from public.pijane_pytania p
     where p.tresc not like '%{za_barem}%' or nullif(trim(v_s.za_barem), '') is not null
  ), '[]'::jsonb);
end;
$$;
revoke execute on function public.pijane_pytania(text) from public;
grant execute on function public.pijane_pytania(text) to anon, authenticated, service_role;

-- Koniec ostatniej serii: przy włączonym trybie faza `pijany` (90 s) zamiast werbli.
create or replace function wewn.zakoncz_serie(p_sesja_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_ostatnie int;
  v_dalej boolean;
begin
  select * into v_s from public.sesje where id = p_sesja_id;
  if v_s.faza is distinct from 'seria' then
    return;
  end if;
  select max(nr) into v_ostatnie from public.zadania where etap_id = v_s.seria_etap;
  v_dalej := exists (select 1 from public.zadania where quiz_id = v_s.quiz_id and nr > v_ostatnie);
  update public.sesje
     set faza = case when v_dalej then 'ranking' when v_s.pijany_final then 'pijany' else 'werble' end,
         zadanie_nr = coalesce(v_ostatnie, zadanie_nr),
         faza_od = clock_timestamp(),
         faza_do = case when not v_dalej and v_s.pijany_final then clock_timestamp() + interval '90 seconds' end
   where id = v_s.id;
end;
$$;

-- Po czasie pijanego finału werble (woła je to samo `dokoncz_pytanie`, co kończy pytania i serie).
create or replace function public.dokoncz_pytanie(p_kod text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null then
    raise exception 'Nie ma gry o kodzie %', upper(trim(p_kod));
  end if;
  if v_s.faza = 'seria' then
    perform wewn.zamknij_serie_jesli_gotowe(v_s.id);
  elsif v_s.faza = 'pijany' then
    update public.sesje
       set faza = 'werble', faza_od = clock_timestamp(), faza_do = null
     where id = v_s.id and faza = 'pijany' and faza_do <= clock_timestamp();
  else
    perform wewn.zamknij_pytanie_jesli_gotowe(v_s.id);
  end if;
end;
$$;

-- `stan_sesji`: tryb i osoba za barem (TV drży w finale, telefon podstawia pytania). Podmiana jednego
-- fragmentu obecnej definicji, żeby nie przepisywać całej długiej funkcji.
do $$
declare
  v_def text := pg_get_functiondef('public.stan_sesji(text)'::regprocedure);
  v_stare text := '''max_graczy'', v_s.max_graczy,';
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'stan_sesji: nie znalazłem miejsca na pola pijanego finału';
  end if;
  execute replace(v_def, v_stare,
    '''max_graczy'', v_s.max_graczy, ''pijany_final'', v_s.pijany_final, ''za_barem'', v_s.za_barem,');
end;
$$;

-- `pilot_akcja`: z pijanego finału prowadzący przechodzi do werbli przed czasem.
do $$
declare
  v_def text := pg_get_functiondef('public.pilot_akcja(text, text, text)'::regprocedure);
  v_stare text := '  elsif p_akcja = ''plansze'' and v_s.faza = ''koniec'' then';
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'pilot_akcja: nie znalazłem miejsca na akcję werble';
  end if;
  execute replace(v_def, v_stare,
    '  elsif p_akcja = ''werble'' and v_s.faza = ''pijany'' then
    update public.sesje set faza = ''werble'', faza_od = v_teraz, faza_do = null where id = v_s.id;

' || v_stare);
end;
$$;
