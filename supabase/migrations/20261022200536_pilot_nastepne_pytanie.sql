-- Pilot widzi rodzaj następnego pytania, żeby uprzedzić graczy przed jego startem
-- (np. „teraz łączymy w pary”). Reszta jak w schemacie.
create or replace function public.pilot_stan(p_kod text, p_host_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_z public.zadania;
  v_nast public.zadania;
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
  select * into v_nast
    from public.zadania
   where quiz_id = v_s.quiz_id and nr > v_s.zadanie_nr
   order by nr
   limit 1;

  return public.stan_sesji(v_s.kod) || jsonb_build_object(
    'poprawna', v_z.dane -> 'poprawna',
    'liczba_odpowiedzi', (
      select count(*) from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id
    ),
    'ostatnie_zadanie', v_nast.id is null,
    'nastepne_typ', v_nast.typ
  );
end;
$$;
