-- Ilu graczy wchodzi do finału, z quizu (18.11, JOWES: 5; domyślnie jak dotąd 3). Wybór finalistów, progi
-- odpadania przed finałem (zostaje więcej niż finalistów) i stan gry (`quiz.finalistow`, kreska na TV).
alter table public.quizy add column if not exists finalistow int not null default 3;
alter table public.quizy drop constraint if exists quizy_finalistow_check;
alter table public.quizy add constraint quizy_finalistow_check check (finalistow between 2 and 8);

update public.quizy set finalistow = 5
 where tytul = 'Jak dobrze znasz JOWES i siebie nawzajem?' and usunieto is null;

do $$
declare
  v_oid oid;
  v_def text;
  v_fin text := $s$coalesce((select q.finalistow from public.sesje s join public.quizy q on q.id = s.quiz_id where s.id = p_sesja_id), 3)$s$;
begin
  -- wybór finalistów
  select p.oid into v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'wewn' and p.proname = 'wybierz_finalistow';
  v_def := pg_get_functiondef(v_oid);
  if position('where t.r <= 3' in v_def) = 0 then raise exception 'wybierz_finalistow: brak progu 3'; end if;
  execute replace(v_def, 'where t.r <= 3', 'where t.r <= ' || v_fin);

  -- progi odpadania: po etapach przed finałem zostaje więcej osób niż finalistów
  select p.oid into v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'wewn' and p.proname = 'progi_domyslne';
  v_def := pg_get_functiondef(v_oid);
  if position('v_po > 3' in v_def) = 0 then raise exception 'progi_domyslne: brak progu 3'; end if;
  execute replace(v_def, 'v_po > 3', 'v_po > ' || v_fin);

  -- stan gry: liczba finalistów w danych quizu
  select p.oid into v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'stan_sesji';
  v_def := pg_get_functiondef(v_oid);
  if position($s$'finalistow', q.finalistow$s$ in v_def) = 0 then
    if position($s$        'degustacja', q.degustacja,$s$ in v_def) = 0 then raise exception 'stan_sesji: brak degustacja'; end if;
    execute replace(v_def, $s$        'degustacja', q.degustacja,$s$,
                    $s$        'degustacja', q.degustacja,
        'finalistow', q.finalistow,$s$);
  end if;
end $$;
