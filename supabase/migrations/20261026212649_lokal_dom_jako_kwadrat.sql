-- Lokal „Dom” to teraz „Kwadrat”, domowy browar Łukasza (browarkwadrat.pl), z logo kwadratu w kole (26.10).
-- Adres ekranu zostaje `dom` (/ekran/dom, /admin/dom), żeby zapisane zakładki dalej działały.
update public.lokale
   set nazwa = 'Kwadrat', logo_url = '/loga/kwadrat.svg'
 where id = 'aa7bd0c5-c5ce-4b00-ba37-8c4e90414504' and nazwa = 'Dom';
