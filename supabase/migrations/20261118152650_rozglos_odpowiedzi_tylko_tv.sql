-- Odpowiedzi i okrzyki graczy idą na osobny temat `sesja:KOD:tv`, którego słuchają tylko TV i pilot
-- (useNasluch w src/lib/gra/nasluch.ts). Telefony przy 50+ graczach nie dostają już każdej odpowiedzi innych (18.11, JOWES).
create or replace function wewn.rozglos(p_kod text, p_zdarzenie text, p_dane jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    p_dane,
    p_zdarzenie,
    case when p_zdarzenie in ('odpowiedz', 'okrzyk') then 'sesja:' || p_kod || ':tv' else 'sesja:' || p_kod end,
    false
  );
end;
$$;
