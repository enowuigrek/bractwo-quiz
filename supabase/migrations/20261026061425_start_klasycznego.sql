-- Klasyczny pub quiz (bez etapów, 26.10): między poczekalnią a 1. pytaniem plansza startowa „Zaczynamy!”
-- z 10-sekundowym odliczaniem (faza `wstep` z `faza_do`). Po czasie pierwsze pytanie startuje samo, przez
-- `dokoncz_pytanie` (wołają je TV, pilot i telefony po końcu zegara), z automatem i bez.

do $$
declare
  v_def text := pg_get_functiondef('public.pilot_akcja(text,text,text)'::regprocedure);
  v_szukane text := $s$  elsif p_akcja = 'nastepne' and v_s.faza in ('poczekalnia', 'wstep', 'etap', 'wynik', 'odpowiedzi', 'ranking') then$s$;
begin
  if position(v_szukane in v_def) = 0 then
    raise exception 'pilot_akcja: nie znaleziono gałęzi następnego pytania';
  end if;
  execute replace(v_def, v_szukane, $n$  elsif p_akcja = 'nastepne' and v_s.faza = 'poczekalnia' then
    -- klasyczny quiz (bez etapów): plansza startowa z odliczaniem 10 s, potem 1. pytanie samo (dokoncz_pytanie)
    update public.sesje
       set faza = 'wstep',
           poczekalnia_otwarta = true,
           faza_od = v_teraz,
           faza_do = v_teraz + interval '10 seconds'
     where id = v_s.id;

$n$ || v_szukane);
end $$;

create or replace function public.dokoncz_pytanie(p_kod text)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
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
  elsif v_s.faza = 'wstep' then
    -- plansza startowa klasycznego quizu: po odliczaniu 1. pytanie. Blokada wiersza: kilka urządzeń woła naraz,
    -- a przechodzi tylko pierwsze (reszta widzi już pytanie)
    select * into v_s from public.sesje where id = v_s.id for update;
    if v_s.faza = 'wstep' and v_s.faza_do <= clock_timestamp() then
      perform public.pilot_akcja(v_s.kod, v_s.host_token, 'nastepne');
    end if;
  else
    perform wewn.zamknij_pytanie_jesli_gotowe(v_s.id);
  end if;
end;
$function$;
