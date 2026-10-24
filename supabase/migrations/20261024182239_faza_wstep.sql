-- Faza `wstep`: w quizie z etapami start z poczekalni najpierw pokazuje planszę wstępu (cała droga: etapy,
-- odpadanie, wyścig do nalewanej szklanki), prowadzący opowiada, a „następne” prowadzi do planszy 1. etapu.
-- Start ustala tu progi odpadania (jak dotąd przy pierwszej planszy etapu).
alter table public.sesje drop constraint sesje_faza_check;
alter table public.sesje add constraint sesje_faza_check check (faza = any (array[
  'poczekalnia', 'wstep', 'etap', 'seria', 'pijany', 'werble', 'pytanie', 'wynik', 'odpowiedzi', 'ranking',
  'podium', 'tabela', 'koniec'
]));

do $$
declare
  v_def text := pg_get_functiondef('public.pilot_akcja'::regproc);
  v_stare text := $s$  if p_akcja = 'nastepne' and v_s.faza in ('poczekalnia', 'etap', 'wynik', 'odpowiedzi', 'ranking') then$s$;
  v_nowe text := $s$  if p_akcja = 'nastepne' and v_s.faza = 'poczekalnia'
     and exists (select 1 from public.etapy where quiz_id = v_s.quiz_id) then
    -- quiz z etapami: najpierw plansza wstępu (cała droga), potem plansza 1. etapu; start ustala progi
    update public.sesje
       set faza = 'wstep',
           poczekalnia_otwarta = true,
           faza_od = v_teraz,
           faza_do = null,
           progi = coalesce(progi, wewn.progi_domyslne(v_s.id))
     where id = v_s.id;

  elsif p_akcja = 'nastepne' and v_s.faza in ('poczekalnia', 'wstep', 'etap', 'wynik', 'odpowiedzi', 'ranking') then$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'pilot_akcja: nie znaleziono akcji nastepne';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;
