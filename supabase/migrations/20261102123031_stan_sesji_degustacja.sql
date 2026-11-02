-- stan gry mówi, że to degustacja (02.11): telefon i TV potrzebują tego już w poczekalni (nagłówek „Degustacja”),
-- zanim pojawi się pierwsze piwo. Podmiana jednej linii w obecnej wersji funkcji.
do $$
declare
  v_stara text := pg_get_functiondef('public.stan_sesji(text)'::regprocedure);
  v_nowa text;
begin
  v_nowa := replace(v_stara,
    $a$'liczba_etapow', (select count(*) from public.etapy where quiz_id = q.id),$a$,
    $b$'liczba_etapow', (select count(*) from public.etapy where quiz_id = q.id),
        'degustacja', q.degustacja,$b$);
  if v_nowa = v_stara then
    raise exception 'Nie znaleziono miejsca na degustację w stan_sesji';
  end if;
  execute v_nowa;
end;
$$;
