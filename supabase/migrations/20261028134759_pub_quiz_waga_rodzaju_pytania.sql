-- Pub quiz (28.10, Łukasz): pytania bez etapu nie mają mnożnika, ale trudniejsze rodzaje dają więcej punktów, jak
-- w wyścigu: kilka dobrych ×1,5, szacowanie, kolejność i pary ×2, jedna odpowiedź i prawda/fałsz ×1.
-- W wyścigu nic się nie zmienia: tam mnożnik etapu jest zawsze ustawiony.
create or replace function wewn.waga_typu(p_typ text)
 returns numeric
 language sql
 immutable
 set search_path to ''
as $function$
  select case p_typ
           when 'wielokrotny' then 1.5
           when 'szacowanie' then 2
           when 'kolejnosc' then 2
           when 'pary' then 2
           else 1
         end
$function$;

do $$
declare
  d text := pg_get_functiondef('wewn.punkty_odpowiedzi(text,numeric,integer,integer,boolean,numeric)'::regprocedure);
  stare text := 'coalesce(p_mnoznik, 1) *';
begin
  if position(stare in d) = 0 then
    raise exception 'Nie ma fragmentu w wewn.punkty_odpowiedzi';
  end if;
  execute replace(d, stare, 'coalesce(p_mnoznik, wewn.waga_typu(p_typ)) *');
end $$;
