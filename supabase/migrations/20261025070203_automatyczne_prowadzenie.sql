-- Automatyczne prowadzenie (25.10, Łukasz: do testów z botami i czasem w lokalu). Przełącznik w pilocie
-- (`ustaw_auto`, `sesje.auto`); kroki klika sam otwarty pilot (src/app/pilot/[kod]/auto.tsx). Na planszach (wstęp,
-- etap, ciekawostka) gracze klikają na telefonie „Gotowy” (`gotowy`, `gracze.gotowy_od` = `faza_od` planszy), a gdy
-- gotowi są wszyscy grający (boty zawsze), pilot idzie dalej. `stan_sesji` podaje `auto` i `gotowi`.

alter table public.sesje add column auto boolean not null default false;
alter table public.gracze add column gotowy_od timestamptz;

create or replace function public.ustaw_auto(p_kod text, p_host_token text, p_wlacz boolean)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_s public.sesje;
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  update public.sesje set auto = coalesce(p_wlacz, false) where id = v_s.id;
  perform wewn.rozglos(v_s.kod, 'stan', '{}'::jsonb);
  return public.pilot_stan(v_s.kod, p_host_token);
end;
$function$;

-- Gracz jest gotowy na bieżącej planszy (wstęp, plansza etapu, ciekawostka w fazie `wynik`)
create or replace function public.gotowy(p_token text)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_g public.gracze;
  v_s public.sesje;
begin
  select * into v_g from public.gracze where token = p_token;
  if v_g.id is null then
    raise exception 'Nieznany gracz';
  end if;
  select * into v_s from public.sesje where id = v_g.sesja_id;
  if v_s.faza not in ('wstep', 'etap', 'wynik') then
    return;
  end if;
  update public.gracze set gotowy_od = v_s.faza_od where id = v_g.id;
  perform wewn.rozglos(v_s.kod, 'gracz', '{}'::jsonb);
end;
$function$;

do $$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.stan_sesji'::regproc);
  if position($s$'max_graczy', v_s.max_graczy, 'pijany_final', v_s.pijany_final, 'muzyka', v_s.muzyka,$s$ in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono muzyki';
  end if;
  execute replace(v_def, $s$'max_graczy', v_s.max_graczy, 'pijany_final', v_s.pijany_final, 'muzyka', v_s.muzyka,$s$,
    $s$'max_graczy', v_s.max_graczy, 'pijany_final', v_s.pijany_final, 'muzyka', v_s.muzyka,
    'auto', v_s.auto,
    'gotowi', (select count(*) from public.gracze g
                where g.sesja_id = v_s.id and g.odpadl_po_etapie is null
                  and (g.bot or g.gotowy_od = v_s.faza_od)),$s$);
end $$;
