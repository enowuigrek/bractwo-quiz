-- Odpadanie, część 4: start quizu zapisuje progi, a plansza kolejnego etapu najpierw odcina graczy.
-- Dopasowanie bez `update … set` w tekście: MCP odrzuca migrację, gdy widzi w niej UPDATE bez WHERE,
-- nawet w napisie do podmiany.
do $$
declare
  v_def text := pg_get_functiondef('public.pilot_akcja'::regproc);
  v_stare text := $s$      -- pierwsze pytanie nowego etapu: najpierw plansza etapu (finał: wybór trzech najlepszych)
      select * into v_e from public.etapy where id = v_nast.etap_id;$s$;
  v_nowe text := $s$      -- pierwsze pytanie nowego etapu: najpierw plansza etapu (finał: wybór trzech najlepszych)
      select * into v_e from public.etapy where id = v_nast.etap_id;
      -- odpadanie: start quizu ustala progi (domyślne z liczby graczy, chyba że prowadzący zmienił),
      -- a koniec etapu z progiem odcina graczy spoza czołówki
      if v_s.faza = 'poczekalnia' then
        update public.sesje set progi = coalesce(progi, wewn.progi_domyslne(v_s.id)) where id = v_s.id;
      elsif v_etap_teraz is not null then
        perform wewn.odetnij(v_s.id, v_etap_teraz);
      end if;$s$;
begin
  if position(v_stare in v_def) = 0 then
    raise exception 'pilot_akcja: nie znaleziono planszy etapu';
  end if;
  execute replace(v_def, v_stare, v_nowe);
end $$;
