-- Zapowiedź finału trójki: etap wie, czy zaraz po nim jest finał (wtedy plansza etapu, ranking i telefony
-- mówią, że 3 najlepszych wchodzi do finału, a reszta odpada) i czy finał jest gdzieś dalej w quizie.

create or replace function wewn.etap_json(p_etap_id uuid, p_s public.sesje)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', e.id,
    'nr', e.nr,
    'liczba', (select count(*) from public.etapy where quiz_id = e.quiz_id),
    'nazwa', e.nazwa,
    'opis', e.opis,
    'mnoznik', e.mnoznik,
    'czas_s', coalesce(e.czas_s, p_s.czas_s),
    'finalowy', e.finalowy,
    'final_po_etapie', exists (
      select 1 from public.etapy n where n.quiz_id = e.quiz_id and n.nr = e.nr + 1 and n.finalowy
    ),
    'final_dalej', exists (
      select 1 from public.etapy n where n.quiz_id = e.quiz_id and n.nr > e.nr and n.finalowy
    ),
    'liczba_pytan', (select count(*) from public.zadania where etap_id = e.id),
    'typy', (
      select coalesce(jsonb_agg(t.typ order by t.pierwszy), '[]'::jsonb)
        from (select typ, min(nr) as pierwszy from public.zadania where etap_id = e.id group by typ) t
    )
  )
    from public.etapy e
   where e.id = p_etap_id
$$;
