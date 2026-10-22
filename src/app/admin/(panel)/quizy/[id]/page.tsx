import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Quiz, Zadanie } from "@/lib/typy";
import { Miniatura } from "../../_komponenty/grafika";
import { IkonaKosz } from "../../_komponenty/ikony";
import { PrzyciskPotwierdz } from "../../_komponenty/przycisk-potwierdz";
import { przesunZadanie, usunZadanie } from "../akcje";
import { FORMULARZ_QUIZU, NaglowekQuizu } from "./naglowek-quizu";
import { NAZWY_TYPOW, opisRozwiazania } from "@/lib/zadania";

export const metadata: Metadata = { title: "Quiz · Bractwo Quiz" };

export default async function EdycjaQuizu({ params }: PageProps<"/admin/quizy/[id]">) {
  await wymagajAdmina();
  const { id } = await params;
  const db = supabaseAdmin();

  const [{ data: quiz }, { data: zadania }, { count: aktywneGry }] = await Promise.all([
    db.from("quizy").select("id, tytul, opis, utworzono").eq("id", id).maybeSingle<Quiz>(),
    db.from("zadania").select("*").eq("quiz_id", id).order("nr").returns<Zadanie[]>(),
    db.from("sesje").select("id", { count: "exact", head: true }).eq("quiz_id", id).neq("faza", "koniec"),
  ]);
  if (!quiz) notFound();
  const lista = zadania ?? [];

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/quizy">← Quizy</Link>
      </p>
      <NaglowekQuizu quiz={quiz} />
      {!!aktywneGry && (
        <p className="blad">
          Ten quiz jest teraz w trwającej grze. Zmiany w pytaniach gracze zobaczą od razu.
        </p>
      )}

      <section className="panel-sekcja">
        <h2>Pytania</h2>
        {lista.length > 0 ? (
          <ol className="lista">
            {lista.map((z, i) => (
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
            ))}
          </ol>
        ) : (
          <p className="lista-pusta">Quiz nie ma jeszcze pytań.</p>
        )}
        <p style={{ marginTop: 16 }}>
          <Link href={`/admin/quizy/${quiz.id}/zadania/nowe`} className="przycisk">
            + Dodaj pytanie
          </Link>
        </p>
      </section>

      <section className="panel-sekcja quiz-zapisz">
        <button type="submit" form={FORMULARZ_QUIZU} name="wroc" value="1" className="przycisk zloty">
          Zapisz quiz
        </button>
      </section>
    </main>
  );
}
