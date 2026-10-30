-- Widoczność quizu (30.10, Łukasz): prywatny (widzi go autor i twórca) albo udostępniony (grają nim wszyscy, którzy
-- mają dostęp do jego miejsca: quiz Bractwa Bractwo i lokale, quiz lokalu ten lokal i Bractwo). Nowy quiz jest
-- prywatny, udostępnia się go okiem na liście. Zastępuje `quizy.tylko_glowny` („tylko Bractwo”), które zostaje
-- w bazie nieużywane przy quizach (przy grach `sesje.tylko_glowny` dalej znaczy „gra Bractwa”).
alter table public.quizy add column udostepniony boolean not null default false;
update public.quizy set udostepniony = true where tylko_glowny = false;
