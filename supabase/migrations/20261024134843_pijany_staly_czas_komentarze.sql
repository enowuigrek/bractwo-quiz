-- Pijany finał od 24.10: stały czas (60 s), cała pula pytań zamiast 8 i komentarze po odpowiedzi.
-- Koniec nie zależy już od graczy (zakoncz_pijany zostaje nieużywana): telefony gasną 5,5 s przed końcem,
-- 3 s przed końcem szklanka wybucha na TV, a z końcem fazy przychodzą werble.

alter table public.pijane_pytania
  add column komentarz_prawda text,
  add column komentarz_falsz text;

do $$
declare
  v_def text := pg_get_functiondef('wewn.zakoncz_serie'::regproc);
  v_stare text := $s$clock_timestamp() + interval '90 seconds'$s$;
  v_nowe text := $s$clock_timestamp() + interval '60 seconds'$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'zakoncz_serie: nie znaleziono 90 s';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;

-- Cała pula w kolejności z listy, ale w każdej grze trochę inaczej: do numeru dochodzi losowe 0..4
-- (z id gry, więc wszyscy gracze tej gry mają to samo). Chaos dalej z grubsza narasta.
create or replace function public.pijane_pytania(p_kod text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
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
             'nr', w.nr,
             'tresc', wewn.pijane_wstawki(w.tresc, v_s.za_barem, v_lokal),
             'efekt', w.efekt,
             'komentarz_prawda', wewn.pijane_wstawki(w.komentarz_prawda, v_s.za_barem, v_lokal),
             'komentarz_falsz', wewn.pijane_wstawki(w.komentarz_falsz, v_s.za_barem, v_lokal)
           ) order by w.klucz)
      from (
        select p.nr, p.tresc, p.efekt, p.komentarz_prawda, p.komentarz_falsz,
               p.nr + (('x' || substr(md5(p.id::text || v_s.id::text), 1, 6))::bit(24)::int % 400) / 100.0 as klucz
          from public.pijane_pytania p
         where (p.tresc not like '%{za_barem}%'
                and coalesce(p.komentarz_prawda, '') not like '%{za_barem}%'
                and coalesce(p.komentarz_falsz, '') not like '%{za_barem}%')
            or nullif(trim(v_s.za_barem), '') is not null
      ) w
  ), '[]'::jsonb);
end;
$function$;

create or replace function wewn.pijane_wstawki(p_tekst text, p_za_barem text, p_lokal text)
 returns text
 language sql
 immutable
 set search_path to ''
as $function$
  select nullif(replace(replace(p_tekst, '{za_barem}', coalesce(p_za_barem, '')),
                        '{lokal}', coalesce(p_lokal, 'tym barze')), '');
$function$;
