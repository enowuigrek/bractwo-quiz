import type { Metadata } from "next";
import Link from "next/link";
import { LogoQuiz } from "@/components/logo-quiz";

export const metadata: Metadata = {
  title: "Jak to działa · Bractwo Quiz",
  description: "Jak działa Quiz Bractwa Piwnego: ekrany, przebieg wieczoru, punktacja i co robić, gdy coś pójdzie nie tak.",
};

/**
 * Opis całej aplikacji dla prowadzących i obsługi lokali: co jest czym, jak wygląda wieczór z quizem
 * i jakie zasady stoją za grą. Bez szczegółów technicznych (te są w docs/PLAN.md).
 */
export default function JakToDziala() {
  return (
    <main className="kolumna opis">
      <p className="okruchy-gra">
        <Link href="/">← Strona główna</Link>
      </p>
      <LogoQuiz wysokosc={64} />
      <h1>Jak to działa</h1>
      <p className="opis-wstep">
        Quiz Bractwa Piwnego to quiz na żywo w lokalu. Telewizor pokazuje pytania i wyniki, goście odpowiadają na swoich
        telefonach, a prowadzący steruje wszystkim z telefonu albo laptopa. Nikt nie instaluje aplikacji: wystarczy
        przeglądarka i kod QR.
      </p>

      <nav className="opis-spis" aria-label="Spis treści">
        <a href="#ekrany">Cztery ekrany</a>
        <a href="#wieczor">Wieczór krok po kroku</a>
        <a href="#punkty">Punkty</a>
        <a href="#pytania">Rodzaje pytań</a>
        <a href="#nagrody">Nagrody</a>
        <a href="#zasady">Uczciwość</a>
        <a href="#awarie">Gdy coś pójdzie nie tak</a>
        <a href="#test">Co sprawdzić w teście</a>
      </nav>

      <section id="ekrany">
        <h2>Cztery ekrany</h2>
        <dl className="opis-role">
          <div>
            <dt>Panel obsługi</dt>
            <dd>
              Zaplecze, na hasło. Tu powstają quizy z pytaniami, tu są lokale z logami, tu uruchamia się rozgrywki i
              ogląda historię: kto ile zdobył, co odpowiadał i kto odebrał nagrodę. Logowanie trzyma 30 dni.
            </dd>
          </div>
          <div>
            <dt>Ekran lokalu (telewizor)</dt>
            <dd>
              Każdy lokal ma swój stały adres, np. <code>/ekran/ppr</code> (lista jest na stronie głównej). Otwiera się
              go raz na telewizorze i zostawia. Bez quizu ekran pokazuje plansze z logami i instrukcją. Gdy w lokalu
              ruszy gra, przełącza się sam, a po grze wraca do plansz i jeszcze przez kilka godzin pokazuje zwycięzców.
              Logo Bractwa jest zawsze w rogu, a u góry logo lokalu i ewentualnie gościnnego browaru.
            </dd>
          </div>
          <div>
            <dt>Pilot prowadzącego</dt>
            <dd>
              Telefon albo laptop osoby, która prowadzi quiz. Pilot widzi poprawne odpowiedzi od razu, przełącza
              kolejne etapy i zarządza graczami. Wchodzi się do niego z panelu („Prowadź z tego urządzenia”) albo przez
              kod QR pilota, jeśli grę prowadzi ktoś inny. Link pilota ma tajny klucz, więc nie pokazujemy go graczom.
            </dd>
          </div>
          <div>
            <dt>Telefon gracza</dt>
            <dd>
              Gracz skanuje QR z telewizora (albo wpisuje w przeglądarce adres widoczny pod kodem), podaje imię albo nick i może dodać
              selfie, które pokaże się przy nicku na TV. Odpowiada na telefonie, a po każdym pytaniu widzi, czy
              trafił, ile zdobył i które ma miejsce.
            </dd>
          </div>
        </dl>
      </section>

      <section id="wieczor">
        <h2>Wieczór krok po kroku</h2>
        <ol className="opis-kroki">
          <li>
            <strong>Przed wieczorem.</strong> W panelu przygotuj quiz (Quizy → nowy quiz → pytania). Sprawdź, czy
            lokal ma logo i czy na telewizorze jest otwarty jego ekran.
          </li>
          <li>
            <strong>Start.</strong> W panelu kliknij „▶ Uruchom quiz”: miasto, lokal, quiz, czas na odpowiedź (10, 20,
            30, 45 s albo bez limitu), bonus za szybkość, opcjonalnie okazja (np. „Dzień Porteru”), nagrody i gościnny
            browar. Potem „Prowadź z tego urządzenia”.
          </li>
          <li>
            <strong>Poczekalnia.</strong> Telewizor pokazuje duży kod QR i listę graczy, którzy dołączyli. Gdy wszyscy
            są, prowadzący daje „Start quizu”.
          </li>
          <li>
            <strong>Pytanie.</strong> Najpierw 3 sekundy odliczania, potem pytanie jednocześnie na TV i telefonach.
            Wynik pokazuje się sam, gdy minie czas albo gdy odpowiedzą wszyscy. Przy pytaniu bez limitu prowadzący
            kończy je ręcznie.
          </li>
          <li>
            <strong>Po pytaniu.</strong> Prowadzący decyduje, co dalej: „Pokaż odpowiedzi graczy” (kto jak odpowiedział
            i w jakim czasie), „Pokaż ranking” (kto awansował) albo od razu następne pytanie.
          </li>
          <li>
            <strong>Finał.</strong> Po ostatnim pytaniu podium: 3., 2., a na końcu zwycięzca z konfetti. Telefony
            pierwszej trójki dostają medal w tym samym momencie. Obok jest pełna tabela wyników.
          </li>
          <li>
            <strong>Koniec.</strong> „Zakończ grę”, potem na pilocie „Pokaż plansze na ekranie lokalu” (albo ekran wróci
            do plansz sam po 10 minutach). Wyniki zostają w panelu w Rozgrywkach.
          </li>
        </ol>
      </section>

      <section id="punkty">
        <h2>Punkty</h2>
        <ul>
          <li>
            Pytanie jest warte 1000 punktów. Z bonusem za szybkość: od 1000 za natychmiastową odpowiedź do 500 na
            koniec czasu. Bez limitu czasu zawsze 1000.
          </li>
          <li>Zła odpowiedź albo brak odpowiedzi to 0 punktów.</li>
          <li>
            W pytaniach z kilkoma odpowiedziami, kolejnością i parami liczy się część: np. 3 z 4 par na swoim miejscu
            daje 3/4 punktów pytania.
          </li>
          <li>Remis dzieli miejsce: dwie osoby z tą samą liczbą punktów są obie np. na 1. miejscu.</li>
        </ul>
      </section>

      <section id="pytania">
        <h2>Rodzaje pytań</h2>
        <dl className="opis-role">
          <div>
            <dt>Jedna odpowiedź</dt>
            <dd>Klasyka: A, B, C albo D. Jedno stuknięcie i gotowe.</dd>
          </div>
          <div>
            <dt>Kilka odpowiedzi</dt>
            <dd>
              Zaznacz wszystkie poprawne i zatwierdź. Każda błędnie zaznaczona odejmuje tyle, ile daje trafiona, więc
              zaznaczenie wszystkiego nic nie da.
            </dd>
          </div>
          <div>
            <dt>Kolejność</dt>
            <dd>Stukasz elementy po kolei, a każdy dostaje numer. „Cofnij” zdejmuje ostatni.</dd>
          </div>
          <div>
            <dt>Pary</dt>
            <dd>
              Stuknij coś po lewej, potem jego parę po prawej. Połączone pary mają wspólny kolor, a ponowne stuknięcie
              je rozłącza.
            </dd>
          </div>
        </dl>
        <p>Do każdego pytania można dodać grafikę, która pokaże się na TV i telefonach.</p>
      </section>

      <section id="nagrody">
        <h2>Nagrody</h2>
        <p>
          Przy uruchamianiu gry można ustawić nagrodę za 1. miejsce albo za całe podium, każdą z własną instrukcją (np.
          „Pokaż ten ekran przy barze”). Nagroda widnieje na podium na TV, a zwycięzca dostaje na telefonie kartę z
          nickiem, kodem gry i tykającym zegarem, więc zrzut ekranu łatwo odróżnić.
        </p>
        <p>
          Po wydaniu nagrody gracz (albo osoba, która ją wydaje) klika na karcie „Potwierdź odbiór”. Karta zmienia się
          w „Odebrana o …” i nie da się jej pokazać drugi raz. Gdyby z telefonu się nie udało, odbiór można oznaczyć
          albo cofnąć w panelu przy grze.
        </p>
      </section>

      <section id="zasady">
        <h2>Uczciwość</h2>
        <ul>
          <li>Czas i punkty liczy serwer, nie telefon. Szybszy telefon ani przestawiony zegar nic nie dają.</li>
          <li>
            Poprawna odpowiedź nie trafia na telefony graczy, zanim nie skończy się pytanie, więc podglądanie kodu
            strony nic nie daje.
          </li>
          <li>Każdy odpowiada raz. Odpowiedź po czasie nie jest przyjmowana.</li>
          <li>
            Imiona i nicki w grze nie mogą się powtarzać. Gdy ktoś wpisze zajęte, dostanie prośbę o dopisanie czegoś
            od siebie, np. pierwszej litery nazwiska.
          </li>
          <li>Selfie graczy znikają same po 7 dniach. Prowadzący może zdjąć nieodpowiednie zdjęcie z pilota.</li>
        </ul>
      </section>

      <section id="awarie">
        <h2>Gdy coś pójdzie nie tak</h2>
        <dl className="opis-role">
          <div>
            <dt>Gracz zamknął stronę albo odświeżył telefon</dt>
            <dd>Wystarczy, że wejdzie jeszcze raz w ten sam link. Telefon pamięta gracza i wraca z punktami.</dd>
          </div>
          <div>
            <dt>Gracz zmienia telefon (padła bateria)</dt>
            <dd>Na pilocie: Gracze → „QR” przy jego nicku. Gracz skanuje kod nowym telefonem i gra dalej jako on.</dd>
          </div>
          <div>
            <dt>Ktoś wyszedł albo nie gra</dt>
            <dd>
              Na pilocie: Gracze → „✕”. Gracz znika z rankingu, a jeśli trwa pytanie i reszta już odpowiedziała, wynik
              pokaże się od razu.
            </dd>
          </div>
          <div>
            <dt>Telewizor się odświeżył albo zgubił internet</dt>
            <dd>
              Ekran wraca sam do tego, co właśnie trwa. Wszystko jest zapisane na serwerze, a ekrany co kilka sekund
              sprawdzają stan gry.
            </dd>
          </div>
          <div>
            <dt>Prowadzący zamknął pilota</dt>
            <dd>Otwórz grę w panelu (Rozgrywki) i jeszcze raz „Prowadź z tego urządzenia”.</dd>
          </div>
          <div>
            <dt>Ktoś wpisał nieodpowiedni nick</dt>
            <dd>Usuń gracza z pilota. Może dołączyć jeszcze raz pod innym nickiem.</dd>
          </div>
        </dl>
      </section>

      <section id="test">
        <h2>Co sprawdzić w teście</h2>
        <ol className="opis-kroki">
          <li>Otwórz ekran lokalu na telewizorze albo laptopie i zobacz plansze.</li>
          <li>Uruchom w panelu „Claude · testowy quiz piwny” z nagrodami i czasem 20 s.</li>
          <li>Dołącz 2–3 telefonami (jeden z selfie, jeden z zajętym nickiem, żeby zobaczyć komunikat).</li>
          <li>Przejdź pytania, w tym 11–14: kilka odpowiedzi, kolejność i pary. Zobacz wynik częściowy na telefonie.</li>
          <li>W trakcie: odśwież telefon gracza, pokaż QR powrotu i przejdź na innym telefonie, usuń jednego gracza.</li>
          <li>Na końcu: podium, karta nagrody, „Potwierdź odbiór”, a potem sekcja „Nagrody” w panelu.</li>
          <li>„Pokaż plansze na ekranie lokalu” i plansza ze zwycięzcami.</li>
          <li>Zapisz, co było niejasne albo brzydkie. Wszystko da się poprawić.</li>
        </ol>
      </section>

      <p className="autor">
        <span className="autor-etykieta">Aplikacja</span>
        <a href="https://lukasznowak.dev" target="_blank" rel="noopener">
          lukasznowak.dev
        </a>
      </p>
    </main>
  );
}
