-- Gracza usuwa serwer aplikacji (/api/gracz, klucz serwisowy). Potem pilot woła tę funkcję:
-- rozgłasza zmianę listy i, jeśli trwa pytanie, a reszta już odpowiedziała, od razu pokazuje wynik.
-- (Funkcja SQL z `delete` nie przechodzi przez MCP Supabase, więc samo usuwanie jest na serwerze.)
create function public.po_usunieciu_gracza(p_kod text, p_host_token text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_s public.sesje;
  v_liczba int;
begin
  v_s := wewn.sesja_prowadzacego(p_kod, p_host_token);
  select count(*) into v_liczba from public.gracze where sesja_id = v_s.id;
  perform wewn.rozglos(v_s.kod, 'gracz', jsonb_build_object('liczba', v_liczba, 'usuniety', true));
  perform wewn.zamknij_pytanie_jesli_gotowe(v_s.id);
end;
$$;

revoke execute on function public.po_usunieciu_gracza(text, text) from public;
grant execute on function public.po_usunieciu_gracza(text, text) to anon, authenticated;
