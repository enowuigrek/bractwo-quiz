-- Stały adres ekranu lokalu: /ekran/<adres_ekranu>. Lokal zapisuje go raz w zakładkach na TV.
-- Powstaje z nazwy przy dodawaniu lokalu (panel) i nie zmienia się przy zmianie nazwy.

alter table public.lokale add column adres_ekranu text;

-- istniejące lokale: adres z nazwy (bez polskich znaków, myślniki zamiast spacji)
update public.lokale
   set adres_ekranu = trim(both '-' from regexp_replace(
         lower(translate(nazwa, 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ')),
         '[^a-z0-9]+', '-', 'g'))
 where adres_ekranu is null;

alter table public.lokale
  alter column adres_ekranu set not null,
  add constraint lokale_adres_ekranu_format check (adres_ekranu ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(adres_ekranu) <= 60),
  add constraint lokale_adres_ekranu_unikalny unique (adres_ekranu);
