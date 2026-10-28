import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mozePijanyFinal, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { wymagajQuizu } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Etap, Quiz, Zadanie } from "@/lib/typy";
import { Miniatura } from "../../_komponenty/grafika";
import { IkonaKosz } from "@/components/ikony";
import { PrzyciskPotwierdz } from "../../_komponenty/przycisk-potwierdz";
import {
  przesunEtap,
  przesunZadanie,
  przywrocQuiz,
  usunEtap,
  usunZadanie,
  zmienPlanEtapu,
} from "../akcje";
import { NaglowekEtapu, NowyEtap } from "./etapy";
import { WklejPytania } from "./wklej";
import { UdostepnijLokalom } from "./udostepnij-lokalom";
import { FORMULARZ_QUIZU, NaglowekQuizu } from "./naglowek-quizu";
import { NAZWY_TYPOW, opisRozwiazania, type TypZadania } from "@/lib/zadania";
import { NowePytanie, ZadanieNaLiscie } from "./zadanie-na-liscie";
import { BlokPijany } from "./blok-pijany";
import type { PijanePytanie } from "@/lib/pijany";

export const metadata: Metadata = { title: "Quiz · Bractwo Quiz" };

export default async function EdycjaQuizu({ params }: PageProps<"/admin/quizy/[id]">) {
  const rola = await wymagajAdmina();
  const { id } = await params;
  // lokal ogląda quiz Bractwa bez zmian (gra nim, ale nie edytuje i nie usuwa)
  const { mozeZmieniac } = await wymagajQuizu(rola, id, true);
  const db = supabaseAdmin();

  const [
    { data: quiz },
    { data: zadania },
    { data: etapyZBazy },
    { count: aktywneGry },
    { data: wejscie },
    { data: pulaPijana },
  ] =
    await Promise.all([
      db
        .from("quizy")
        .select("id, tytul, opis, utworzono, tylko_glowny, tagi, usunieto, lokal_id")
        .eq("id", id)
        .maybeSingle<Quiz & { usunieto: string | null; lokal_id: string | null }>(),
      db.from("zadania").select("*").eq("quiz_id", id).order("nr").returns<Zadanie[]>(),
      db.from("etapy").select("*").eq("quiz_id", id).order("nr").returns<Etap[]>(),
      db.from("sesje").select("id", { count: "exact", head: true }).eq("quiz_id", id).neq("faza", "koniec"),
      db
        .from("pijane_pytania_quizu")
        .select("nr, tresc, komentarz_prawda, komentarz_falsz")
        .eq("quiz_id", id)
        .order("nr")
        .returns<PijanePytanie[]>(),
      db
        .from("pijane_pytania")
        .select("nr, tresc, komentarz_prawda, komentarz_falsz, piwne")
        .order("nr")
        .returns<PijanePytanie[]>(),
    ]);
  if (!quiz) notFound();
  const lista = zadania ?? [];
  const etapy = etapyZBazy ?? [];
  // grupy do pokazania: pytania bez etapu (quiz bez etapów) i po kolei etapy z ich pytaniami
  const bezEtapu = lista.filter((z) => !z.etap_id || !etapy.some((e) => e.id === z.etap_id));
  const grupy: { etap: Etap | null; zadania: Zadanie[] }[] = [
    ...(bezEtapu.length || !etapy.length ? [{ etap: null, zadania: bezEtapu }] : []),
    ...etapy.map((e) => ({ etap: e, zadania: lista.filter((z) => z.etap_id === e.id) })),
  ];

  if (!mozeZmieniac) {
    return (
      <main>
        <p className="okruchy">
          <Link href="/admin/quizy">← Quizy</Link>
        </p>
        <h1>{quiz.tytul}</h1>
        <p className="pomocniczy">
          Quiz Bractwa: możesz go uruchamiać w swoim lokalu, ale nie zmieniać.
        </p>
        <section className="panel-sekcja">
          <h2>{etapy.length ? "Etapy i pytania" : "Pytania"}</h2>
          {grupy.map(({ etap, zadania: wEtapie }) => (
            <div key={etap?.id ?? "bez-etapu"} className="etap-blok">
              {etap && (
                <h3>
                  {etap.nr}. {etap.nazwa}
                </h3>
              )}
              {wEtapie.length > 0 && (
                <ol className="lista">
                  {wEtapie.map((z) => (
                    <li key={z.id}>
                      <span className="krok-nr" style={{ minWidth: "1.6em" }}>
                        {lista.indexOf(z) + 1}.
                      </span>
                      {z.grafika_url && <Miniatura src={z.grafika_url} alt="" />}
                      <div className="lista-glowna">
                        <div className="lista-tytul">{z.tresc}</div>
                        <div className="lista-opis">
                          {NAZWY_TYPOW[z.typ]} · {opisRozwiazania(z)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </section>
      </main>
    );
  }

  // klasyczny quiz (bez etapów): nowe pytanie ma rodzaj ostatniego pytania
  const ostatniTyp = lista.filter((z) => z.typ !== "ciekawostka").at(-1)?.typ;
  // rodzaje pytań każdego etapu (rodzaj domyślny i te, które już w nim są): edytor podsuwa tylko je
  const typyEtapow: Record<string, TypZadania[]> = Object.fromEntries(
    etapy.map((e) => [
      e.id,
      [
        ...new Set([
          ...(e.typ_domyslny ? [e.typ_domyslny] : []),
          ...lista.filter((z) => z.etap_id === e.id && z.typ !== "ciekawostka").map((z) => z.typ),
        ]),
      ],
    ]),
  );

  // pytania edytuje się rozwinięte na liście (28.10), nie na osobnej stronie
  const wiersz = (z: Zadanie) => {
    const i = lista.indexOf(z);
    return (
      <ZadanieNaLiscie
        key={z.id}
        id={z.id}
        edytor={{ quizId: quiz.id, typyEtapow, zadanie: z, etapy, domyslnyEtap: z.etap_id }}
        naglowek={
          <>
            <span className="krok-nr" style={{ minWidth: "1.6em" }}>
              {i + 1}.
            </span>
            {z.grafika_url && <Miniatura src={z.grafika_url} alt="" />}
            <div className="lista-glowna">
              <div className="lista-tytul">{z.tresc}</div>
              <div className="lista-opis">
                <span className={`rodzaj-pytania ${z.typ}`}>{NAZWY_TYPOW[z.typ]}</span> {opisRozwiazania(z)}
                {z.dane.podpowiedzi?.length ? ` · podpowiedzi: ${z.dane.podpowiedzi.length}` : ""}
                {z.dane.odslaniaj ? " · odsłaniana grafika" : ""}
              </div>
            </div>
          </>
        }
        akcje={
          <>
          <form action={przesunZadanie.bind(null, quiz.id, z.id, "gora")}>
            <button className="przycisk-maly ikona" disabled={i === 0} aria-label="Przesuń wyżej" data-podpis="Wyżej">
              ↑
            </button>
          </form>
          <form action={przesunZadanie.bind(null, quiz.id, z.id, "dol")}>
            <button
              className="przycisk-maly ikona"
              disabled={i === lista.length - 1}
              aria-label="Przesuń niżej"
              data-podpis="Niżej"
            >
              ↓
            </button>
          </form>
          <PrzyciskPotwierdz
            akcja={usunZadanie.bind(null, quiz.id, z.id)}
            pytanie={`Usunąć pytanie ${i + 1}?`}
            tytul="Usuń"
            className="przycisk-maly ikona niebezpieczny"
          >
            <IkonaKosz />
          </PrzyciskPotwierdz>
          </>
        }
      />
    );
  };

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/quizy">← Quizy</Link>
      </p>
      <NaglowekQuizu quiz={quiz} />
      {/* tylko główny decyduje, czy lokale widzą jego quiz (do grania); quizów lokali to nie dotyczy */}
      {widziWszystko(rola) && !quiz.lokal_id && (
        <UdostepnijLokalom quizId={quiz.id} udostepniony={!quiz.tylko_glowny} />
      )}
      {quiz.usunieto && (
        <form action={przywrocQuiz.bind(null, quiz.id)} className="blad" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          Ten quiz jest w koszu: nie ma go na liście ani przy uruchamianiu gry.
          <button type="submit" className="przycisk-maly">
            Przywróć
          </button>
        </form>
      )}
      {!!aktywneGry && (
        <p className="blad">Ten quiz jest teraz w trwającej grze. Zmiany w pytaniach gracze zobaczą od razu.</p>
      )}

      <section className="panel-sekcja">
        <h2>{etapy.length ? "Etapy i pytania" : "Pytania"}</h2>
        {etapy.length > 0 && (
          <p className="pomocniczy" style={{ marginTop: 0 }}>
            Przed każdym etapem TV pokazuje planszę z zasadami, a prowadzący startuje etap z pilota. Strzałka na granicy
            etapu przenosi pytanie do sąsiedniego etapu.
          </p>
        )}
        {lista.length === 0 && etapy.length === 0 && <p className="lista-pusta">Quiz nie ma jeszcze pytań.</p>}
        {grupy.map(({ etap, zadania: wEtapie }) => (
          <div key={etap?.id ?? "bez-etapu"} className="etap-blok">
            {etap && (
              <NaglowekEtapu
                quizId={quiz.id}
                etap={etap}
                pytan={wEtapie.length}
                plan={
                  <span className="etap-plan">
                    <form action={zmienPlanEtapu.bind(null, quiz.id, etap.id, -1)}>
                      <button
                        className="przycisk-maly ikona"
                        disabled={(etap.plan_pytan ?? wEtapie.length) <= 1}
                        aria-label={`Mniej pytań w etapie ${etap.nr}`}
                        data-podpis="Mniej pytań"
                      >
                        −
                      </button>
                    </form>
                    <form action={zmienPlanEtapu.bind(null, quiz.id, etap.id, 1)}>
                      <button
                        className="przycisk-maly ikona"
                        aria-label={`Więcej pytań w etapie ${etap.nr}`}
                        data-podpis="Więcej pytań"
                      >
                        +
                      </button>
                    </form>
                  </span>
                }
                akcje={
                  <>
                    <form action={przesunEtap.bind(null, quiz.id, etap.id, "gora")}>
                      <button
                        className="przycisk-maly ikona"
                        disabled={etap.nr === 1}
                        aria-label={`Przesuń etap ${etap.nr} wyżej`}
                        data-podpis="Wyżej"
                      >
                        ↑
                      </button>
                    </form>
                    <form action={przesunEtap.bind(null, quiz.id, etap.id, "dol")}>
                      <button
                        className="przycisk-maly ikona"
                        disabled={etap.nr === etapy.length}
                        aria-label={`Przesuń etap ${etap.nr} niżej`}
                        data-podpis="Niżej"
                      >
                        ↓
                      </button>
                    </form>
                    <PrzyciskPotwierdz
                      akcja={usunEtap.bind(null, quiz.id, etap.id)}
                      pytanie={
                        wEtapie.length
                          ? `Usunąć etap „${etap.nazwa}”? Jego pytania przejdą do sąsiedniego etapu.`
                          : `Usunąć etap „${etap.nazwa}”?`
                      }
                      tytul="Usuń etap"
                      className="przycisk-maly ikona niebezpieczny"
                    >
                      <IkonaKosz />
                    </PrzyciskPotwierdz>
                  </>
                }
              >
                {wEtapie.length > 0 && <ol className="lista">{wEtapie.map(wiersz)}</ol>}
                {/* miejsca na brakujące pytania z planu etapu, każde rozwija nowe pytanie w tym etapie */}
                <ol className="etap-brakujace">
                  {Array.from({ length: Math.max(0, (etap.plan_pytan ?? 0) - wEtapie.length) }, (_, i) => (
                    <li key={i}>
                      <NowePytanie
                        napis={`+ pytanie ${wEtapie.length + i + 1} z ${etap.plan_pytan}`}
                        edytor={{ quizId: quiz.id, typyEtapow, etapy, domyslnyEtap: etap.id, domyslnyTyp: etap.typ_domyslny ?? undefined }}
                      />
                    </li>
                  ))}
                  {(etap.plan_pytan ?? 0) <= wEtapie.length && (
                    <li className="etap-brakujace-dodaj">
                      <NowePytanie
                        napis="+ pytanie w tym etapie"
                        edytor={{ quizId: quiz.id, typyEtapow, etapy, domyslnyEtap: etap.id, domyslnyTyp: etap.typ_domyslny ?? undefined }}
                      />
                    </li>
                  )}
                </ol>
              </NaglowekEtapu>
            )}
            {!etap && wEtapie.length > 0 && <ol className="lista">{wEtapie.map(wiersz)}</ol>}
          </div>
        ))}
        {/* pytania pijanego finału zmienia tylko główny; jest tylko po finale wyścigu po piwo i stoi jak etapy:
            wejście tego quizu, potem wspólna pula wszystkich quizów */}
        {mozePijanyFinal(rola) && etapy.some((e) => e.finalowy && e.seria) && (
          <>
            <BlokPijany quizId={quiz.id} pytania={wejscie ?? []} />
            <BlokPijany pytania={pulaPijana ?? []} />
          </>
        )}
        {/* quiz z etapami dodaje pytania w swoich etapach (wyżej), a klasyczny wierszem pod listą, rozwijanym jak
            pytania (28.10: przycisk, który się rozwija, wyglądał źle) */}
        {etapy.length === 0 && (
          <ol className="etap-brakujace">
            <li className="etap-brakujace-dodaj">
              <NowePytanie napis="+ pytanie" edytor={{ quizId: quiz.id, typyEtapow, etapy, domyslnyEtap: null, domyslnyTyp: ostatniTyp }} />
            </li>
          </ol>
        )}
        {/* klasyczny pub quiz (bez etapów) zostaje bez etapów, a turniej ma etapy z szablonu */}
        {etapy.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <NowyEtap quizId={quiz.id} />
          </div>
        )}
      </section>

      {/* klasyczny quiz: pytania hurtem z tekstu (np. z AI według promptu) */}
      {etapy.length === 0 && (
        <section className="panel-sekcja">
          <h2>Pytania z AI</h2>
          <WklejPytania quizId={quiz.id} temat={[quiz.tytul, ...quiz.tagi].join(", ")} />
        </section>
      )}


      <section className="panel-sekcja quiz-zapisz">
        <button type="submit" form={FORMULARZ_QUIZU} name="wroc" value="1" className="przycisk zloty">
          Zapisz quiz
        </button>
      </section>
    </main>
  );
}
