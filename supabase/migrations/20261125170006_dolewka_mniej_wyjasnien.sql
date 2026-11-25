-- „Piwny quiz Bractwa Piwnego 2” (wcześniej „…: dolewka”, nazwa zmieniona w panelu): bez wyjaśnień po pytaniach, które
-- tylko powtarzały odpowiedź (Łukasz, 25.11). Zostają te, które coś tłumaczą: wady piwa i pochodzenie chmieli.
update public.zadania z set dane = z.dane - 'wyjasnienie'
  from public.quizy q
 where q.id = z.quiz_id and q.tytul = 'Piwny quiz Bractwa Piwnego 2' and q.usunieto is null
   and z.dane ? 'wyjasnienie'
   and z.tresc not in ('Które z tych związków w piwie uchodzą za wadę?', 'Które z tych odmian chmielu wyhodowano w USA?');
