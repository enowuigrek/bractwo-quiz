import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { wymagajGlownego } from "@/lib/admin";
import { wymagajQuizu } from "@/lib/admin-dostep";
import { LIMITY_PIJANE, type PijanePytanie } from "@/lib/pijany";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { FormularzPijany } from "../../pijany-final/formularz";

export const metadata: Metadata = { title: "Pijany finał: wejście · Bractwo Quiz" };

/** Wejście pijanego finału dla jednego quizu: pierwsze pytania dogrywki, jeszcze na temat quizu. */
export default async function WejsciePijanego({ params }: PageProps<"/admin/quizy/[id]/pijany">) {
  const rola = await wymagajGlownego();
  const { id } = await params;
  await wymagajQuizu(rola, id);
  const db = supabaseAdmin();
  const [{ data: quiz }, { data, error }] = await Promise.all([
    db.from("quizy").select("id, tytul").eq("id", id).maybeSingle<{ id: string; tytul: string }>(),
    db
      .from("pijane_pytania_quizu")
      .select("nr, tresc, komentarz_prawda, komentarz_falsz")
      .eq("quiz_id", id)
      .order("nr")
      .returns<PijanePytanie[]>(),
  ]);
  if (!quiz) notFound();

  return (
    <main>
      <p className="okruchy">
        <Link href={`/admin/quizy/${quiz.id}`}>← {quiz.tytul}</Link>
      </p>
      <h1>Pijany finał: wejście</h1>
      <p className="pomocniczy">
        Pierwsze pytania pijanego finału w grach z tym quizem (najwyżej {LIMITY_PIJANE.wejscie}). Mają brzmieć jak
        dalszy ciąg prawdziwego finału, czyli na temat quizu, i z każdym coraz dziwniej. Lecą po kolei, a po nich
        wspólna pula z <Link href="/admin/quizy/pijany-final">Pijany finał: pytania</Link>. Bez wejścia dogrywka zaczyna
        się od razu od wspólnej puli. Nie powtarzaj faktów z pytań quizu.
      </p>
      {error ? (
        <p className="blad">Nie udało się pobrać pytań: {error.message}</p>
      ) : (
        <FormularzPijany pytania={data ?? []} quizId={quiz.id} />
      )}
    </main>
  );
}
