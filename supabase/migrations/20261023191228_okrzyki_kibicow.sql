-- Kibicowanie w finale: gracze spoza finałowej trójki w czasie serii wysyłają okrzyki do wybranego finalisty.
-- Hasła są na stałe w kodzie (src/lib/gra/okrzyki.ts), w bazie tylko ich numer 0..7.

create table public.okrzyki (
  id uuid primary key default gen_random_uuid(),
  sesja_id uuid not null references public.sesje (id) on delete cascade,
  gracz_id uuid not null references public.gracze (id) on delete cascade,
  finalista_id uuid not null references public.gracze (id) on delete cascade,
  haslo smallint not null check (haslo between 0 and 7),
  utworzono timestamptz not null default clock_timestamp()
);
create index okrzyki_sesja_czas on public.okrzyki (sesja_id, utworzono);
create index okrzyki_gracz_czas on public.okrzyki (gracz_id, utworzono);
create index okrzyki_finalista on public.okrzyki (finalista_id);

alter table public.okrzyki enable row level security;
revoke all on public.okrzyki from anon, authenticated;
grant select, insert, update, delete on public.okrzyki to service_role;

-- Okrzyk kibica. Tylko w trwającej serii finału, tylko gracz spoza finału, najwyżej jeden na 3 s.
create or replace function public.kibicuj(p_token text, p_finalista text, p_haslo int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teraz timestamptz := clock_timestamp();
  v_g public.gracze;
  v_s public.sesje;
  v_f uuid;
  v_ostatni timestamptz;
begin
  -- blokada wiersza gracza: dwa równoczesne stuknięcia nie ominą limitu
  select * into v_g from public.gracze where token = p_token for update;
  if v_g.id is null then
    raise exception 'Nieznany gracz';
  end if;
  if p_haslo is null or p_haslo not between 0 and 7 then
    raise exception 'Nieznane hasło';
  end if;
  select * into v_s from public.sesje where id = v_g.sesja_id;
  if v_s.faza <> 'seria' or v_s.finalisci is null or v_teraz < v_s.faza_od
     or (v_s.faza_do is not null and v_teraz > v_s.faza_do) then
    return jsonb_build_object('przyjety', false, 'powod', 'nie_teraz');
  end if;
  if v_g.id = any (v_s.finalisci) then
    return jsonb_build_object('przyjety', false, 'powod', 'finalista');
  end if;
  select id into v_f from public.gracze
   where sesja_id = v_s.id and id = any (v_s.finalisci) and nick = p_finalista;
  if v_f is null then
    return jsonb_build_object('przyjety', false, 'powod', 'nie_ma_finalisty');
  end if;

  select max(utworzono) into v_ostatni from public.okrzyki where gracz_id = v_g.id;
  if v_ostatni is not null and v_ostatni > v_teraz - interval '3 seconds' then
    return jsonb_build_object('przyjety', false, 'powod', 'za_szybko',
      'za_ms', ceil(extract(epoch from (v_ostatni + interval '3 seconds' - v_teraz)) * 1000)::int);
  end if;

  insert into public.okrzyki (sesja_id, gracz_id, finalista_id, haslo, utworzono)
  values (v_s.id, v_g.id, v_f, p_haslo, v_teraz);
  perform wewn.rozglos(v_s.kod, 'okrzyk', '{}'::jsonb);
  return jsonb_build_object('przyjety', true,
    'wyslane', (select count(*) from public.okrzyki where gracz_id = v_g.id));
end;
$$;
revoke execute on function public.kibicuj(text, text, int) from public;
grant execute on function public.kibicuj(text, text, int) to anon, authenticated, service_role;

-- stan_sesji: okrzyki z ostatnich 8 s w serii (dymki na TV), licznik dopingu przy finaliście w serii
-- i liczba kibiców finalisty (telefon finalisty po serii). Podmiana fragmentów obecnej wersji.
do $do$
declare
  v_def text;
  v_nowa text;
  v_przed text;
begin
  select pg_get_functiondef('public.stan_sesji(text)'::regprocedure) into v_def;
  v_nowa := v_def;

  v_przed := v_nowa;
  v_nowa := replace(v_nowa,
$a$jsonb_build_object('nick', g.nick, 'zdjecie', g.zdjecie_url)
                                order by array_position$a$,
$a$jsonb_build_object('nick', g.nick, 'zdjecie', g.zdjecie_url,
                                  'kibice', (select count(distinct k.gracz_id) from public.okrzyki k where k.finalista_id = g.id))
                                order by array_position$a$);
  if v_nowa = v_przed then
    raise exception 'stan_sesji: nie znaleziono fragmentu 1';
  end if;

  v_przed := v_nowa;
  v_nowa := replace(v_nowa,
$a$'nick', g.nick, 'zdjecie', g.zdjecie_url,
               'odpowiedzi'$a$,
$a$'nick', g.nick, 'zdjecie', g.zdjecie_url,
               'doping', (select count(*) from public.okrzyki k where k.finalista_id = g.id),
               'odpowiedzi'$a$);
  if v_nowa = v_przed then
    raise exception 'stan_sesji: nie znaleziono fragmentu 2';
  end if;

  v_przed := v_nowa;
  v_nowa := replace(v_nowa,
$a$    'faza', v_faza,$a$,
$a$    'okrzyki', case when v_faza = 'seria' then (
      select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'kibic', t.kibic, 'finalista', t.finalista,
                                                   'haslo', t.haslo, 'utworzono', t.utworzono)
                                order by t.utworzono), '[]'::jsonb)
        from (
          select k.id, gk.nick as kibic, gf.nick as finalista, k.haslo, k.utworzono
            from public.okrzyki k
            join public.gracze gk on gk.id = k.gracz_id
            join public.gracze gf on gf.id = k.finalista_id
           where k.sesja_id = v_s.id and k.utworzono > clock_timestamp() - interval '8 seconds'
           order by k.utworzono desc
           limit 30
        ) t
    ) end,
    'faza', v_faza,$a$);
  if v_nowa = v_przed then
    raise exception 'stan_sesji: nie znaleziono fragmentu 3';
  end if;

  execute v_nowa;
end
$do$;
