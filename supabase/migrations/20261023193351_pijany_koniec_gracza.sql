-- Pijany finał kończy się, gdy pierwszy gracz dojdzie do końca pytań: od razu werble dla wszystkich
-- (bez ekranu „Gotowe!”, który zdradzał dogrywkę). Odpowiedzi nic nie liczą, więc wystarczy token gracza tej gry.
create or replace function public.zakoncz_pijany(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sesja uuid;
begin
  select sesja_id into v_sesja from public.gracze where token = p_token;
  if v_sesja is null then
    raise exception 'Nieznany gracz';
  end if;
  update public.sesje
     set faza = 'werble', faza_od = clock_timestamp(), faza_do = null
   where id = v_sesja and faza = 'pijany';
end;
$$;
revoke execute on function public.zakoncz_pijany(text) from public;
grant execute on function public.zakoncz_pijany(text) to anon, authenticated, service_role;
