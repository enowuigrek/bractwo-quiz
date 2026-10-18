import type { Metadata } from "next";
import Link from "next/link";
import { wymagajAdmina } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { FormularzQuizu } from "./formularz-quizu";

export const metadata: Metadata = { title: "Quizy · Bractwo Quiz" };

type QuizNaLiscie = { id: string; tytul: string; opis: string | null; zadania: { count: number }[] };

function liczbaPytan(n: number): string {
  if (n === 1) return "1 pytanie";
  const r10 = n % 10;
  const r100 = n % 100;
  return `${n} ${r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14) ? "pytania" : "pytań"}`;
}

export default async function Quizy() {
  await wymagajAdmina();
  const { data, error } = await supabaseAdmin()
    .from("quizy")
    .select("id, tytul, opis, zadania(count)")
    .order("utworzono", { ascending: false })
    .returns<QuizNaLiscie[]>();

  return (
    <main>
      <h1>Quizy</h1>
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
                  {liczbaPytan(q.zadania[0]?.count ?? 0)}
                  {q.opis && ` · ${q.opis}`}
                </div>
              </div>
              <div className="lista-akcje">
                <Link href={`/admin/quizy/${q.id}`} className="przycisk-maly">
                  Otwórz
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !error && <p className="lista-pusta">Nie ma jeszcze żadnego quizu.</p>
      )}

      <section className="panel-sekcja karta">
        <h2>Nowy quiz</h2>
        <FormularzQuizu />
      </section>
    </main>
  );
}
