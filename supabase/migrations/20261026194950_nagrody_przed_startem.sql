-- Nagrody zmieniane z pilota przed startem quizu (26.10, Łukasz: ustalane na miejscu, gdy gra już jest
-- zapowiedziana). Tylko w poczekalni, kluczem pilota. `p_nagrody`: null albo tablica 1 lub 3 nagród po kolei
-- ({miejsce, nagroda, instrukcja, zdjecie}); zdjęcie tylko z naszego magazynu (`/api/nagroda`).
create or replace function public.ustaw_nagrody(p_kod text, p_host_token text, p_nagrody jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_s public.sesje;
  v_n jsonb;
  v_wynik jsonb := '[]'::jsonb;
  v_ile int;
  v_nagroda text;
  v_instrukcja text;
  v_zdjecie text;
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  if v_s.faza <> 'poczekalnia' then
    raise exception 'Nagrody można zmienić tylko przed startem quizu';
  end if;
  v_ile := case when p_nagrody is null or jsonb_typeof(p_nagrody) <> 'array' then 0 else jsonb_array_length(p_nagrody) end;
  if v_ile not in (0, 1, 3) then
    raise exception 'Nagroda za 1. miejsce albo za pierwszą trójkę';
  end if;
  for i in 1..v_ile loop
    v_n := p_nagrody -> (i - 1);
    v_nagroda := btrim(coalesce(v_n ->> 'nagroda', ''));
    v_instrukcja := nullif(btrim(coalesce(v_n ->> 'instrukcja', '')), '');
    v_zdjecie := nullif(v_n ->> 'zdjecie', '');
    if v_nagroda = '' then
      raise exception 'Wpisz nagrodę za %. miejsce', i;
    end if;
    if length(v_nagroda) > 80 or length(coalesce(v_instrukcja, '')) > 160 then
      raise exception 'Nagroda za %. miejsce jest za długa', i;
    end if;
    if v_zdjecie is not null and position('/storage/v1/object/public/grafiki/nagrody/' in v_zdjecie) = 0 then
      v_zdjecie := null;
    end if;
    v_wynik := v_wynik || jsonb_strip_nulls(jsonb_build_object(
      'miejsce', i, 'nagroda', v_nagroda, 'instrukcja', v_instrukcja, 'zdjecie', v_zdjecie
    ));
  end loop;
  update public.sesje set nagrody = case when v_ile = 0 then null else v_wynik end where id = v_s.id;
  perform wewn.rozglos(v_s.kod, 'stan', '{}'::jsonb);
  return public.pilot_stan(v_s.kod, p_host_token);
end;
$function$;
