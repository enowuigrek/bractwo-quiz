-- Odpadanie w etapach przed finałem (24.10), część 1: kolumny i domyślne progi.
-- Progi zależą od liczby graczy: do 8 graczy nikt nie odpada przed finałem, 9–15: po etapie przed walką
-- o finał zostaje 6, od 16: dwa etapy przed walką o finał zostaje połowa (najmniej 8), etap później 6.
alter table public.sesje add column progi jsonb;
alter table public.gracze add column odpadl_po_etapie int;

-- Domyślne progi: {"nr etapu": ilu przechodzi po nim}. Tylko quiz z finałem trójki i co najmniej dwoma
-- etapami przed walką o finał (po rozgrzewce nikt nie odpada).
create or replace function wewn.progi_domyslne(p_sesja_id uuid)
 returns jsonb
 language plpgsql
 stable
 set search_path to ''
as $function$
declare
  v_n int;
  v_walka int;
  v_wynik jsonb := '{}'::jsonb;
begin
  select count(*) into v_n from public.gracze where sesja_id = p_sesja_id;
  select min(e.nr) - 1 into v_walka
    from public.etapy e join public.sesje s on s.quiz_id = e.quiz_id
   where s.id = p_sesja_id and e.finalowy;
  if v_walka is null or v_walka < 3 or v_n <= 8 then
    return v_wynik;
  end if;
  v_wynik := jsonb_build_object((v_walka - 1)::text, 6);
  if v_n >= 16 and v_walka - 2 >= 2 then
    v_wynik := v_wynik || jsonb_build_object((v_walka - 2)::text, greatest(8, ceil(v_n / 2.0)::int));
  end if;
  return v_wynik;
end;
$function$;
