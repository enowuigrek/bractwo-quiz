-- Pytanie o pintę z grafiką szklanki (24.10, prośba Łukasza)
update public.zadania
   set grafika_url = '/grafiki/pytania/pinta.webp'
 where tresc = 'Ile mililitrów ma pinta brytyjska?';
