import type { Metadata } from "next";
import Link from "next/link";
import { mozePijanyFinal, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { widoczne } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { IkonaEdytuj, IkonaKosz } from "../_komponenty/ikony";
import { PrzyciskPotwierdz } from "../_komponenty/przycisk-potwierdz";
import { usunQuiz } from "./akcje";
import { liczbaPytan } from "./limity";

export const metadata: Metadata = { title: "Quizy · Bractwo Quiz" };

type QuizNaLiscie = {
  id: string;
  tytul: string;
  opis: string | null;
  tylko_glowny: boolean;
  zadania: { count: number }[];
};

const BLEDY: Record<string, string> = {
  gry: "Tego quizu nie da się usunąć, bo były na nim rozegrane gry. Najpierw usuń te gry w zakładce „Gry”.",
  usuwanie: "Nie udało się usunąć quizu.",
};

export default async function Quizy({ searchParams }: PageProps<"/admin/quizy">) {
  const rola = await wymagajAdmina();
  const { blad } = await searchParams;
  const { data, error } = await supabaseAdmin()
    .from("quizy")
    .select("id, tytul, opis, tylko_glowny, zadania(count)")
    .in("tylko_glowny", widoczne(rola))
    .order("utworzono", { ascending: false })
    .returns<QuizNaLiscie[]>();

  return (
    <main>
      <h1>Quizy</h1>
      {typeof blad === "string" && BLEDY[blad] && (
        <p className="blad" role="alert">
          {BLEDY[blad]}
        </p>
      )}
      {error && <p className="blad">Nie udało się pobrać quizów: {error.message}</p>}
      {data && data.length > 0 ? (
        <ul className="lista">
          {data.map((q) => (
            <li key={q.id}>
              <div className="lista-glowna">
                <div className="lista-tytul">
                  <Link href={`/admin/quizy/${q.id}`}>{q.tytul}</Link>
                </div>
                <div className="lista-opis">
                  {/* obsługa takich nie widzi, więc znacznik ma sens tylko u głównego */}
                  {widziWszystko(rola) && q.tylko_glowny && "🔒 tylko dla mnie · "}
                  {liczbaPytan(q.zadania[0]?.count ?? 0)}
                  {q.opis && ` · ${q.opis}`}
                </div>
              </div>
              <div className="lista-akcje">
                <Link
                  href={`/admin/quizy/${q.id}`}
                  className="przycisk-maly ikona"
                  aria-label={`Edytuj quiz ${q.tytul}`}
                  data-podpis="Edytuj"
                >
                  <IkonaEdytuj />
                </Link>
                <PrzyciskPotwierdz
                  akcja={usunQuiz.bind(null, q.id)}
                  pytanie={`Usunąć quiz „${q.tytul}” razem ze wszystkimi pytaniami?`}
                  tytul="Usuń"
                  className="przycisk-maly ikona niebezpieczny"
                >
                  <IkonaKosz />
                </PrzyciskPotwierdz>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !error && <p className="lista-pusta">Nie ma jeszcze żadnego quizu.</p>
      )}

      <p className="panel-sekcja" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/admin/quizy/nowy" className="przycisk zloty">
          Nowy quiz
        </Link>
        {/* pytania dogrywki „Pijany finał”, wspólne dla wszystkich gier; obsługa nie wie o tym trybie */}
        {mozePijanyFinal(rola) && (
          <Link href="/admin/quizy/pijany-final" className="przycisk">
            Pijany finał: pytania
          </Link>
        )}
      </p>
    </main>
  );
}
