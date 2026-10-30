-- Pub quiz (30.10, Łukasz): prawda/fałsz za połowę (do 500 pkt). Przy dwóch odpowiedziach zgadywanie w ciemno
-- dawało średnio dwa razy więcej niż przy jednej z czterech, a pytanie mniej mówi o wiedzy. Z wagą 0,5 zgadywanie
-- w obu rodzajach daje średnio tyle samo. Wyścigu nie dotyczy (etapy mają własny mnożnik).
create or replace function wewn.waga_typu(p_typ text)
 returns numeric
 language sql
 immutable
 set search_path to ''
as $function$
  select case p_typ
           when 'prawda_falsz' then 0.5
           when 'wielokrotny' then 1.5
           when 'szacowanie' then 2
           when 'kolejnosc' then 2
           when 'pary' then 2
           else 1
         end
$function$;
