-- Ranking po pytaniu to domyślnie wyścig po piwo. Nowy kod i tak go nie czyta (wyścig zawsze, tabela przy
-- ponad 12 graczach), ale ekran TV otwarty przed wdrożeniem działa na starym kodzie i brał stąd „tabelę”.
alter table public.sesje alter column widok_rankingu set default 'wyscig';

update public.sesje
   set widok_rankingu = 'wyscig'
 where widok_rankingu = 'tabela'
   and faza <> 'koniec';
