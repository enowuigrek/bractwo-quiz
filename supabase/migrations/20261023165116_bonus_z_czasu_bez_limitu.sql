-- Bonus bez limitu czasu z czasu, nie z kolejności: przy jednym telefonie (albo gdy ktoś był pierwszy)
-- kolejność dawała zawsze 1000. Teraz bez limitu punkty maleją od startu pytania: 1000 → 500 przez 30 s,
-- przy wielokrotnym, parach i kolejności przez 60 s, potem 500 (razy ocena i mnożnik etapu).

create or replace function public.zapisz_odpowiedz(p_token text, p_zadanie_id uuid, p_dane jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teraz timestamptz := clock_timestamp();
  v_g public.gracze;
  v_s public.sesje;
  v_z public.zadania;
  v_e public.etapy;
  v_czas int;
  v_czas_ms int;
  v_limit_ms int;
  v_poprawna boolean;
  v_ocena numeric;
  v_baza numeric;
  v_punkty int;
  v_id uuid;
  v_liczba int;
begin
  select * into v_g from public.gracze where token = p_token;
  if v_g.id is null then
    raise exception 'Nieznany gracz';
  end if;

  select * into v_s from public.sesje where id = v_g.sesja_id;
  if v_s.faza <> 'pytanie' then
    return jsonb_build_object('przyjeta', false, 'powod', 'nie_teraz');
  end if;

  select * into v_z from public.zadania where quiz_id = v_s.quiz_id and nr = v_s.zadanie_nr;
  if v_z.id is distinct from p_zadanie_id then
    return jsonb_build_object('przyjeta', false, 'powod', 'inne_zadanie');
  end if;

  -- finał: odpowiadają tylko finaliści, reszta kibicuje
  if v_s.finalisci is not null and not (v_g.id = any (v_s.finalisci)) then
    return jsonb_build_object('przyjeta', false, 'powod', 'kibic');
  end if;

  if v_teraz < v_s.faza_od then
    return jsonb_build_object('przyjeta', false, 'powod', 'za_wczesnie');
  end if;
  if v_s.faza_do is not null and v_teraz > v_s.faza_do + interval '1 second' then
    return jsonb_build_object('przyjeta', false, 'powod', 'po_czasie');
  end if;

  if pg_column_size(p_dane) > 2000 then
    raise exception 'Nieprawidłowa odpowiedź';
  end if;

  select * into v_e from public.etapy where id = v_z.etap_id;
  v_czas := coalesce(v_e.czas_s, v_s.czas_s);

  v_czas_ms := greatest(floor(extract(epoch from (v_teraz - v_s.faza_od)) * 1000)::int, 0);
  v_ocena := wewn.ocena(v_z.typ, v_z.dane, p_dane);
  v_poprawna := v_ocena = 1;

  if v_czas is null then
    -- bez limitu: bonus maleje z czasem od startu pytania, od 1000 do 500 po 30 s (wielokrotny, pary
    -- i kolejność dłużej się układa: 60 s), potem zostaje 500; nikt nie musi się zmieścić w limicie
    v_limit_ms := case when v_z.typ in ('wielokrotny', 'kolejnosc', 'pary') then 60000 else 30000 end;
    v_baza := case
      when v_s.bonus_czas then 500 + 500 * (1 - least(v_czas_ms, v_limit_ms)::numeric / v_limit_ms)
      else 1000
    end;
  else
    v_limit_ms := v_czas * 1000;
    v_czas_ms := least(v_czas_ms, v_limit_ms);
    v_baza := case when v_s.bonus_czas then 500 + 500 * (1 - v_czas_ms::numeric / v_limit_ms) else 1000 end;
  end if;
  -- mnożnik etapu: trudniejsze etapy są więcej warte
  v_punkty := round(v_baza * v_ocena * coalesce(v_e.mnoznik, 1))::int;

  insert into public.odpowiedzi (gracz_id, sesja_id, zadanie_id, dane, czas_ms, poprawna, punkty, ocena)
  values (v_g.id, v_s.id, v_z.id, p_dane, v_czas_ms, v_poprawna, v_punkty, v_ocena)
  on conflict (gracz_id, zadanie_id) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('przyjeta', false, 'powod', 'juz_odpowiedziano');
  end if;

  select count(*) into v_liczba from public.odpowiedzi where sesja_id = v_s.id and zadanie_id = v_z.id;
  perform wewn.rozglos(v_s.kod, 'odpowiedz', jsonb_build_object('liczba', v_liczba));

  perform wewn.zamknij_pytanie_jesli_gotowe(v_s.id);

  return jsonb_build_object('przyjeta', true, 'czas_ms', v_czas_ms);
end;
$$;
