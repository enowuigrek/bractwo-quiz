-- Tabela wyników po finale (28.10, Łukasz): finalista z mniejszą liczbą punktów może wygrać, więc przy finalistach
-- ranking podaje też przebieg finału: przewagę na starcie, dobre i złe odpowiedzi oraz kroki (`final`).
do $$
declare
  d text := pg_get_functiondef('public.ranking(text)'::regprocedure);
  stare text := $a$'odpadl', g.odpadl_po_etapie
$a$;
begin
  if position(stare in d) = 0 then
    raise exception 'Nie ma fragmentu w public.ranking';
  end if;
  execute replace(d, stare, $a$'odpadl', g.odpadl_po_etapie,
               'final', case when g.id = any (coalesce(v_s.finalisci, '{}')) then (
                 select jsonb_build_object(
                          'start', coalesce(g.start_finalu, 0),
                          'dobre', count(o.id) filter (where o.ocena >= 1),
                          'zle', count(o.id) filter (where o.ocena < 1),
                          'kroki', wewn.kroki_finalu(g.id, e.id))
                   from public.etapy e
                   left join public.odpowiedzi o
                     on o.gracz_id = g.id
                    and o.zadanie_id in (select z.id from public.zadania z where z.etap_id = e.id)
                  where e.quiz_id = v_s.quiz_id and e.finalowy and e.seria
                  group by e.id
                  limit 1) end
$a$);
end $$;
