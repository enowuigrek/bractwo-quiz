# JOWES na własnym Vercelu i Supabase

Cel (25.11): JOWES ma osobne wdrożenie pod swoją domeną i osobną bazę. Zbyszko łączy swoją bazę jako MCP i tworzy quizy
ze swoim Claude Code zamiast wyklikiwać je w panelu. Kod zostaje jeden (to repo), a wdrożenie JOWES dostaje nowości
tylko wtedy, gdy JOWES ich chce.

## Jak JOWES dostaje nowości (na życzenie)

Projekt JOWES na Vercelu wdraża gałąź `jowes`, a nie `main`. Zmiany idą na `main` (Bractwo) jak dotąd, a JOWES stoi na
swojej wersji. Gdy JOWES chce nowości, Łukasz przesuwa gałąź:

```bash
git push origin main:jowes
```

Poprawka tylko dla JOWES (np. pilna przed eventem) to commit na `jowes`, który potem trafia też do `main`.

## Przed spotkaniem (Łukasz sam)

- [x] Marka całego wdrożenia ze zmiennej `MARKA` (`jowes`): adres nie ma znaczenia, lista `HOSTY_NEUTRALNE` niepotrzebna.
- [x] Dane w bazie rozdzielone markami (`marka` w lokalach, quizach, grach i kontach): eksport JOWES to „wszystko z `marka = 'jowes'`”.
- [x] Posprzątać JOWES przed eksportem (25.11): usunięte 24 gry testowe (wszystko poza DABQ i MLGJ) i klasyczny quiz
      z kosza („Jak dobrze znasz JOWES i siebie nawzajem?”). Zostały: lokal JOWES, „Quiz JOWES”, gry DABQ i MLGJ.
- [x] Skrypty eksportu i importu (25.11, `scripts/jowes/`): eksport bierze wszystko z `marka = 'jowes'` (lokal, konto
      z rolą, „Quiz JOWES” z etapami i 45 pytaniami, gry DABQ i MLGJ: 41 graczy, 843 odpowiedzi, okrzyki) i 10 plików
      z bucketu (zdjęcia graczy). Import podmienia adresy plików na nową bazę i wstawia wiersze z tymi samymi id.
      Sprawdzone: eksport i plan importu; sam zapis do nowej bazy sprawdzimy dopiero na niej.
      ```bash
      node --env-file=.env.local scripts/jowes/eksport.mjs ../jowes-eksport
      node scripts/jowes/import.mjs ../jowes-eksport --na-sucho
      ```
      Katalog z eksportem musi być poza repo (nicki, zdjęcia, skróty haseł); skrypt odmawia zapisu w repo.
- [ ] Zrzut samego schematu bazy Bractwa (tabele, funkcje, wyzwalacze, uprawnienia, bucket), bez danych i bez treści quizów
      Bractwa. Potrzebne hasło bazy z panelu Supabase (Connect → connection string), potem:
      `pg_dump --schema-only --no-owner --schema=public --schema=wewn "<connection string>" > schemat.sql`
      (plus ustawienia bucketu i Realtime, Claude dopisze po zrzucie).
- [ ] Gałąź `jowes` z obecnego `main`.

## Na spotkaniu (z Zbyszkiem)

1. **Konta**: na czyj mail (osobisty Zbyszka czy firmowy JOWES) zakładamy Vercel, Supabase i ewentualnie GitHub.
   - Vercel wdraża z GitHuba: projekt na koncie JOWES musi mieć dostęp do tego repo (Zbyszko jako współpracownik repo
     albo osobny fork na koncie JOWES). Prościej: projekt w zespole Łukasza na Vercelu, a JOWES daje tylko domenę.
     Do decyzji razem.
2. **Supabase**: nowy projekt, region Frankfurt (`eu-central-1`, jak baza Bractwa i Vercel `fra1`). Zapisać: adres
   projektu, klucz publiczny, klucz sekretny, hasło bazy (do menedżera haseł, nie do czatu).
3. **Schemat**: wgrać `schemat.sql`, sprawdzić bucket na grafiki i Realtime (Broadcast).
4. **Dane**: świeży eksport (jeśli od ostatniego coś się zmieniło), potem import do nowej bazy: najpierw na sucho
   (sprawdza połączenie, tabele i bucket), potem naprawdę. Adres i klucz nowej bazy tylko w poleceniu:
   ```bash
   CEL_SUPABASE_URL=https://<nowy>.supabase.co CEL_SUPABASE_SECRET_KEY=<klucz> node scripts/jowes/import.mjs ../jowes-eksport --na-sucho
   CEL_SUPABASE_URL=https://<nowy>.supabase.co CEL_SUPABASE_SECRET_KEY=<klucz> node scripts/jowes/import.mjs ../jowes-eksport
   ```
   Potem sprawdzić w panelu nowego wdrożenia: lokal JOWES, Quiz JOWES, gry DABQ i MLGJ z wynikami i zdjęciami.
   Logo JOWES to plik z repo (`public/loga/jowes/`), nie z bucketu, więc przychodzi z kodem.
5. **Vercel**: nowy projekt z tego repo, gałąź produkcyjna `jowes`, region `fra1`. Zmienne:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`: z nowej bazy,
   - `ADMIN_SEKRET`, `CRON_SECRET`, `ADMIN_HASLO_GLOWNE`: nowe, inne niż w Bractwie,
   - `NEXT_PUBLIC_SITE_URL`: domena JOWES,
   - `MARKA=jowes`,
   - bez `OPENAI_API_KEY` i `HOSTY_NEUTRALNE`.
   Cron `/api/keepalive` przychodzi z `vercel.json` (bez niego darmowa baza usypia, a Realtime nie ma partycji).
6. **DNS**: w Vercelu dodać domenę (np. `quiz.jowes.pl`), u dostawcy domeny JOWES rekord CNAME na `cname.vercel-dns.com`
   (albo A na `76.76.21.21` dla domeny głównej). Certyfikat wystawia Vercel.
7. **Konta panelu w nowej bazie**: Zbyszko (z importu, to samo hasło) i Łukasz jako twórca (nowe konto, hasło z linku).
8. **Test na żywo**: logowanie, gra z botami, TV pod domeną JOWES, telefon z kodu QR, koniec gry. Potem usunąć grę testową.
9. **Zbyszko i Claude Code**: MCP Supabase w jego Claude Code, tylko do projektu JOWES. Do tego plik z instrukcją
   tworzenia quizu (tabele `quizy`, `etapy`, `zadania`, format `dane` każdego rodzaju pytania, zasady układania pytań)
   i, bezpieczniej niż wolny dostęp do tabel, funkcja w bazie do wstawiania całego quizu, która sprawdza dane.
   Przygotuje Claude przed spotkaniem albo na nim, gdy wiadomo, jak Zbyszko się łączy.

## Po przeniesieniu

- [ ] Usunąć dane JOWES z bazy Bractwa (gry, quiz, lokal, konto zbyszko@jowes.pl). MCP nie usuwa: panel albo skrypt.
- [ ] Wyczyścić `HOSTY_NEUTRALNE` na Vercelu Bractwa; stary adres JOWES na Vercelu przekierować na nową domenę.
- [ ] Kod marki (`src/lib/marka.ts`, `src/lib/marki/jowes.ts`) zostaje: z niego żyje wdrożenie JOWES.
