-- Cofnięcie: zdjęcie tripla się nie wygenerowało (25.10: brak środków na koncie OpenAI), pytanie zostaje bez grafiki
update public.zadania
   set grafika_url = null
 where grafika_url = '/grafiki/pytania/tripel.webp';
