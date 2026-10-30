-- Statystyki pytań quizu (30.10, strona „Statystyki” quizu w panelu): ze wszystkich podanych gier, tylko odpowiedzi
-- prawdziwych graczy (bez botów). Trafność to średnia ocena (0..1, przy kilku dobrych, kolejności i parach także
-- częściowo). Gry podaje serwer (już przefiltrowane według roli), więc funkcja nie sprawdza dostępu: tylko klucz
-- serwisowy.
create or replace function public.statystyki_quizu(p_quiz uuid, p_sesje uuid[])
returns table (
  zadanie_id uuid,
  odpowiedzi integer,
  trafnosc numeric,
  sredni_czas_ms integer,
  najszybciej_dobrze_ms integer
)
language sql
stable
set search_path to ''
as $function$
  select o.zadanie_id,
         count(*)::integer,
         round(avg(coalesce(o.ocena, case when o.poprawna then 1 else 0 end)), 4),
         round(avg(o.czas_ms))::integer,
         min(o.czas_ms) filter (where o.poprawna)::integer
  from public.odpowiedzi o
  join public.gracze g on g.id = o.gracz_id
  join public.zadania z on z.id = o.zadanie_id
  where o.sesja_id = any(p_sesje)
    and z.quiz_id = p_quiz
    and not coalesce(g.bot, false)
  group by o.zadanie_id
$function$;

revoke all on function public.statystyki_quizu(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.statystyki_quizu(uuid, uuid[]) to service_role;
