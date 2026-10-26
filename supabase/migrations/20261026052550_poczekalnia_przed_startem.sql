-- Automat od godziny (26.10, Łukasz): godzina z kreatora to start quizu, nie otwarcie poczekalni. Poczekalnia
-- otwiera się 5 minut wcześniej (na dołączenie), a quiz rusza o tej godzinie (src/lib/gra/auto.ts, NA_ZAPISY_MIN).
create or replace function wewn.otworz_o_czasie(p_sesja uuid)
 returns boolean
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  update public.sesje
     set poczekalnia_otwarta = true
   where id = p_sesja
     and faza = 'poczekalnia'
     and not poczekalnia_otwarta
     and auto
     and planowany_start - interval '5 minutes' <= clock_timestamp();
  return found;
end;
$function$;
