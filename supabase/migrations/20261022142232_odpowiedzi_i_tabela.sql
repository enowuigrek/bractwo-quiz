-- Dwie nowe fazy gry na TV:
-- * `odpowiedzi`: po wyniku pytania lista graczy. Najpierw dobre odpowiedzi od najszybszej,
--   potem złe, na końcu gracze bez odpowiedzi; przy każdym jego odpowiedź i czas.
-- * `tabela`: po ostatnim pytaniu pełna tabela wszystkich graczy z punktami (obok podium).
--
-- Przebieg (pilot):
--   pytanie → wynik → [odpowiedzi] → [ranking] → następne pytanie
--   po ostatnim pytaniu: wynik | odpowiedzi | ranking → podium ⇄ tabela → koniec

alter table public.sesje drop constraint sesje_faza_check;
alter table public.sesje add constraint sesje_faza_check
  check (faza in ('poczekalnia', 'pytanie', 'wynik', 'odpowiedzi', 'ranking', 'podium', 'tabela', 'koniec'));

create or replace function wewn.odslania_poprawna(p_faza text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_faza in ('wynik', 'odpowiedzi', 'ranking', 'podium', 'tabela', 'koniec')
$$;

-- Kto i jak odpowiedział na bieżące zadanie. Zdradza poprawną, więc dopiero od fazy `wynik`
-- (wcześniej pusta lista). Kolejność: dobre od najszybszej, złe od najszybszej, bez odpowiedzi.
create function public.odpowiedzi_zadania(p_kod text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_z public.zadania;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null then
    raise exception 'Nie ma gry o kodzie %', upper(trim(p_kod));
  end if;
  if not wewn.odslania_poprawna(wewn.faza_widoczna(v_s)) then
    return '[]'::jsonb;
  end if;

  select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
  if v_z.id is null then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'nick', g.nick,
               'dane', o.dane,
               'poprawna', o.poprawna,
               'czas_ms', o.czas_ms,
               'punkty', o.punkty
             )
             order by o.poprawna desc nulls last, o.czas_ms nulls last, g.nick
           )
      from public.gracze g
      left join public.odpowiedzi o on o.gracz_id = g.id and o.zadanie_id = v_z.id
     where g.sesja_id = v_s.id
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.odpowiedzi_zadania(text) from public;
grant execute on function public.odpowiedzi_zadania(text) to anon, authenticated;

-- Akcje prowadzącego:
--   nastepne    poczekalnia | wynik | odpowiedzi | ranking → pytanie (albo podium po ostatnim)
--   wynik       pytanie → wynik (kończy pytanie od razu, jeśli czas jeszcze leci)
--   odpowiedzi  wynik | ranking → odpowiedzi
--   ranking     wynik | odpowiedzi → ranking
--   podium      wynik | odpowiedzi | ranking | tabela → podium
--   tabela      wynik | odpowiedzi | ranking | podium → tabela
--   koniec      dowolna → koniec
create or replace function public.pilot_akcja(p_kod text, p_host_token text, p_akcja text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_teraz timestamptz := clock_timestamp();
  v_nast public.zadania;
  v_po_pytaniu constant text[] := array['wynik', 'odpowiedzi', 'ranking'];
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  select * into v_s from public.sesje where id = v_s.id for update;

  if p_akcja = 'nastepne' and v_s.faza in ('poczekalnia', 'wynik', 'odpowiedzi', 'ranking') then
    select * into v_nast
      from public.zadania
     where quiz_id = v_s.quiz_id and nr > v_s.zadanie_nr
     order by nr
     limit 1;

    if v_nast.id is null then
      update public.sesje
         set faza = 'podium', faza_od = v_teraz, faza_do = null
       where id = v_s.id;
    else
      -- 3 s na `przygotuj`, potem pytanie trwa czas_s (bez limitu: faza_do puste)
      update public.sesje
         set faza = 'pytanie',
             zadanie_nr = v_nast.nr,
             faza_od = v_teraz + interval '3 seconds',
             faza_do = case
               when v_nast.czas_s is null then null
               else v_teraz + interval '3 seconds' + make_interval(secs => v_nast.czas_s)
             end
       where id = v_s.id;
    end if;

  elsif p_akcja = 'wynik' and v_s.faza = 'pytanie' then
    update public.sesje set faza = 'wynik', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'odpowiedzi' and v_s.faza in ('wynik', 'ranking') then
    update public.sesje set faza = 'odpowiedzi', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'ranking' and v_s.faza in ('wynik', 'odpowiedzi') then
    update public.sesje set faza = 'ranking', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'podium' and (v_s.faza = any (v_po_pytaniu) or v_s.faza = 'tabela') then
    update public.sesje set faza = 'podium', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'tabela' and (v_s.faza = any (v_po_pytaniu) or v_s.faza = 'podium') then
    update public.sesje set faza = 'tabela', faza_od = v_teraz, faza_do = null where id = v_s.id;

  elsif p_akcja = 'koniec' and v_s.faza <> 'koniec' then
    update public.sesje set faza = 'koniec', faza_od = v_teraz, faza_do = null where id = v_s.id;

  else
    raise exception 'Akcja „%” nie jest teraz dostępna (faza: %)', p_akcja, v_s.faza;
  end if;

  return public.pilot_stan(v_s.kod, p_host_token);
end;
$$;
