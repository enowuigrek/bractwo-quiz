-- Boty do testów (25.10, Łukasz: żeby przy testowaniu nie grać samemu i zobaczyć animacje). Prowadzący dodaje je
-- w pilocie w poczekalni (`dodaj_boty`), a pilot w trakcie pytania i finału co chwilę woła `boty_odpowiadaj`:
-- za każdym razem część botów, które jeszcze nie odpowiedziały, odpowiada od razu (czas liczy się jak u ludzi,
-- więc rozkłada się na kilka sekund). Każdy bot ma swoją „wiedzę” (40–85% dobrych, z md5 id gracza).
-- Odpowiedzi idą zwykłymi `zapisz_odpowiedz` i `zapisz_odpowiedz_serii`, więc punkty, ranking, odpadanie i finał
-- liczą się dla botów tak samo jak dla graczy.

alter table public.gracze add column bot boolean not null default false;

-- Dodaje `p_ile` botów (1–20) z nickami „Bot Zenek”, „Bot Halina”… (pomija zajęte). Tylko przed startem quizu.
create or replace function public.dodaj_boty(p_kod text, p_host_token text, p_ile int)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_s public.sesje;
  v_imie text;
  v_dodane int := 0;
  v_odp jsonb;
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  if v_s.faza <> 'poczekalnia' then
    raise exception 'Boty można dodać tylko przed startem quizu';
  end if;
  if p_ile is null or p_ile < 1 or p_ile > 20 then
    raise exception 'Botów może być od 1 do 20 naraz';
  end if;
  for v_imie in
    select 'Bot ' || i.imie
      from unnest(array['Zenek', 'Halina', 'Mietek', 'Grażyna', 'Staszek', 'Krysia', 'Józek', 'Wiesia', 'Rysiek',
                        'Bożena', 'Heniek', 'Jadzia', 'Zdzisiek', 'Teresa', 'Waldek', 'Danuta', 'Gienek', 'Lucyna',
                        'Tadek', 'Irena']) with ordinality as i(imie, n)
     where not exists (select 1 from public.gracze g where g.sesja_id = v_s.id and g.nick = 'Bot ' || i.imie)
     order by i.n
  loop
    exit when v_dodane >= p_ile;
    v_odp := public.dolacz(v_s.kod, v_imie, null);
    update public.gracze set bot = true where token = v_odp ->> 'token';
    v_dodane := v_dodane + 1;
  end loop;
  perform wewn.rozglos(v_s.kod, 'stan', '{}'::jsonb);
  return public.pilot_stan(v_s.kod, p_host_token);
end;
$function$;

-- Odpowiedź bota na zadanie: dobra z prawdopodobieństwem `p_wiedza`, inaczej losowa (zwykle zła).
create or replace function wewn.odpowiedz_bota(p_z public.zadania, p_wiedza numeric)
 returns jsonb
 language plpgsql
 volatile
 set search_path to ''
as $function$
declare
  v_dobrze boolean := random() < p_wiedza;
  v_n int;
  v_x numeric;
  v_krok numeric;
begin
  if p_z.typ in ('wybor', 'prawda_falsz') then
    v_n := jsonb_array_length(p_z.dane -> 'odpowiedzi');
    return jsonb_build_object('odpowiedz', case when v_dobrze then (p_z.dane ->> 'poprawna')::int
                                                else floor(random() * v_n)::int end);
  elsif p_z.typ = 'wielokrotny' then
    v_n := jsonb_array_length(p_z.dane -> 'odpowiedzi');
    return jsonb_build_object('odpowiedzi', case when v_dobrze then p_z.dane -> 'poprawna'
                                                 else jsonb_build_array(floor(random() * v_n)::int) end);
  elsif p_z.typ in ('kolejnosc', 'pary') then
    v_n := jsonb_array_length(p_z.dane -> case when p_z.typ = 'kolejnosc' then 'elementy' else 'lewe' end);
    return jsonb_build_object(case when p_z.typ = 'kolejnosc' then 'kolejnosc' else 'pary' end,
      case when v_dobrze then p_z.dane -> 'poprawna'
           else (select jsonb_agg(i order by random()) from generate_series(0, v_n - 1) i) end);
  elsif p_z.typ = 'szacowanie' then
    -- blisko poprawnej (w połowie tolerancji) albo daleko (do dwóch tolerancji), w zakresie suwaka i co krok
    v_krok := coalesce((p_z.dane ->> 'krok')::numeric, 1);
    v_x := (p_z.dane ->> 'poprawna')::numeric
           + (random() * 2 - 1) * (p_z.dane ->> 'tolerancja')::numeric * case when v_dobrze then 0.5 else 2 end;
    v_x := round(v_x / v_krok) * v_krok;
    v_x := least((p_z.dane ->> 'max')::numeric, greatest((p_z.dane ->> 'min')::numeric, v_x));
    return jsonb_build_object('liczba', v_x);
  end if;
  return null;
end;
$function$;

-- Wołane przez pilota co ok. 1,5 s w pytaniu i w serii: część botów odpowiada teraz. Zwraca, ile odpowiedziało.
create or replace function public.boty_odpowiadaj(p_kod text, p_host_token text)
 returns int
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_s public.sesje;
  v_faza text;
  v_z public.zadania;
  v_b record;
  v_dane jsonb;
  v_ile int := 0;
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  v_faza := wewn.faza_widoczna(v_s);
  if v_faza not in ('pytanie', 'seria') or clock_timestamp() < v_s.faza_od then
    return 0;
  end if;
  if v_faza = 'pytanie' then
    select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
  end if;

  for v_b in
    select g.id, g.token,
           0.4 + 0.45 * (('x' || substr(md5(g.id::text), 1, 4))::bit(16)::int / 65535.0) as wiedza
      from public.gracze g
     where g.sesja_id = v_s.id and g.bot and g.odpadl_po_etapie is null
       and (v_faza = 'pytanie' or v_s.finalisci is null or g.id = any (v_s.finalisci))
  loop
    begin
      if v_faza = 'pytanie' then
        -- co wywołanie ok. co trzeci bot bez odpowiedzi odpowiada, więc odpowiedzi rozkładają się w czasie
        continue when random() > 0.35
          or exists (select 1 from public.odpowiedzi o where o.gracz_id = v_b.id and o.zadanie_id = v_z.id);
        v_dane := wewn.odpowiedz_bota(v_z, v_b.wiedza);
        continue when v_dane is null;
        perform public.zapisz_odpowiedz(v_b.token, v_z.id, v_dane);
      else
        -- seria: następne pytanie w tej samej kolejności co na telefonach, mniej więcej co 3 s
        continue when random() > 0.45;
        select z.* into v_z
          from public.zadania z
         where z.etap_id = v_s.seria_etap
           and not exists (select 1 from public.odpowiedzi o where o.gracz_id = v_b.id and o.zadanie_id = z.id)
         order by md5(z.id::text || v_s.id::text)
         limit 1;
        continue when v_z.id is null;
        v_dane := wewn.odpowiedz_bota(v_z, v_b.wiedza);
        perform public.zapisz_odpowiedz_serii(v_b.token, v_z.id, v_dane);
      end if;
      v_ile := v_ile + 1;
    exception when others then
      -- np. czas minął albo seria właśnie się skończyła: ten bot po prostu nie odpowiada
      null;
    end;
  end loop;
  return v_ile;
end;
$function$;

-- pilot_stan: ile botów jest w grze (pilot włącza wtedy ich odpowiadanie)
do $$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.pilot_stan'::regproc);
  if position($s$    'ostatnie_zadanie', v_nast.id is null,$s$ in v_def) = 0 then
    raise exception 'pilot_stan: nie znaleziono ostatniego zadania';
  end if;
  execute replace(v_def, $s$    'ostatnie_zadanie', v_nast.id is null,$s$, $s$    'ostatnie_zadanie', v_nast.id is null,
    'boty', (select count(*) from public.gracze where sesja_id = v_s.id and bot),$s$);
end $$;
