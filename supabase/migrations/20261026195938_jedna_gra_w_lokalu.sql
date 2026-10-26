-- Jeden lokal = jeden ekran: najwyżej jedna niezakończona gra w lokalu (26.10).
create unique index sesje_jedna_w_lokalu on public.sesje (lokal_id) where lokal_id is not null and faza <> 'koniec';
