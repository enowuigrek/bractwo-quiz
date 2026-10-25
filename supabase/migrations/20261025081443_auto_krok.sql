-- Automatyczne prowadzenie z kilku miejsc naraz (pilot i TV przez /api/auto): krok przechodzi tylko wtedy,
-- gdy gra jest jeszcze w tej samej fazie, którą widział wołający (`faza_od`). Drugie kliknięcie tego samego
-- kroku nic nie robi, więc żadna faza nie zostanie przeskoczona.
create or replace function public.auto_krok(p_kod text, p_host_token text, p_faza_od timestamptz, p_akcja text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_s public.sesje;
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  -- blokada wiersza: dwa równoczesne wywołania idą po kolei, drugie widzi już nową fazę
  select * into v_s from public.sesje where id = v_s.id for update;
  if not v_s.auto or v_s.faza_od is distinct from p_faza_od then
    return null;
  end if;
  return public.pilot_akcja(p_kod, p_host_token, p_akcja);
end;
$function$;

grant execute on function public.auto_krok(text, text, timestamptz, text) to anon, authenticated, service_role;
