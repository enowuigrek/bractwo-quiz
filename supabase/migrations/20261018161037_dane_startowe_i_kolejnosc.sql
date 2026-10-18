-- Dzień 2: dane startowe (Częstochowa) i zamiana kolejności zadań w panelu.

-- Lokale w Częstochowie. Loga leżą w public/loga/, więc ścieżka jest względna do adresu aplikacji.
insert into public.piwiarnie (nazwa, miasto, logo_url)
select v.nazwa, 'Częstochowa', v.logo_url
  from (values
    ('Piwiarnia w Alejach', '/loga/piwiarnia-w-alejach.png'),
    ('PPR', '/loga/ppr.png')
  ) v(nazwa, logo_url)
 where not exists (select 1 from public.piwiarnie p where p.nazwa = v.nazwa and p.miasto = 'Częstochowa');

-- Zamiana numerów dwóch zadań tego samego quizu w jednej transakcji
-- (unikalność (quiz_id, nr) jest odroczona do końca transakcji).
-- Tylko dla panelu admina: wykonuje ją wyłącznie service_role.
create function public.admin_zamien_zadania(p_a uuid, p_b uuid)
returns void
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_a public.zadania;
  v_b public.zadania;
begin
  select * into v_a from public.zadania where id = p_a for update;
  select * into v_b from public.zadania where id = p_b for update;
  if v_a.id is null or v_b.id is null or v_a.quiz_id <> v_b.quiz_id then
    raise exception 'Nie ma takich zadań w jednym quizie';
  end if;
  update public.zadania set nr = v_b.nr where id = v_a.id;
  update public.zadania set nr = v_a.nr where id = v_b.id;
end;
$$;

revoke execute on function public.admin_zamien_zadania(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_zamien_zadania(uuid, uuid) to service_role;
