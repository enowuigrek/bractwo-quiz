-- Boty odpowiadają od razu (25.10, Łukasz: czekanie na nie irytuje), ale z udawanym czasem: zapisany czas odpowiedzi
-- to losowe 2–12 s (lepsze boty szybciej, w zakresie limitu pytania), a punkty za szybkość liczą się od tego czasu
-- tym samym wzorem co w `zapisz_odpowiedz`. Pytanie zamyka się więc, gdy tylko odpowiedzą ludzie, a ranking
-- i „Najszybciej” wyglądają jak przy prawdziwych graczach. Seria finału bez zmian (tam liczy się bieg w czasie).

-- Udawany czas odpowiedzi bota: 2–12 s (mądrzejszy szybciej, najwyżej 70% limitu pytania) i punkty od tego czasu,
-- jak w `zapisz_odpowiedz` (bonus za szybkość od 1000 do 500, mnożnik etapu).
create or replace function wewn.udawany_czas_bota(p_gracz_id uuid, p_z public.zadania, p_s public.sesje, p_wiedza numeric)
 returns void
 language plpgsql
 volatile
 set search_path to ''
as $function$
declare
  v_e public.etapy;
  v_czas int;
  v_limit_ms int;
  v_ms int;
begin
  select * into v_e from public.etapy where id = p_z.etap_id;
  v_czas := coalesce(v_e.czas_s, p_s.czas_s);
  v_limit_ms := case
    when v_czas is not null then v_czas * 1000
    when p_z.typ in ('wielokrotny', 'kolejnosc', 'pary') then 60000
    else 30000
  end;
  v_ms := least(round(v_limit_ms * 0.7)::int,
                round(2000 + random() * 10000 * (1.3 - p_wiedza))::int);
  update public.odpowiedzi o
     set czas_ms = v_ms,
         punkty = round(
           case when p_s.bonus_czas then 500 + 500 * (1 - least(v_ms, v_limit_ms)::numeric / v_limit_ms) else 1000 end
           * o.ocena * coalesce(v_e.mnoznik, 1))::int
   where o.gracz_id = p_gracz_id and o.zadanie_id = p_z.id;
end;
$function$;

do $$
declare
  v_def text;
  v_stare text := $s$        -- co wywołanie ok. co trzeci bot bez odpowiedzi odpowiada, więc odpowiedzi rozkładają się w czasie
        continue when random() > 0.3
          or exists (select 1 from public.odpowiedzi o where o.gracz_id = v_b.id and o.zadanie_id = v_z.id);
        v_dane := wewn.odpowiedz_bota(v_z, v_b.wiedza);
        continue when v_dane is null;
        perform public.zapisz_odpowiedz(v_b.token, v_z.id, v_dane);$s$;
begin
  v_def := pg_get_functiondef('public.boty_odpowiadaj(text, text)'::regprocedure);
  if position(v_stare in v_def) = 0 then
    raise exception 'boty_odpowiadaj: nie znaleziono odpowiadania w pytaniu';
  end if;
  v_def := replace(v_def, v_stare, $s$        -- wszystkie boty od razu, a czas odpowiedzi udawany (niżej), żeby nie czekać na nie przy testach
        continue when exists (select 1 from public.odpowiedzi o where o.gracz_id = v_b.id and o.zadanie_id = v_z.id);
        v_dane := wewn.odpowiedz_bota(v_z, v_b.wiedza);
        continue when v_dane is null;
        perform public.zapisz_odpowiedz(v_b.token, v_z.id, v_dane);
        perform wewn.udawany_czas_bota(v_b.id, v_z, v_s, v_b.wiedza);$s$);
  execute v_def;
end $$;
