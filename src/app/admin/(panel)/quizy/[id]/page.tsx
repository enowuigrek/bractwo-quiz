import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Quiz, Zadanie } from "@/lib/typy";
import { Miniatura } from "../../_komponenty/grafika";
import { IkonaKosz } from "../../_komponenty/ikony";
import { PrzyciskPotwierdz } from "../../_komponenty/przycisk-potwierdz";
import { przesunZadanie, usunQuiz, usunZadanie } from "../akcje";
import { FormularzQuizu } from "../formularz-quizu";

export const metadata: Metadata = { title: "Quiz · Bractwo Quiz" };

const BLEDY: Record<string, string> = {
  gry: "Tego quizu nie da się usunąć, bo były na nim rozegrane gry. Najpierw usuń te gry w zakładce „Gry”.",
  usuwanie: "Nie udało się usunąć quizu.",
};

const LITERY = "ABCDEF";

export default async function EdycjaQuizu({ params, searchParams }: PageProps<"/admin/quizy/[id]">) {
  await wymagajAdmina();
  const { id } = await params;
  const { blad } = await searchParams;
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
      <h1>{quiz.tytul}</h1>
      {typeof blad === "string" && BLEDY[blad] && (
        <p className="blad" role="alert">
          {BLEDY[blad]}
        </p>
      )}
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
                    {z.czas_s} s · poprawna: {LITERY[z.dane.poprawna]}. {z.dane.odpowiedzi[z.dane.poprawna]}
                  </div>
                </div>
                <div className="lista-akcje">
                  <form action={przesunZadanie.bind(null, quiz.id, z.id, "gora")}>
                    <button className="przycisk-maly ikona" disabled={i === 0} aria-label="Przesuń wyżej" title="Wyżej">
                      ↑
                    </button>
                  </form>
                  <form action={przesunZadanie.bind(null, quiz.id, z.id, "dol")}>
                    <button
                      className="przycisk-maly ikona"
                      disabled={i === lista.length - 1}
                      aria-label="Przesuń niżej"
                      title="Niżej"
                    >
                      ↓
                    </button>
                  </form>
                  <PrzyciskPotwierdz
                    akcja={usunZadanie.bind(null, quiz.id, z.id)}
                    pytanie={`Usunąć pytanie ${i + 1}?`}
                    tytul="Usuń pytanie"
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
          <Link href={`/admin/quizy/${quiz.id}/zadania/nowe`} className="przycisk zloty">
            Dodaj pytanie
          </Link>
        </p>
      </section>

      <section className="panel-sekcja karta">
        <h2>Tytuł i opis</h2>
        <FormularzQuizu quiz={quiz} />
      </section>

      <section className="panel-sekcja">
        <PrzyciskPotwierdz
          akcja={usunQuiz.bind(null, quiz.id)}
          pytanie={`Usunąć quiz „${quiz.tytul}” razem ze wszystkimi pytaniami?`}
        >
          Usuń quiz
        </PrzyciskPotwierdz>
      </section>
    </main>
  );
}
