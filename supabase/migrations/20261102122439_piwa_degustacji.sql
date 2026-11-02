-- lista piw degustacji po kolei (TV i telefony na podsumowaniu; piwa są jawne, bez rozwiązań do ukrycia)
create or replace function public.piwa_degustacji(p_kod text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_s public.sesje;
begin
  v_s := wewn.sesja_po_kodzie(p_kod);
  if v_s.id is null then
    raise exception 'Nie ma gry o kodzie %', upper(trim(p_kod));
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', z.id, 'nr', z.nr, 'tresc', z.tresc, 'grafika_url', z.grafika_url,
                                        'dane', z.dane) order by z.nr)
      from public.zadania z
     where z.quiz_id = v_s.quiz_id and z.typ = 'piwo'
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.piwa_degustacji(text) to anon, authenticated;
