import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mozePijanyFinal, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { wymagajQuizu } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Etap, Quiz, Zadanie } from "@/lib/typy";
import { Miniatura } from "../../_komponenty/grafika";
import { IkonaKlodka, IkonaKosz } from "@/components/ikony";
import { PrzyciskPotwierdz } from "../../_komponenty/przycisk-potwierdz";
import { przesunEtap, przesunZadanie, ustawWidocznoscQuizu, usunEtap, usunZadanie, zmienPlanEtapu } from "../akcje";
import { NaglowekEtapu, NowyEtap } from "./etapy";
import { FORMULARZ_QUIZU, NaglowekQuizu } from "./naglowek-quizu";
import { NAZWY_TYPOW, opisRozwiazania } from "@/lib/zadania";

export const metadata: Metadata = { title: "Quiz · Bractwo Quiz" };

export default async function EdycjaQuizu({ params }: PageProps<"/admin/quizy/[id]">) {
  const rola = await wymagajAdmina();
  const { id } = await params;
  await wymagajQuizu(rola, id);
  const db = supabaseAdmin();

  const [{ data: quiz }, { data: zadania }, { data: etapyZBazy }, { count: aktywneGry }, { count: wejscie }] =
    await Promise.all([
      db.from("quizy").select("id, tytul, opis, utworzono, tylko_glowny").eq("id", id).maybeSingle<Quiz>(),
      db.from("zadania").select("*").eq("quiz_id", id).order("nr").returns<Zadanie[]>(),
      db.from("etapy").select("*").eq("quiz_id", id).order("nr").returns<Etap[]>(),
      db.from("sesje").select("id", { count: "exact", head: true }).eq("quiz_id", id).neq("faza", "koniec"),
      db.from("pijane_pytania_quizu").select("id", { count: "exact", head: true }).eq("quiz_id", id),
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

  const wiersz = (z: Zadanie) => {
    const i = lista.indexOf(z);
    return (
      <li key={z.id}>
        <span className="krok-nr" style={{ minWidth: "1.6em" }}>
          {i + 1}.
        </span>
        {z.grafika_url && <Miniatura src={z.grafika_url} alt="" />}
        <div className="lista-glowna">
          <div className="lista-tytul">
            <Link href={`/admin/quizy/${quiz.id}/zadania/${z.id}`}>{z.tresc}</Link>
          </div>
          <div className="lista-opis">
            {NAZWY_TYPOW[z.typ]} · {opisRozwiazania(z)}
            {z.dane.podpowiedzi?.length ? ` · podpowiedzi: ${z.dane.podpowiedzi.length}` : ""}
            {z.dane.odslaniaj ? " · odsłaniana grafika" : ""}
          </div>
        </div>
        <div className="lista-akcje">
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
        </div>
      </li>
    );
  };

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/quizy">← Quizy</Link>
      </p>
      <NaglowekQuizu quiz={quiz} />
      {/* tylko główny decyduje, czy obsługa (wspólne hasło) widzi ten quiz */}
      {widziWszystko(rola) && (
        <form action={ustawWidocznoscQuizu.bind(null, quiz.id, !quiz.tylko_glowny)} className="pomocniczy">
          {quiz.tylko_glowny ? (
            <>
              <IkonaKlodka /> Tylko dla mnie: obsługa nie widzi tego quizu.
            </>
          ) : (
            "Obsługa widzi ten quiz."
          )}{" "}
          <button type="submit" className="przycisk-maly">
            {quiz.tylko_glowny ? "Pokaż obsłudze" : "Ukryj przed obsługą"}
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
              />
            )}
            {wEtapie.length > 0 && <ol className="lista">{wEtapie.map(wiersz)}</ol>}
            {etap && (
              // miejsca na brakujące pytania z planu etapu, każde prowadzi do nowego pytania w tym etapie
              <ol className="etap-brakujace">
                {Array.from({ length: Math.max(0, (etap.plan_pytan ?? 0) - wEtapie.length) }, (_, i) => (
                  <li key={i}>
                    <Link href={`/admin/quizy/${quiz.id}/zadania/nowe?etap=${etap.id}`}>
                      + pytanie {wEtapie.length + i + 1} z {etap.plan_pytan}
                    </Link>
                  </li>
                ))}
                {(etap.plan_pytan ?? 0) <= wEtapie.length && (
                  <li className="etap-brakujace-dodaj">
                    <Link href={`/admin/quizy/${quiz.id}/zadania/nowe?etap=${etap.id}`}>+ pytanie w tym etapie</Link>
                  </li>
                )}
              </ol>
            )}
          </div>
        ))}
        <p style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link href={`/admin/quizy/${quiz.id}/zadania/nowe`} className="przycisk">
            + Dodaj pytanie
          </Link>
        </p>
        {/* klasyczny pub quiz (bez etapów) zostaje bez etapów, a turniej ma etapy z szablonu */}
        {etapy.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <NowyEtap quizId={quiz.id} />
          </div>
        )}
      </section>

      {/* obsługa nie wie o pijanym finale; jest tylko po finale wyścigu po piwo (klasyczny pub quiz go nie ma) */}
      {mozePijanyFinal(rola) && etapy.some((e) => e.finalowy && e.seria) && (
        <section className="panel-sekcja">
          <h2>Pijany finał: wejście</h2>
          <p className="pomocniczy" style={{ marginTop: 0 }}>
            {wejscie
              ? `Pytań wejścia: ${wejscie}. Dogrywka zaczyna się od nich (na temat quizu), potem wspólna pula.`
              : "Bez wejścia: dogrywka zaczyna się od razu od wspólnej puli."}{" "}
            <Link href={`/admin/quizy/${quiz.id}/pijany`} className="przycisk-maly">
              Edytuj wejście
            </Link>
          </p>
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
