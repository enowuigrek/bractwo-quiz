-- Meta finału (ile kroków do wygranej) z quizu (18.11, JOWES: 10 zamiast 12). Brak = 12 jak dotąd.
-- Klient czyta ją ze stanu gry (`quiz.meta_finalu`, src/lib/gra/final.ts `metaFinalu`).
alter table public.quizy add column if not exists meta_finalu int check (meta_finalu between 4 and 20);

create or replace function wewn.meta_finalu(p_sesja_id uuid)
returns integer
language sql
stable
set search_path to ''
as $$
  select coalesce((select q.meta_finalu from public.sesje s join public.quizy q on q.id = s.quiz_id where s.id = p_sesja_id), 12)
$$;

do $$
declare
  v_oid oid;
  v_def text;
begin
  v_oid := 'wewn.ranking'::regproc;
  v_def := pg_get_functiondef(v_oid);
  if position('wewn.meta_finalu() - 0.001) as czas_mety' in v_def) = 0 then
    raise exception 'ranking: nie znaleziono mety';
  end if;
  execute replace(v_def, 'wewn.meta_finalu() - 0.001) as czas_mety', 'wewn.meta_finalu(p_sesja_id) - 0.001) as czas_mety');

  v_oid := 'wewn.zamknij_serie_jesli_gotowe'::regproc;
  v_def := pg_get_functiondef(v_oid);
  if position('then wewn.meta_finalu() end into v_meta' in v_def) = 0 then
    raise exception 'zamknij_serie_jesli_gotowe: nie znaleziono mety';
  end if;
  execute replace(v_def, 'then wewn.meta_finalu() end into v_meta', 'then wewn.meta_finalu(v_s.id) end into v_meta');

  v_oid := 'public.stan_sesji'::regproc;
  v_def := pg_get_functiondef(v_oid);
  if position('''finalistow'', q.finalistow,' in v_def) = 0 then
    raise exception 'stan_sesji: nie znaleziono finalistow';
  end if;
  execute replace(v_def, '''finalistow'', q.finalistow,', '''finalistow'', q.finalistow,
        ''meta_finalu'', q.meta_finalu,');
end;
$$;

update public.quizy q
   set meta_finalu = 10
  from public.lokale l
 where l.id = q.lokal_id
   and l.adres_ekranu = 'jowes'
   and q.meta_finalu is null;
