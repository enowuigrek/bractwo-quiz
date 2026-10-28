import type { Metadata } from "next";
import Link from "next/link";
import { wymagajAdmina } from "@/lib/admin";
import { SZABLONY_ETAPOW, SZABLONY_QUIZU, bezPunktow, napisMnoznika, type SzablonEtapu } from "@/lib/etapy";
import { MAX_PRZEWAGI, META_FINALU, PUNKTOW_NA_KROK } from "@/lib/gra/final";
import { oknoMs, przedzial } from "@/lib/gra/punktacja";
import { CIEKAWOSTKA_PIJANA, CZAS_PIJANEGO_S } from "@/lib/pijany";
import { NAZWY_TYPOW } from "@/lib/zadania";
import { IkonaPuchar } from "@/components/ikony";
import { IkonaEtapu } from "@/components/ikony-etapow";
import { RODZAJE, TabelaCzesciowych, WykresSzybkosci, pkt } from "./wspolne";

export const metadata: Metadata = { title: "Zasady wyścigu po piwo · Bractwo Quiz" };


type EtapWyscigu = SzablonEtapu & { pytania: number };

/** Zasady konkurencji poza tym, co wynika z rodzaju pytań (`RODZAJE`). */
const DODATKI: Record<string, string[]> = {
  "jakos-sie-ulozy": ["Po tym etapie trójka z najwyższymi punktami wchodzi do finału (remis: krótszy łączny czas odpowiedzi)."],
};

/**
 * Ilu gra w kolejnych etapach przy `n` graczach (jak `wewn.progi_domyslne`): po etapie walka-2 80%, po walka-1 połowa,
 * przed finałem trójka; cięcie tylko, gdy zostaje więcej niż 3. `etapow` z finałem na końcu.
 */
function grajacyWEtapach(n: number, etapow: number): number[] {
  const walka = etapow - 1;
  const progi: Record<number, number> = {};
  let teraz = n;
  for (const [po, czesc] of [
    [walka - 2, 0.8],
    [walka - 1, 0.5],
  ] as const) {
    if (po < 2) continue;
    const zostaje = Math.ceil(teraz * czesc);
    if (zostaje < teraz && zostaje > 3) {
      progi[po] = zostaje;
      teraz = zostaje;
    }
  }
  const wynik: number[] = [];
  let graja = n;
  for (let nr = 1; nr <= etapow; nr++) {
    wynik.push(graja);
    if (progi[nr]) graja = progi[nr];
    if (nr === walka) graja = Math.min(graja, 3);
  }
  return wynik;
}

/**
 * Zasady „Wyścigu po piwo” w jednym miejscu (28.10, Łukasz): etapy, punktacja z przedziałami, odpadanie, finał
 * i pijany finał. Liczby liczą się z tych samych stałych co gra (szablony etapów, `punktacja.ts`, `final.ts`),
 * więc zmiana zasad w kodzie zmienia też tę stronę; punkty w grze liczy baza.
 */
export default async function ZasadyWyscigu() {
  await wymagajAdmina();
  const szablon = SZABLONY_QUIZU.find((s) => s.klucz === "wyscig")!;
  const etapy: EtapWyscigu[] = szablon.etapy.map((e) => ({
    ...SZABLONY_ETAPOW.find((s) => s.klucz === e.szablon)!,
    pytania: e.pytania,
  }));
  const punktowane = etapy.filter((e) => !bezPunktow(e));
  const final = etapy.find((e) => bezPunktow(e));
  // odpadanie po etapach (jak `wewn.progi_domyslne`, 28.10): 3 etapy przed finałem 80%, 2 przed finałem połowa
  const iFinalu = etapy.findIndex((e) => bezPunktow(e));
  const odpadanie: Record<number, string> = {
    [iFinalu - 3]: "Odpadanie: po tym etapie gra dalej 80% graczy (zaokrąglone w górę).",
    [iFinalu - 2]: "Odpadanie: po tym etapie gra dalej połowa (zaokrąglone w górę).",
  };
  // za cały etap przy samych dobrych odpowiedziach: najwolniej i najszybciej
  const sumy = punktowane.map((e) => {
    const [od, do_] = przedzial(e.typy[0], 1, e.mnoznik);
    return { e, od: od * e.pytania, do_: do_ * e.pytania };
  });
  const razemOd = sumy.reduce((s, x) => s + x.od, 0);
  const razemDo = sumy.reduce((s, x) => s + x.do_, 0);

  return (
    <main className="zasady">
      <p className="okruchy">
        <Link href="/admin/quizy">← Quizy</Link>
      </p>
      <h1>Wyścig po piwo: zasady i punktacja</h1>
      <p className="zasady-wstep">
        Wszystko o tym, jak gra się w „Wyścig po piwo”: konkurencje po kolei, ile punktów można zdobyć, kto odpada i jak
        trójka ściga się w finale do piwa. Liczby na tej stronie liczą się z tych samych ustawień co gra.
      </p>

      <section className="panel-sekcja">
        <h2>Przebieg gry</h2>
        <ol className="zasady-droga">
          <li>
            <span className="zasady-droga-nr">0</span>
            <strong>Poczekalnia</strong>
            <span>QR na TV, gracze dołączają</span>
          </li>
          {etapy.map((e, i) => (
            <li key={e.klucz} className={bezPunktow(e) ? "final" : undefined}>
              {e.ikona ? (
                <IkonaEtapu ikona={e.ikona} className="zasady-droga-ikona" />
              ) : (
                <span className="zasady-droga-nr">{i + 1}</span>
              )}
              <strong>{e.nazwa}</strong>
              <span>
                {bezPunktow(e) ? "finał trójki, wyścig" : `${e.pytania} pytań · ${napisMnoznika(e.mnoznik)}`}
              </span>
            </li>
          ))}
          <li className="pijany">
            <span className="zasady-droga-nr">?</span>
            <strong>Pijany finał</strong>
            <span>opcjonalny, nic nie liczy</span>
          </li>
          <li>
            <span className="zasady-droga-nr">
              <IkonaPuchar />
            </span>
            <strong>Podium</strong>
            <span>nagrody dla trójki</span>
          </li>
        </ol>
        <p className="pomocniczy">
          Przed każdym etapem TV pokazuje planszę z zasadami, a gracze klikają „Gotowy”. Między pytaniami mogą stać
          ciekawostki: plansza z grafiką i krótkim tekstem, bez punktów.
        </p>
      </section>

      <section className="panel-sekcja">
        <h2>Jak liczymy punkty</h2>
        <div className="zasady-dwa">
          <div>
            <p>
              Każda odpowiedź dostaje <strong>ocenę od 0 do 1</strong> (jaka część jest dobrze), a punkty to ocena ×
              punkty za szybkość × <strong>mnożnik etapu</strong>.
            </p>
            <ul className="zasady-punkty">
              <li>
                <strong>Szybkość:</strong> od razu 1000 pkt, potem liniowo w dół do 200 pkt. Okno spadku to{" "}
                {oknoMs("wybor") / 1000} s przy jednej odpowiedzi i szacowaniu, {oknoMs("pary") / 1000} s przy kilku
                dobrych, parach i kolejności. Później zostaje stałe 200 pkt.
              </li>
              <li>
                <strong>Z limitem czasu</strong> (ustawionym przy grze albo etapie) punkty spadają przez cały limit, a
                po nim nie da się już odpowiedzieć.
              </li>
              <li>
                <strong>Szacowanie</strong> jest wyjątkiem: szybkość waży tylko 10%, liczy się precyzja.
              </li>
              <li>
                <strong>Mnożnik</strong> rośnie z etapami, więc późniejsze pytania ważą więcej.
              </li>
            </ul>
          </div>
          <WykresSzybkosci />
        </div>
      </section>

      <section className="panel-sekcja">
        <h2>Konkurencje</h2>
        <div className="zasady-etapy">
          {punktowane.map((e, i) => {
            const typy = e.typy;
            const [od, do_] = przedzial(typy[0], 1, e.mnoznik);
            return (
              <article key={e.klucz} className="zasady-etap">
                <header>
                  {e.ikona && <IkonaEtapu ikona={e.ikona} className="zasady-etap-ikona" />}
                  <div>
                    <p className="zasady-etap-nr">Etap {i + 1}</p>
                    <h3>{e.nazwa}</h3>
                    <p className="zasady-znaczki">
                      {typy.map((t) => (
                        <span key={t} className={`rodzaj-pytania ${t}`}>
                          {NAZWY_TYPOW[t]}
                        </span>
                      ))}
                      <span className="znaczek aktywny">punkty {napisMnoznika(e.mnoznik)}</span>
                      <span className="znaczek">{e.pytania} pytań</span>
                    </p>
                  </div>
                </header>
                <p className="zasady-opis">„{e.opis}”</p>
                <ul className="zasady-lista">
                  {typy.flatMap((t) =>
                    t === "ciekawostka"
                      ? []
                      : RODZAJE[t].zasady.map((z) => (
                          <li key={t + z}>{typy.length > 1 ? `${NAZWY_TYPOW[t]}: ${z}` : z}</li>
                        )),
                  )}
                  {(DODATKI[e.klucz] ?? []).map((z) => (
                    <li key={z}>{z}</li>
                  ))}
                  {odpadanie[i] && (
                    <li>
                      <strong>{odpadanie[i]}</strong>
                    </li>
                  )}
                </ul>
                <table className="zasady-tabela">
                  <thead>
                    <tr>
                      <th>Dobra odpowiedź</th>
                      <th>najwolniej</th>
                      <th>najszybciej</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>za jedno pytanie</td>
                      <td>{pkt(od)}</td>
                      <td className="zloto">{pkt(do_)}</td>
                    </tr>
                    <tr>
                      <td>za cały etap ({e.pytania} pytań)</td>
                      <td>{pkt(od * e.pytania)}</td>
                      <td className="zloto">{pkt(do_ * e.pytania)}</td>
                    </tr>
                  </tbody>
                </table>
                {typy.map((t) =>
                  t === "ciekawostka" ? null : (
                    <TabelaCzesciowych key={t} typ={t} mnoznik={e.mnoznik} zNazwa={typy.length > 1} />
                  ),
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel-sekcja">
        <h2>Razem przed finałem</h2>
        <p>
          Same dobre odpowiedzi dają od <strong>{pkt(razemOd)}</strong> pkt (wszystkie na ostatnią chwilę) do{" "}
          <strong className="zloto">{pkt(razemDo)}</strong> pkt (wszystkie od razu). W praktyce zwycięzcy etapów mają
          zwykle 20–35 tys.
        </p>
        <div className="zasady-pasek" aria-label="Udział etapów w najwyższym wyniku">
          {sumy.map(({ e, do_ }) => (
            <div key={e.klucz} style={{ flexGrow: do_ }} className={`zasady-pasek-${e.typy[0]}`}>
              <strong>{e.nazwa}</strong>
              <span>do {pkt(do_)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-sekcja">
        <h2>Odpadanie i finałowa trójka</h2>
        <ul className="zasady-lista">
          <li>
            Po etapie „{etapy[0]?.nazwa}” <strong>nikt nie odpada</strong> (rozgrzewka, ktoś może jeszcze dołączać).
          </li>
          <li>
            Po etapie „{etapy[1]?.nazwa}” gra dalej <strong>80%</strong> graczy, a po „{etapy[2]?.nazwa}”{" "}
            <strong>połowa</strong> (zaokrąglone w górę).
          </li>
          <li>Cięcie jest tylko wtedy, gdy po nim zostaje więcej niż 3 osoby; przy małej grze nikt nie odpada.</li>
          <li>Progi ustalają się przy starcie gry z liczby graczy; prowadzący może je zmienić w pilocie.</li>
          <li>
            Po ostatnim etapie przed finałem <strong>trójka z najwyższymi punktami</strong> wchodzi do finału. Remis
            rozstrzyga krótszy łączny czas odpowiedzi. Reszta kibicuje na telefonach.
          </li>
        </ul>
        <table className="zasady-tabela zasady-odpadanie">
          <thead>
            <tr>
              <th>Graczy</th>
              {etapy.map((e, i) => (
                <th key={e.klucz}>
                  {i + 1}. {e.nazwa}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[5, 8, 12, 17, 20].map((n) => (
              <tr key={n}>
                <td>{n}</td>
                {grajacyWEtapach(n, etapy.length).map((g, i) => (
                  <td key={i}>{g}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="pomocniczy">W kolumnach: ilu gra w danym etapie.</p>
      </section>

      {final && (
        <section className="panel-sekcja">
          <h2>Finał: „{final.nazwa}”</h2>
          <div className="zasady-dwa">
            <ul className="zasady-lista">
              <li>
                <strong>Punktów już nie liczymy.</strong> Liczy się tylko wyścig do piwa, które stoi{" "}
                <strong>{META_FINALU} kroków</strong> od startu.
              </li>
              <li>
                <strong>Start:</strong> 1 krok przewagi za każde pełne {pkt(PUNKTOW_NA_KROK)} pkt przewagi nad
                najsłabszym finalistą, najwyżej {MAX_PRZEWAGI} kroki. Np. 31 000, 29 000 i 24 000 pkt to 2, 1 i 0 kroków;
                30 000 i 29 500 to remis.
              </li>
              <li>
                <strong>Pytania:</strong> zdania prawda/fałsz, każdy we własnym tempie i w swojej losowej kolejności.
                Dobra odpowiedź to krok naprzód, zła krok w tył (za linię startu się nie cofa).
              </li>
              <li>
                <strong>Do wygranej</strong> trzeba od {META_FINALU - MAX_PRZEWAGI} do {META_FINALU} dobrych odpowiedzi
                (zależnie od przewagi); każda zła dokłada dwie.
              </li>
              <li>
                <strong>Koniec:</strong> gdy ktoś dobiegnie do piwa albo po {final.czas_s ?? 120} s (wtedy wygrywa ten,
                kto jest najdalej). Kto odpowie na całą pulę, czeka na resztę.
              </li>
              <li>
                <strong>Podium</strong> ustawia wyścig. Przy finalistach nie pokazujemy punktów, miejsce mówi stopień;
                dalsze miejsca według punktów z etapów.
              </li>
            </ul>
            <TorFinalu />
          </div>
        </section>
      )}

      <section className="panel-sekcja">
        <h2>Pijany finał (opcjonalny)</h2>
        <ul className="zasady-lista">
          <li>
            Włącza się go w kreatorze gry. Gracze o nim nie wiedzą: telefon udaje dalszą serię finału, TV dalej pokazuje
            wyścig, tylko wszystko zaczyna się psuć. Nazwę trybu widzą tylko panel i pilot.
          </li>
          <li>
            <strong>Nic nie liczy</strong>: wynik jest już ustalony. Trwa stałe {CZAS_PIJANEGO_S} s i kończy się
            wszystkim naraz: telefony gasną, a na TV wybucha szklanka. Potem werble i podium.
          </li>
          <li>
            <strong>Kolejność pytań:</strong> 3 losowe „O piwie” → ciekawostka (po {CIEKAWOSTKA_PIJANA.po}. pytaniu) →
            pytanie z imieniem zza baru, jeśli wpisano je w kreatorze (bez imienia jeszcze jedno „O piwie”) →
            „Odklejone” losowo, aż skończy się czas. Ile ich kto zobaczy, zależy od tempa.
          </li>
          <li>
            Ekran coraz mocniej faluje, a przeszkadzacze (drżenie, zamienione kolory, uciekające przyciski…) narastają
            zawsze w tej samej kolejności. Po każdej odpowiedzi komentarz i coraz dłuższa reakcja (1–3,5 s).
          </li>
          <li>Pytania są wspólne dla wszystkich quizów; edytuje się je pod finałem w każdym quizie z wyścigiem.</li>
        </ul>
      </section>
    </main>
  );
}

/** Tor finału: 12 kroków do piwa i trzech finalistów z przewagą 0, 1 i 2 kroki (przykład). */
function TorFinalu() {
  const gracze = [
    { nick: "Ania", start: 2, kolor: "var(--zloto)" },
    { nick: "Bartek", start: 1, kolor: "#7fb6e6" },
    { nick: "Celina", start: 0, kolor: "#e88ac0" },
  ];
  return (
    <figure className="zasady-tor">
      {gracze.map((g) => (
        <div key={g.nick} className="zasady-tor-rzad">
          <span className="zasady-tor-nick">{g.nick}</span>
          <div className="zasady-tor-pola">
            {Array.from({ length: META_FINALU }, (_, i) => (
              <span key={i} className={i < g.start ? "przewaga" : undefined}>
                {i === g.start && <i style={{ background: g.kolor }} />}
              </span>
            ))}
          </div>
          <IkonaEtapu ikona="/grafiki/etapy/na-jedno.webp" className="zasady-tor-piwo" />
        </div>
      ))}
      <figcaption>Przykład startu: przewaga 2, 1 i 0 kroków, do piwa {META_FINALU}</figcaption>
    </figure>
  );
}
