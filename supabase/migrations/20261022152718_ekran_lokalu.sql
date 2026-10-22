-- Ekran lokalu (/ekran/<adres_ekranu>): bez gry pokazuje plansze, a gdy w lokalu ruszy gra,
-- sam przechodzi na nią. Po zakończeniu gry jeszcze 10 minut pokazuje jej koniec (podium),
-- potem wraca do plansz. Przy dwóch grach naraz pokazuje najnowszą.

create function public.ekran_lokalu(p_adres text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_l public.lokale;
begin
  select * into v_l from public.lokale where adres_ekranu = lower(trim(p_adres));
  if v_l.id is null then
    raise exception 'Nie ma lokalu o adresie %', p_adres;
  end if;

  return jsonb_build_object(
    'lokal', jsonb_build_object('nazwa', v_l.nazwa, 'miasto', v_l.miasto, 'logo_url', v_l.logo_url),
    'kod', (
      select s.kod
        from public.sesje s
       where s.lokal_id = v_l.id
         and (s.faza <> 'koniec' or s.faza_od > now() - interval '10 minutes')
       order by (s.faza <> 'koniec') desc, s.utworzono desc
       limit 1
    )
  );
end;
$$;

revoke execute on function public.ekran_lokalu(text) from public;
grant execute on function public.ekran_lokalu(text) to anon, authenticated;

-- Zdarzenie `gra` na temacie `lokal:<adres_ekranu>`, gdy w lokalu powstaje, kończy się albo znika gra.
-- Ekran po nim woła `ekran_lokalu` (i tak odpytuje co kilka sekund, gdyby zdarzenie zginęło).
create function wewn.po_zmianie_gry_lokalu()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lokal uuid := coalesce(new.lokal_id, old.lokal_id);
  v_adres text;
begin
  if tg_op = 'UPDATE' and new.faza is not distinct from old.faza and new.lokal_id is not distinct from old.lokal_id then
    return null;
  end if;
  select adres_ekranu into v_adres from public.lokale where id = v_lokal;
  if v_adres is not null then
    perform realtime.send('{}'::jsonb, 'gra', 'lokal:' || v_adres, false);
  end if;
  return null;
end;
$$;

revoke execute on function wewn.po_zmianie_gry_lokalu() from public, anon, authenticated;

create trigger sesje_rozglos_lokal
  after insert or update or delete on public.sesje
  for each row execute function wewn.po_zmianie_gry_lokalu();
