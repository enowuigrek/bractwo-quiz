-- Gra zapowiedziana na godzinę z automatycznym prowadzeniem (ustawionym w kreatorze w panelu): poczekalnia
-- otwiera się sama o `planowany_start`, a 5 minut później automat startuje quiz (src/lib/gra/auto.ts).
-- Otwiera ją pierwszy, kto zapyta po czasie: ekran lokalu (`otworz_zaplanowane`), TV albo pilot (/api/auto,
-- krok `otworz`) albo telefon gracza (`dolacz`). Wyłączony automat = jak dotąd, otwiera prowadzący.

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
     and planowany_start <= clock_timestamp();
  return found;
end;
$function$;

-- ekran lokalu woła to przy zapowiedzi po godzinie startu (sam `ekran_lokalu` tylko czyta)
create or replace function public.otworz_zaplanowane(p_adres text)
 returns boolean
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_id uuid;
  v_otwarta boolean := false;
begin
  for v_id in
    select s.id
      from public.sesje s
      join public.lokale l on l.id = s.lokal_id
     where l.adres_ekranu = lower(trim(p_adres))
       and s.faza = 'poczekalnia' and not s.poczekalnia_otwarta and s.auto
  loop
    v_otwarta := wewn.otworz_o_czasie(v_id) or v_otwarta;
  end loop;
  return v_otwarta;
end;
$function$;

grant execute on function public.otworz_zaplanowane(text) to anon, authenticated, service_role;

-- telefon gracza po godzinie startu otwiera poczekalnię sam, zamiast „Zapisy jeszcze nie ruszyły”
do $$
declare
  v_def text := pg_get_functiondef('public.dolacz(text,text,text)'::regprocedure);
begin
  if position('if not v_s.poczekalnia_otwarta then' in v_def) = 0 then
    raise exception 'dolacz: nie znaleziono warunku poczekalni';
  end if;
  execute replace(v_def, 'if not v_s.poczekalnia_otwarta then',
                  'if not v_s.poczekalnia_otwarta and not wewn.otworz_o_czasie(v_s.id) then');
end $$;

-- zapowiedź na ekranie lokalu mówi, czy poczekalnia otworzy się sama
do $$
declare
  v_def text := pg_get_functiondef('public.ekran_lokalu(text)'::regprocedure);
begin
  if position('''muzyka'', v_zap.muzyka,' in v_def) = 0 then
    raise exception 'ekran_lokalu: nie znaleziono muzyki w zapowiedzi';
  end if;
  execute replace(v_def, '''muzyka'', v_zap.muzyka,', '''muzyka'', v_zap.muzyka, ''auto'', v_zap.auto,');
end $$;
