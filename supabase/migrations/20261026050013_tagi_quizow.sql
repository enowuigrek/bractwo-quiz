-- Tematyczne oznaczenia quizów (26.10): do filtrowania listy w panelu i wyboru quizu przy uruchamianiu gry,
-- np. {filmy, lata 90.}. Małe litery, bez powtórzeń (pilnuje panel, src/lib/tagi.ts).
alter table public.quizy add column if not exists tagi text[] not null default '{}';
