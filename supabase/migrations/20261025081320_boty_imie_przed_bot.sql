-- Nicki botów: najpierw imię, potem „Bot” („Zenek Bot”), żeby na TV i w rankingu było widać imię.
create or replace function public.dodaj_boty(p_kod text, p_host_token text, p_ile integer)
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
    select i.imie || ' Bot'
      from unnest(array['Zenek', 'Halina', 'Mietek', 'Grażyna', 'Staszek', 'Krysia', 'Józek', 'Wiesia', 'Rysiek',
                        'Bożena', 'Heniek', 'Jadzia', 'Zdzisiek', 'Teresa', 'Waldek', 'Danuta', 'Gienek', 'Lucyna',
                        'Tadek', 'Irena']) with ordinality as i(imie, n)
     where not exists (select 1 from public.gracze g where g.sesja_id = v_s.id and g.nick = i.imie || ' Bot')
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
